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
        const [fromEnvelope, toEnvelope] = await Promise.all([
            prisma.envelope.findFirst({
                where: { id: data.fromEnvelopeId, userId }
            }),
            prisma.envelope.findFirst({
                where: { id: data.toEnvelopeId, userId }
            })
        ])

        if (!fromEnvelope) {
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

        if (fromEnvelope.id === toEnvelope.id) {
            return NextResponse.json(
                { error: 'Nie można transferować do tej samej koperty' },
                { status: 400 }
            )
        }

        if (fromEnvelope.currentAmount < data.amount) {
            return NextResponse.json(
                { error: `Brak środków! Dostępne: ${fromEnvelope.currentAmount.toFixed(2)} zł` },
                { status: 400 }
            )
        }

        // Wykonaj transfer w transakcji
        await prisma.$transaction(async (tx) => {
            // Generuj unikalny ID dla pary transferów
            const transferPairId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            
            // Zmniejsz saldo koperty źródłowej
            await tx.envelope.update({
                where: { id: fromEnvelope.id },
                data: {
                    currentAmount: fromEnvelope.currentAmount - data.amount
                }
            })

            // Zwiększ saldo koperty docelowej
            await tx.envelope.update({
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
                    date: data.date ? new Date(data.date) : new Date(),
                    envelopeId: fromEnvelope.id,
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
                    description: `Transfer: ${fromEnvelope.name}`,
                    date: data.date ? new Date(data.date) : new Date(),
                    envelopeId: toEnvelope.id,
                    includeInStats: false, // Transfer wewnętrzny nie wpływa na statystyki
                    transferPairId: transferPairId
                }
            })

            // Jeśli transfer ma kategorię, utwórz dodatkowy wydatek z kategorią
            if (data.toCategory) {
                await tx.transaction.create({
                    data: {
                        userId: userId,
                        type: 'expense',
                        amount: data.amount,
                        description: data.toCategory,
                        date: data.date ? new Date(data.date) : new Date(),
                        envelopeId: toEnvelope.id,
                        includeInStats: true, // Wydatek z kategorią wpływa na statystyki
                        category: data.toCategory
                    }
                })
            }
        })

        return NextResponse.json({
            success: true,
            message: `Transfer ${data.amount.toFixed(2)} zł z ${fromEnvelope.name} do ${toEnvelope.name} wykonany pomyślnie!`
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
