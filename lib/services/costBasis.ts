/**
 * Serwis Cost Basis — algorytm FIFO dla walutowych wydatków.
 *
 * Odpowiada na pytanie: "Ile PLN kosztowały te EUR, które właśnie wydałem?"
 * na podstawie historii zakupu waluty (FxLot).
 *
 * Używany przez:
 *  - POST /api/transactions  (wydatek z sub-koperty walutowej)
 *  - POST /api/transfer      (cross-currency: tworzy FxLot przy zasileniu sub-koperty)
 */

import { Prisma } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'

// ---------------------------------------------------------------------------
// Błędy domenowe
// ---------------------------------------------------------------------------

export class InsufficientFxLotsError extends Error {
  readonly envelopeId: string
  readonly requested: Prisma.Decimal
  readonly available: Prisma.Decimal

  constructor(envelopeId: string, requested: Prisma.Decimal, available: Prisma.Decimal) {
    super(
      `Brak historii zakupu waluty dla koperty ${envelopeId}. ` +
      `Żądano: ${requested}, dostępne w lotach: ${available}. ` +
      'Zasil sub-kopertę transferem walutowym przed dodaniem wydatku.'
    )
    this.name = 'InsufficientFxLotsError'
    this.envelopeId = envelopeId
    this.requested = requested
    this.available = available
  }
}

// ---------------------------------------------------------------------------
// Typy wynikowe
// ---------------------------------------------------------------------------

export interface FifoConsumeResult {
  /** Koszt historyczny wydatku wyrażony w PLN (zaokrąglony do 4 miejsc). */
  plnEquivalent: Prisma.Decimal
  /** Szczegóły konsumpcji — które loty zostały naruszone. */
  consumedLots: ConsumedLot[]
  /** true jeśli część kwoty pokryta przez fallback (kurs ostatniego lotu). */
  usedFallback: boolean
}

export interface ConsumedLot {
  lotId: string
  consumedAmount: Prisma.Decimal
  exchangeRate: Prisma.Decimal
  plnValue: Prisma.Decimal
}

export interface CreateFxLotInput {
  userId: string
  envelopeId: string
  date: Date
  /** Kwota w walucie obcej (np. 300 EUR). */
  foreignAmount: Prisma.Decimal | number
  /** Zapłacona kwota w PLN (np. 1290 PLN). */
  costBasisPln: Prisma.Decimal | number
  /** Kurs wymiany PLN/waluta (opcjonalnie — obliczany z kwot jeśli brak). */
  exchangeRate?: Prisma.Decimal | number
  /** ID transferu, który wygenerował ten lot. */
  sourceTransactionId?: string
  /** Waluta obca lotu (np. EUR, USD, GBP). Domyślnie EUR. */
  foreignCurrency?: string
}

// ---------------------------------------------------------------------------
// Funkcje pomocnicze dla Decimal
// ---------------------------------------------------------------------------

function toDecimal(value: Prisma.Decimal | number | string): Prisma.Decimal {
  return new Prisma.Decimal(value)
}

function decimalMax(a: Prisma.Decimal, b: Prisma.Decimal): Prisma.Decimal {
  return a.greaterThan(b) ? a : b
}

const ZERO = new Prisma.Decimal(0)
const EPSILON = new Prisma.Decimal('0.0001') // próg dla "praktycznie zero"

// ---------------------------------------------------------------------------
// Główna logika FIFO
// ---------------------------------------------------------------------------

/**
 * Konsumuje loty FIFO dla danej koperty i zwraca koszt historyczny w PLN.
 *
 * Musi być wywołana wewnątrz `prisma.$transaction` — mutuje FxLoty w bazie.
 *
 * Poziomy fallbacku:
 *  1. Nominalne FIFO — konsumuje kolejne loty od najstarszego.
 *  2. Miękki fallback — jeśli loty się wyczerpały, resztę przelicza po kursie
 *     ostatniego lotu (zapis w `usedFallback = true` + warning do konsoli).
 *  3. Twardy błąd (`InsufficientFxLotsError`) — jeśli brak jakichkolwiek lotów
 *     (kolejka całkowicie pusta). Transakcja zostaje wycofana.
 *
 * @param tx        — klient Prisma w ramach aktywnej transakcji
 * @param envelopeId — ID sub-koperty walutowej
 * @param foreignAmount — kwota do skonsumowania (w walucie obcej)
 */
