import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/utils/prisma'
import { getUserIdFromToken } from '../../../lib/auth/jwt'
import { jsonResponse } from '@/lib/utils/api'
import { createFxLot } from '@/lib/services/costBasis'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

const transferSchema = z.object({
    fromEnvelopeId: z.string().min(1, 'Koperta źródłowa jest wymagana'),
    toEnvelopeId: z.string().min(1, 'Koperta docelowa jest wymagana'),
    amount: z.number().positive('Kwota musi być większa od 0'),
    description: z.string().optional(),
    date: z.string().refine((val) => {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
        return dateRegex.test(val) || datetimeRegex.test(val) || !isNaN(Date.parse(val))
    }, 'Nieprawidłowy format daty').optional(),
    toCategory: z.string().optional(),
    // Pola dla transferu walutowego (cross-currency)
    // Jeśli koperta docelowa ma inną walutę niż PLN, wymagane są te pola.
    destinationAmount: z.number().positive().optional(),
})

export async function POST(request: NextRequest) {
    try {
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return jsonResponse(
                { error: error instanceof Error ? error.message : 'Brak autoryzacji' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const data = transferSchema.parse(body)

        // Pobierz koperty i sprawdź własność
        const fromEnvelope = data.fromEnvelopeId === 'MAIN_ACCOUNT'
            ? null
            : await prisma.envelope.findFirst({
                where: { id: data.fromEnvelopeId, userId }
            })

        const toEnvelope = await prisma.envelope.findFirst({
            where: { id: data.toEnvelopeId, userId }
        })

        if (data.fromEnvelopeId !== 'MAIN_ACCOUNT' && !fromEnvelope) {
            return jsonResponse(
                { error: 'Koperta źródłowa nie została znaleziona' },
                { status: 404 }
            )
        }

        if (!toEnvelope) {
            return jsonResponse(
                { error: 'Koperta docelowa nie została znaleziona' },
                { status: 404 }
            )
        }

        if (fromEnvelope && fromEnvelope.id === toEnvelope.id) {
            return jsonResponse(
                { error: 'Nie można transferować do tej samej koperty' },
                { status: 400 }
            )
        }

        if (fromEnvelope && new Prisma.Decimal(fromEnvelope.currentAmount).lessThan(data.amount)) {
            return jsonResponse(
                { error: `Brak środków! Dostępne: ${new Prisma.Decimal(fromEnvelope.currentAmount).toFixed(2)} zł` },
                { status: 400 }
            )
        }

        // Wykryj transfer walutowy: koperta docelowa ma inną walutę niż PLN
        const isCrossCurrency = toEnvelope.currencyCode !== 'PLN'

        if (isCrossCurrency && !data.destinationAmount) {
            return jsonResponse(
                {
                    error: `Koperta docelowa jest w ${toEnvelope.currencyCode}. ` +
                        'Podaj destinationAmount (kwotę w walucie docelowej).'
                },
                { status: 400 }
            )
        }

        // Parsuj datę w lokalnej strefie czasowej
        let transferDate: Date
        if (data.date) {
            const dateString = data.date
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                const [year, month, day] = dateString.split('-').map(Number)
                const now = new Date()
                transferDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds())
            } else {
                transferDate = new Date(dateString)
            }
        } else {
            transferDate = new Date()
        }

        const sourceAmount      = new Prisma.Decimal(data.amount)
        const destinationAmount = data.destinationAmount
            ? new Prisma.Decimal(data.destinationAmount)
            : sourceAmount

        // Kurs wymiany: PLN / waluta_obca (np. 4.30 dla EUR)
        const exchangeRate = isCrossCurrency
            ? sourceAmount.div(destinationAmount).toDecimalPlaces(6, Prisma.Decimal.ROUND_HALF_UP)
            : new Prisma.Decimal(1)

        await prisma.$transaction(async (tx) => {
            const transferPairId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

            // Zmniejsz saldo koperty źródłowej (w PLN)
            if (fromEnvelope) {
                await tx.envelope.update({
                    where: { id: fromEnvelope.id },
                    data: {
                        currentAmount: {
                            decrement: sourceAmount
                        }
                    }
                })
            }

            // Zwiększ saldo koperty docelowej (w jej własnej walucie)
            await tx.envelope.update({
                where: { id: toEnvelope.id },
                data: {
                    currentAmount: {
                        increment: destinationAmount
                    }
                }
            })

            // Transakcja "expense" dla koperty źródłowej (wyjście PLN)
            const outTx = await tx.transaction.create({
                data: {
                    userId,
                    type: 'expense',
                    amount: sourceAmount,
                    description: data.description || `Transfer: ${toEnvelope.name}`,
                    date: transferDate,
                    envelopeId: fromEnvelope?.id ?? null,
                    includeInStats: false,
                    transferPairId,
                    sourceAmount,
                    sourceCurrency: 'PLN',
                    destinationAmount: isCrossCurrency ? destinationAmount : null,
                    destinationCurrency: isCrossCurrency ? toEnvelope.currencyCode : null,
                    exchangeRate: isCrossCurrency ? exchangeRate : null,
                }
            })

            // Transakcja "income" dla koperty docelowej (wpływ środków)
            await tx.transaction.create({
                data: {
                    userId,
                    type: 'income',
                    amount: destinationAmount,
                    description: data.description ||
                        `Transfer: ${fromEnvelope ? fromEnvelope.name : 'Konto Główne'}`,
                    date: transferDate,
                    envelopeId: toEnvelope.id,
                    includeInStats: false,
                    transferPairId,
                    sourceAmount: isCrossCurrency ? sourceAmount : null,
                    sourceCurrency: isCrossCurrency ? 'PLN' : null,
                    destinationAmount: isCrossCurrency ? destinationAmount : null,
                    destinationCurrency: isCrossCurrency ? toEnvelope.currencyCode : null,
                    exchangeRate: isCrossCurrency ? exchangeRate : null,
                }
            })

            // Utwórz FxLot przy transferze walutowym (zasilenie sub-koperty)
            if (isCrossCurrency) {
                await createFxLot(tx, {
                    userId,
                    envelopeId: toEnvelope.id,
                    date: transferDate,
                    foreignAmount: destinationAmount,
                    costBasisPln: sourceAmount,
                    exchangeRate,
                    sourceTransactionId: outTx.id,
                })
            }
        })

        const amountFormatted = isCrossCurrency
            ? `${sourceAmount.toFixed(2)} PLN → ${destinationAmount.toFixed(2)} ${toEnvelope.currencyCode} (@ ${exchangeRate.toFixed(4)})`
            : `${sourceAmount.toFixed(2)} zł`

        return jsonResponse({
            success: true,
            message: `Transfer ${amountFormatted} z ${fromEnvelope ? fromEnvelope.name : 'Konta Głównego'} do ${toEnvelope.name} wykonany pomyślnie!`
        })

    } catch (error) {
        console.error('Transfer error:', error)

        if (error instanceof z.ZodError) {
            return jsonResponse(
                { error: error.issues[0].message },
                { status: 400 }
            )
        }

        return jsonResponse(
            { error: 'Wystąpił błąd podczas wykonywania transferu' },
            { status: 500 }
        )
    }
}
