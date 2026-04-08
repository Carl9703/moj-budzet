/**
 * Skrypt migracji: CurrencyWallet → Envelope (z currencyCode) + FxLot (FIFO)
 *
 * Co robi:
 *  1. Dla każdego aktywnego CurrencyWallet tworzy sub-kopertę (Envelope z currencyCode).
 *  2. Dla każdej transakcji exchange_in tworzy FxLot z kosztem nabycia (PLN).
 *  3. Dla każdego wydatku (expense) tworzy Transaction na nowej kopercie
 *     z plnEquivalent obliczonym przez FIFO na podstawie historycznych lotów.
 *  4. Aktualizuje remainingAmount każdego FxLotu po przejściu FIFO.
 *  5. Oznacza stary CurrencyWallet jako nieaktywny (isActive = false).
 *
 * Uruchomienie:
 *   node -r ts-node/register scripts/migrate-wallets-to-envelopes.ts
 *   lub:
 *   npx tsx scripts/migrate-wallets-to-envelopes.ts
 *
 * WAŻNE: Uruchom na bazie DEV najpierw. Skrypt jest idempotentny —
 * przetwarza tylko portfele z isActive = true.
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs'

// Załaduj .env.local jeśli istnieje (tak samo jak setup-env.js)
if (fs.existsSync('.env.local')) {
  const lines = fs.readFileSync('.env.local', 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (key && !process.env[key]) {
      process.env[key] = value
    }
  }
}

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// Typy pomocnicze
// ---------------------------------------------------------------------------

interface FifoSlot {
  id: string
  remaining: number   // liczba zmiennoprzecinkowa — używamy tylko w skrypcie
  rate: number        // kurs PLN/waluta
}

interface FifoResult {
  plnEquivalent: number
  usedFallback: boolean
  fallbackAmount: number
  fallbackRate: number
}

/**
 * Lokalny algorytm FIFO dla skryptu migracyjnego.
 * Mutuje tablicę `queue` (odejmuje skonsumowane kwoty).
 *
 * Fallback (Poziom 2): jeśli kolejka nie pokrywa całości `foreignAmount`,
 * brakująca reszta jest przeliczana po kursie ostatniego lotu.
 * Fallback (Poziom 3 — twardy błąd): jeśli kolejka jest zupełnie pusta
 * (brak jakichkolwiek lotów), rzuca wyjątek.
 */
function consumeFifoLocal(queue: FifoSlot[], foreignAmount: number): FifoResult {
  if (queue.length === 0) {
    throw new Error(
      `InsufficientFxLotsError: brak lotów FIFO dla kwoty ${foreignAmount}. ` +
      'Portfel walutowy nie miał żadnych transakcji exchange_in.'
    )
  }

  let plnEquivalent = 0
  let toConsume = foreignAmount
  let lastRate = queue[queue.length - 1].rate

  for (const slot of queue) {
    if (toConsume <= 0) break
    if (slot.remaining <= 0) continue

    lastRate = slot.rate
    const consumed = Math.min(slot.remaining, toConsume)
    plnEquivalent += consumed * slot.rate
    slot.remaining = roundDecimal(slot.remaining - consumed, 8)
    toConsume = roundDecimal(toConsume - consumed, 8)
  }

  const usedFallback = toConsume > 0
  if (usedFallback) {
    // Fallback Poziom 2: przelicz resztę po kursie ostatniego lotu
    plnEquivalent += toConsume * lastRate
    console.warn(
      `    ⚠  FIFO fallback: brakuje ${toConsume.toFixed(6)} jednostek — ` +
      `przeliczono @ ${lastRate.toFixed(6)} PLN/jed. (ostatni lot)`
    )
  }

  return {
    plnEquivalent: roundDecimal(plnEquivalent, 4),
    usedFallback,
    fallbackAmount: usedFallback ? toConsume : 0,
    fallbackRate: lastRate,
  }
}

/** Zaokrągla liczbę do `places` miejsc dziesiętnych (unika float drift). */
function roundDecimal(value: number, places: number): number {
  const factor = Math.pow(10, places)
  return Math.round(value * factor) / factor
}

// ---------------------------------------------------------------------------
// Główna logika migracji
// ---------------------------------------------------------------------------

