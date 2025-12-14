import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/utils/prisma'
import { getUserIdFromToken } from '../../../lib/auth/jwt'
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
    toCategory: z.string().optional()
})

export async function POST(request: NextRequest) {
    try {
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return NextResponse.json(
                { error: error instanceof Error ? error.message : 'Brak autoryzacji' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const data = transferSchema.parse(body)

        // Sprawdź czy koperty należą do użytkownika
        const fromEnvelope = data.fromEnvelopeId === 'MAIN_ACCOUNT'
            ? null
            : await prisma.envelope.findFirst({
                where: { id: data.fromEnvelopeId, userId }
            })

        const toEnvelope = await prisma.envelope.findFirst({
            where: { id: data.toEnvelopeId, userId }
        })

        if (data.fromEnvelopeId !== 'MAIN_ACCOUNT' && !fromEnvelope) {
            return NextResponse.json(
                { error: 'Koperta źródłowa nie została znaleziona' },
                { status: 404 }
            )
        }

        if (!toEnvelope) {
            return NextResponse.json(
                { error: 'Koperta docelowa nie została znaleziona' },
                { status: 404 }
            )
        }

        if (fromEnvelope && fromEnvelope.id === toEnvelope.id) {
            return NextResponse.json(
                { error: 'Nie można transferować do tej samej koperty' },
                { status: 400 }
            )
        }

        if (fromEnvelope && fromEnvelope.currentAmount < data.amount) {
            return NextResponse.json(
                { error: `Brak środków! Dostępne: ${fromEnvelope.currentAmount.toFixed(2)} zł` },
                { status: 400 }
            )
        }

        // Parsuj datę w lokalnej strefie czasowej
        let transferDate: Date
        if (data.date) {
            // Jeśli data jest tylko datą (YYYY-MM-DD), dodaj aktualną godzinę
            const dateString = data.date
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                // Data bez czasu - użyj aktualnej godziny z tej daty
                const [year, month, day] = dateString.split('-').map(Number)
                const now = new Date()
                transferDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds())
            } else {
                // Pełna data z czasem - użyj bezpośrednio
                transferDate = new Date(dateString)
            }
        } else {
            transferDate = new Date()
        }

        // Wykonaj transfer w transakcji
        await prisma.$transaction(async (tx) => {
            // Generuj unikalny ID dla pary transferów
            const transferPairId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

            // Zmniejsz saldo koperty źródłowej (jeśli nie z konta głównego)
            if (fromEnvelope) {
                await tx.envelope.update({
                    where: { id: fromEnvelope.id },
                    data: {
                        currentAmount: fromEnvelope.currentAmount - data.amount
                    }
                })
            }

            // Zwiększ saldo koperty docelowej
            const updatedToEnvelope = await tx.envelope.update({
                where: { id: toEnvelope.id },
                data: {
                    currentAmount: toEnvelope.currentAmount + data.amount
                }
            })


            // Utwórz transakcję "expense" dla koperty źródłowej (wyjście środków)
            await tx.transaction.create({
                data: {
                    userId: userId,
                    type: 'expense',
                    amount: data.amount,
                    description: `Transfer: ${toEnvelope.name}`,
                    date: transferDate,
                    envelopeId: fromEnvelope?.id || null, // null oznacza konto główne
                    includeInStats: false, // Transfer wewnętrzny nie wpływa na statystyki
                    transferPairId: transferPairId
                }
            })

            // Utwórz transakcję "income" dla koperty docelowej (wpływ środków)
            await tx.transaction.create({
                data: {
                    userId: userId,
                    type: 'income',
                    amount: data.amount,
                    description: `Transfer: ${fromEnvelope ? fromEnvelope.name : 'Konto Główne'}`,
                    date: transferDate,
                    envelopeId: toEnvelope.id,
                    includeInStats: false, // Transfer wewnętrzny nie wpływa na statystyki
                    transferPairId: transferPairId
                }
            })

            // Jeśli transfer ma kategorię, przypisz ją do transakcji przychodzącej (opcjonalnie)
            // Nie tworzymy dodatkowego wydatku, bo to powoduje duplikację

        })

        return NextResponse.json({
            success: true,
            message: `Transfer ${data.amount.toFixed(2)} zł z ${fromEnvelope ? fromEnvelope.name : 'Konta Głównego'} do ${toEnvelope.name} wykonany pomyślnie!`
        })

    } catch (error) {
        console.error('Transfer error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues[0].message },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Wystąpił błąd podczas wykonywania transferu' },
            { status: 500 }
        )
    }
}