export async function consumeFxLotsFifo(
  tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  envelopeId: string,
  foreignAmount: Prisma.Decimal | number,
  foreignCurrency?: string
): Promise<FifoConsumeResult> {
  const requested = toDecimal(foreignAmount)

  if (requested.lessThanOrEqualTo(ZERO)) {
    throw new RangeError(`consumeFxLotsFifo: kwota musi być > 0, otrzymano ${requested}`)
  }

  // Pobierz loty z niezerowym saldem, posortowane FIFO (najstarsze pierwsze)
  // Filtruj po walucie jeśli podana (PLN-koperty z wieloma walutami)
  const lots = await tx.fxLot.findMany({
    where: {
      envelopeId,
      remainingAmount: { gt: ZERO },
      ...(foreignCurrency ? { foreignCurrency } : {}),
    },
    orderBy: { date: 'asc' },
  })

  // Poziom 3 — twardy błąd: brak jakichkolwiek lotów
  if (lots.length === 0) {
    throw new InsufficientFxLotsError(envelopeId, requested, ZERO)
  }

  // Całkowita dostępna pula (do diagnostyki)
  const totalAvailable = lots.reduce(
    (sum, lot) => sum.plus(lot.remainingAmount),
    ZERO
  )

  let toConsume = requested
  let plnEquivalent = ZERO
  const consumedLots: ConsumedLot[] = []
  let lastRate = lots[lots.length - 1].exchangeRate

  // Poziom 1 — nominalne FIFO
  for (const lot of lots) {
    if (toConsume.lessThanOrEqualTo(ZERO)) break

    lastRate = lot.exchangeRate
    const available = lot.remainingAmount
    const consumed  = available.lessThan(toConsume) ? available : toConsume
    const plnValue  = consumed.mul(lot.exchangeRate)

    plnEquivalent = plnEquivalent.plus(plnValue)
    toConsume     = toConsume.minus(consumed)

    const newRemaining = available.minus(consumed)

    // Zapisz zaktualizowane saldo lotu
    await tx.fxLot.update({
      where: { id: lot.id },
      data:  { remainingAmount: newRemaining },
    })

    consumedLots.push({
      lotId:          lot.id,
      consumedAmount: consumed,
      exchangeRate:   lot.exchangeRate,
      plnValue,
    })
  }

  // Poziom 2 — miękki fallback: kolejka wyczerpana, reszta po kursie ostatniego lotu
  const usedFallback = toConsume.greaterThan(EPSILON)
  if (usedFallback) {
    const fallbackPln = toConsume.mul(lastRate)
    plnEquivalent = plnEquivalent.plus(fallbackPln)

    console.warn(
      `[costBasis] FIFO fallback dla koperty ${envelopeId}: ` +
      `brakuje ${toConsume.toFixed(6)} jed. — ` +
      `przeliczono @ ${lastRate.toFixed(6)} PLN/jed. (kurs ostatniego lotu). ` +
      `Łącznie dostępne było: ${totalAvailable.toFixed(6)}.`
    )
  }

  return {
    plnEquivalent: plnEquivalent.toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP),
    consumedLots,
    usedFallback,
  }
}

// ---------------------------------------------------------------------------
// Tworzenie FxLot przy transferze walutowym
// ---------------------------------------------------------------------------

/**
 * Tworzy nowy FxLot przy zasileniu sub-koperty walutowej.
 * Wywołaj wewnątrz `prisma.$transaction` razem z aktualizacją sald kopert.
 */
export async function createFxLot(
  tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  input: CreateFxLotInput
) {
  const foreignAmount = toDecimal(input.foreignAmount)
  const costBasisPln  = toDecimal(input.costBasisPln)

  if (foreignAmount.lessThanOrEqualTo(ZERO)) {
    throw new RangeError(`createFxLot: foreignAmount musi być > 0, otrzymano ${foreignAmount}`)
  }
  if (costBasisPln.lessThan(ZERO)) {
    throw new RangeError(`createFxLot: costBasisPln nie może być ujemny, otrzymano ${costBasisPln}`)
  }

  // Kurs: z inputu lub wyliczony z kwot
  const exchangeRate = input.exchangeRate !== undefined
    ? toDecimal(input.exchangeRate)
    : foreignAmount.greaterThan(ZERO)
      ? costBasisPln.div(foreignAmount).toDecimalPlaces(6, Prisma.Decimal.ROUND_HALF_UP)
      : ZERO

  return tx.fxLot.create({
    data: {
      userId:              input.userId,
      envelopeId:          input.envelopeId,
      date:                input.date,
      originalAmount:      foreignAmount,
      remainingAmount:     foreignAmount,
      costBasisPln,
      exchangeRate,
      foreignCurrency:     input.foreignCurrency ?? 'EUR',
      sourceTransactionId: input.sourceTransactionId ?? null,
    },
  })
}

// ---------------------------------------------------------------------------
// Pomocnicze: aktualne saldo FIFO (suma remainingAmount)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Podsumowanie portfela walutowego koperty (FX Pocket)
// ---------------------------------------------------------------------------

/**
 * Zwraca podsumowanie aktywnych lotów walutowych dla danej koperty.
 * Jeśli brak lotów, zwraca null.
 */
export async function getFxLotsSummary(
  tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  envelopeId: string
): Promise<{ currency: string; available: number; rateAvg: number } | null> {
  const lots = await tx.fxLot.findMany({
    where: { envelopeId, remainingAmount: { gt: new Prisma.Decimal(0) } },
    orderBy: { date: 'asc' },
  })
  if (lots.length === 0) return null
  const totalRemaining = lots.reduce((s, l) => s.plus(l.remainingAmount), new Prisma.Decimal(0))
  const totalCostPln = lots.reduce((s, l) => s.plus(l.remainingAmount.mul(l.exchangeRate)), new Prisma.Decimal(0))
  const avgRate = totalRemaining.greaterThan(0) ? totalCostPln.div(totalRemaining) : new Prisma.Decimal(0)
  return {
    currency: lots[0].foreignCurrency,
    available: totalRemaining.toDecimalPlaces(4).toNumber(),
    rateAvg: avgRate.toDecimalPlaces(4).toNumber(),
  }
}

/**
 * Zwraca sumę dostępnych środków walutowych w kolejce FIFO danej koperty.
 * Przydatne do walidacji przed zapisem wydatku.
 */
export async function getFxAvailableBalance(
  tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  envelopeId: string
): Promise<Prisma.Decimal> {
  const result = await tx.fxLot.aggregate({
    where: { envelopeId, remainingAmount: { gt: ZERO } },
    _sum:  { remainingAmount: true },
  })
  return result._sum.remainingAmount ?? ZERO
}