async function migrateWallet(walletId: string): Promise<void> {
  // Pobierz portfel z transakcjami posortowanymi chronologicznie
  const wallet = await prisma.currencyWallet.findUnique({
    where: { id: walletId },
    include: {
      transactions: {
        orderBy: { date: 'asc' },
      },
    },
  })

  if (!wallet) throw new Error(`Portfel ${walletId} nie istnieje.`)
  if (!wallet.isActive) {
    console.log(`  ↩  Pomijam — portfel już zdeprecjonowany.`)
    return
  }

  const exchangeIns = wallet.transactions.filter(t => t.type === 'exchange_in')
  const expenses    = wallet.transactions.filter(t => t.type === 'expense')
  const exchangeOuts = wallet.transactions.filter(t => t.type === 'exchange_out')

  console.log(
    `  Transakcje: ${exchangeIns.length} wymian, ` +
    `${expenses.length} wydatków, ${exchangeOuts.length} exchange_out`
  )

  await prisma.$transaction(async (tx) => {

    // 1. Utwórz nową sub-kopertę z walutą portfela
    const newEnvelope = await tx.envelope.create({
      data: {
        userId:          wallet.userId,
        name:            wallet.name,
        type:            'monthly',
        plannedAmount:   0,
        currentAmount:   wallet.balance,   // bieżące saldo przepisujemy 1:1
        group:           'Portfele Walutowe',
        currencyCode:    wallet.currency,
        parentEnvelopeId: null,            // do ręcznego przypisania przez użytkownika
        isArchived:      false,
        envelopeType:    'budget',
      },
    })

    console.log(`  ✓ Koperta: ${newEnvelope.id} | ${wallet.name} (${wallet.currency})`)

    // 2. Utwórz FxLoty z transakcji exchange_in
    //    Tablica służy też jako lokalna kolejka FIFO do symulacji historycznej.
    const fifoQueue: FifoSlot[] = []
    const createdLotIds: string[] = []

    for (const txIn of exchangeIns) {
      const foreignAmt = Math.abs(Number(txIn.amount))
      if (foreignAmt === 0) {
        console.warn(`  ⚠  Pominięto exchange_in ${txIn.id} — zerowa kwota.`)
        continue
      }

      const plnPaid  = Math.abs(Number(txIn.plnAmount ?? 0))
      // Kurs: z pola exchangeRate lub obliczony z kwot
      const rate = Number(txIn.exchangeRate ?? 0) > 0
        ? Number(txIn.exchangeRate)
        : foreignAmt > 0 ? roundDecimal(plnPaid / foreignAmt, 6) : 0

      if (rate === 0) {
        console.warn(
          `  ⚠  exchange_in ${txIn.id}: brak kursu i brak plnAmount — lot z kursem 0.`
        )
      }

      const lot = await tx.fxLot.create({
        data: {
          userId:              wallet.userId,
          envelopeId:          newEnvelope.id,
          date:                txIn.date,
          originalAmount:      foreignAmt,
          remainingAmount:     foreignAmt,   // zaktualizowane po FIFO poniżej
          costBasisPln:        plnPaid,
          exchangeRate:        rate,
          sourceTransactionId: txIn.id,
        },
      })

      fifoQueue.push({ id: lot.id, remaining: foreignAmt, rate })
      createdLotIds.push(lot.id)

      console.log(
        `  ✓ FxLot: ${foreignAmt} ${wallet.currency} ` +
        `@ ${rate.toFixed(6)} = ${plnPaid.toFixed(4)} PLN | ${txIn.date.toISOString().slice(0, 10)}`
      )
    }

    // 3. Utwórz Transaction dla każdego wydatku + oblicz plnEquivalent FIFO
    for (const expense of expenses) {
      const foreignAmt = Math.abs(Number(expense.amount))
      if (foreignAmt === 0) {
        console.warn(`  ⚠  Pominięto expense ${expense.id} — zerowa kwota.`)
        continue
      }

      let fifoResult: FifoResult

      if (fifoQueue.length === 0) {
        // Fallback Poziom 3: kompletny brak lotów — używamy kursu z transakcji
        // lub rzucamy błąd jeśli też brak kursu.
        const fallbackRate = Number(expense.exchangeRate ?? 0)
        if (fallbackRate === 0) {
          throw new Error(
            `InsufficientFxLotsError: wydatek ${expense.id} (${foreignAmt} ${wallet.currency}) ` +
            'nie ma żadnych lotów ani kursu wymiany. Migracja niemożliwa.'
          )
        }
        console.warn(
          `  ⚠  Brak jakichkolwiek lotów dla wydatku ${expense.id}. ` +
          `Używam kursu transakcji: ${fallbackRate}`
        )
        fifoResult = {
          plnEquivalent: roundDecimal(foreignAmt * fallbackRate, 4),
          usedFallback: true,
          fallbackAmount: foreignAmt,
          fallbackRate,
        }
      } else {
        fifoResult = consumeFifoLocal(fifoQueue, foreignAmt)
      }

      await tx.transaction.create({
        data: {
          userId:        wallet.userId,
          type:          'expense',
          amount:        foreignAmt,
          description:   expense.description ?? `Wydatek ${wallet.currency}`,
          date:          expense.date,
          envelopeId:    newEnvelope.id,
          includeInStats: true,
          plnEquivalent: fifoResult.plnEquivalent,
        },
      })

      console.log(
        `  ✓ Wydatek: ${foreignAmt} ${wallet.currency} ` +
        `= ${fifoResult.plnEquivalent.toFixed(4)} PLN (FIFO)` +
        (fifoResult.usedFallback ? ' [fallback]' : '')
      )
    }

    // 4. Zapisz zaktualizowane remainingAmount do bazy danych
    //    Iterujemy przez createdLotIds (zachowujemy kolejność FIFO).
    for (let i = 0; i < fifoQueue.length; i++) {
      const slot = fifoQueue[i]
      await tx.fxLot.update({
        where: { id: slot.id },
        data:  { remainingAmount: slot.remaining },
      })
    }

    // 5. Zdeprecjonuj stary portfel (zachowujemy dane jako backup)
    await tx.currencyWallet.update({
      where: { id: wallet.id },
      data:  { isActive: false },
    })

    console.log(`  ✓ Portfel ${wallet.name} zdeprecjonowany (isActive = false)`)

  }, { timeout: 60_000 })
}

