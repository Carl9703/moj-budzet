import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Pobierz userId z JWT tokenu
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        const { id: paymentId } = await params

        // Znajdź płatność cykliczną
        const recurringPayment = await prisma.recurringPayment.findFirst({
            where: {
                id: paymentId,
                userId: userId,
                isActive: true
            },
            include: {
                envelope: true,
                fromEnvelope: true,
                toEnvelope: true
            }
        })

        if (!recurringPayment) {
            return NextResponse.json({ error: 'Płatność nie znaleziona' }, { status: 404 })
        }

        // Wykonaj transakcję w bazie danych
        await prisma.$transaction(async (tx) => {
            if (recurringPayment.type === 'transfer') {
                // Dla transferów - sprawdź czy koperta docelowa istnieje
                if (!recurringPayment.toEnvelope) {
                    throw new Error('Koperta docelowa nie znaleziona')
                }

                // Sprawdź czy użytkownik ma wystarczające środki (oblicz z transakcji)
                const allTransactions = await tx.transaction.findMany({
                    where: {
                        userId,
                        type: { in: ['income', 'expense'] },
                        NOT: [
                            { description: { contains: 'Zamknięcie miesiąca' } },
                            { description: { contains: 'przeniesienie bilansu' } }
                        ]
                    }
                })

                const totalIncome = allTransactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0)

                const totalExpenses = allTransactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0)

                const currentBalance = totalIncome - totalExpenses

                if (currentBalance < recurringPayment.amount) {
                    throw new Error('Niewystarczające środki w głównym saldzie')
                }

                // Utwórz transakcję wydatku (zmniejsza główne saldo)
                await tx.transaction.create({
                    data: {
                        userId: userId,
                        type: 'expense',
                        amount: recurringPayment.amount,
                        description: recurringPayment.name,
                        date: new Date(),
                        envelopeId: recurringPayment.toEnvelopeId!,
                        category: 'transfer',
                        includeInStats: false
                    }
                })

                // Zwiększ saldo koperty docelowej
                await tx.envelope.update({
                    where: { id: recurringPayment.toEnvelopeId! },
                    data: {
                        currentAmount: {
                            increment: recurringPayment.amount
                        }
                    }
                })

            } else {
                // Dla płatności - standardowa logika
                await tx.transaction.create({
                    data: {
                        userId: userId,
                        type: 'expense',
                        amount: recurringPayment.amount,
                        description: recurringPayment.name,
                        date: new Date(),
                        envelopeId: recurringPayment.envelopeId,
                        category: recurringPayment.category,
                        includeInStats: true
                    }
                })

                // Zwiększ saldo koperty
                await tx.envelope.update({
                    where: { id: recurringPayment.envelopeId },
                    data: {
                        currentAmount: {
                            increment: recurringPayment.amount
                        }
                    }
                })
            }

            // Ustaw dismissedUntil na początek następnego miesiąca
            const nextMonth = new Date()
            nextMonth.setMonth(nextMonth.getMonth() + 1)
            nextMonth.setDate(1)
            nextMonth.setHours(0, 0, 0, 0)

            await tx.recurringPayment.update({
                where: { id: paymentId },
                data: {
                    dismissedUntil: nextMonth
                }
            })
        })

        const message = recurringPayment.type === 'transfer' 
            ? `Transfer "${recurringPayment.name}" został zatwierdzony`
            : `Płatność "${recurringPayment.name}" została zatwierdzona`

        return NextResponse.json({
            success: true,
            message,
            amount: recurringPayment.amount,
            type: recurringPayment.type,
            envelope: recurringPayment.envelope.name,
            fromEnvelope: recurringPayment.fromEnvelope?.name,
            toEnvelope: recurringPayment.toEnvelope?.name
        })

    } catch (error) {
        console.error('Error approving payment:', error)
        return NextResponse.json(
            { error: 'Błąd zatwierdzania płatności', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