// ---------------------------------------------------------------------------
// Punkt wejścia
// ---------------------------------------------------------------------------

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗')
  console.log('║  Migracja CurrencyWallet → Envelope + FxLot (FIFO)  ║')
  console.log('╚══════════════════════════════════════════════════════╝\n')

  const activeWallets = await prisma.currencyWallet.findMany({
    where: { isActive: true },
    select: { id: true, name: true, currency: true, userId: true },
    orderBy: { createdAt: 'asc' },
  })

  if (activeWallets.length === 0) {
    console.log('Brak aktywnych portfeli walutowych — migracja niepotrzebna.')
    return
  }

  console.log(`Znaleziono ${activeWallets.length} portfeli do migracji:\n`)
  for (const w of activeWallets) {
    console.log(`  • ${w.name} (${w.currency}) — userId: ${w.userId}`)
  }
  console.log()

  let successCount = 0
  let errorCount   = 0

  for (const wallet of activeWallets) {
    console.log(`\n▶ Portfel: ${wallet.name} (${wallet.currency})`)
    try {
      await migrateWallet(wallet.id)
      successCount++
    } catch (err) {
      errorCount++
      console.error(`  ✗ BŁĄD dla portfela ${wallet.id}:`, err instanceof Error ? err.message : err)
      console.error('  → Portfel pominięty. Transakcja wycofana (rollback).')
    }
  }

  console.log('\n══════════════════════════════════════════════════════')
  console.log(`Wynik: ${successCount} sukces, ${errorCount} błędów`)
  console.log('══════════════════════════════════════════════════════')

  if (successCount > 0) {
    console.log('\nKroki po migracji:')
    console.log('  1. Sprawdź nowe koperty w UI — mają group = "Portfele Walutowe".')
    console.log('  2. Przypisz parentEnvelopeId przez formularz edycji koperty.')
    console.log('  3. Po weryfikacji danych usuń stare endpointy /api/wallets.')
  }

  if (errorCount > 0) {
    process.exit(1)
  }
}

main()
  .catch((err) => {
    console.error('Krytyczny błąd skryptu:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
