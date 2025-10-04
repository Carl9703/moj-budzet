import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { incomeSchema } from '@/lib/validations/transaction'

export async function POST(request: NextRequest) {
    try {
        // Pobierz userId z JWT tokenu
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        const body = await request.json()

        // Walidacja danych wejściowych
        const validation = incomeSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Nieprawidłowe dane', details: validation.error.issues },
                { status: 400 }
            )
        }

        const data = validation.data

        if (data.type === 'salary') {
            // Użyj database transaction dla atomowości
            await prisma.$transaction(async (tx) => {
                // Zapisz wypłatę
                await tx.transaction.create({
                    data: {
                        userId: userId,
                        type: 'income',
                        amount: data.amount,
                        description: data.description || 'Wypłata miesięczna',
                        date: data.date ? new Date(data.date) : new Date(),
                        includeInStats: true
                    }
                })

                // Transfer do Wesela
                if (data.toSavings && data.toSavings > 0) {
                    const weseLeEnvelope = await tx.envelope.findFirst({
                        where: {
                            userId: userId,
                            name: 'Wesele',
                            type: 'yearly'
                        }
                    })

                    if (weseLeEnvelope) {
                        await tx.envelope.update({
                            where: { id: weseLeEnvelope.id },
                            data: {
                                currentAmount: weseLeEnvelope.currentAmount + data.toSavings
                            }
                        })

                        await tx.transaction.create({
                            data: {
                                userId: userId,
                                type: 'expense',
                                amount: data.toSavings,
                                description: 'Transfer: Wesele',
                                date: data.date ? new Date(data.date) : new Date(),
                                envelopeId: weseLeEnvelope.id,
                                includeInStats: true
                            }
                        })
                    }
                }

                // Transfer do Wakacji
                if (data.toVacation && data.toVacation > 0) {
                    const vacationEnvelope = await tx.envelope.findFirst({
                        where: {
                            userId: userId,
                            name: 'Wakacje',
                            type: 'yearly'
                        }
                    })

                    if (vacationEnvelope) {
                        await tx.envelope.update({
                            where: { id: vacationEnvelope.id },
                            data: {
                                currentAmount: vacationEnvelope.currentAmount + data.toVacation
                            }
                        })

                        await tx.transaction.create({
                            data: {
                                userId: userId,
                                type: 'expense',
                                amount: data.toVacation,
                                description: 'Transfer: Wakacje',
                                date: data.date ? new Date(data.date) : new Date(),
                                envelopeId: vacationEnvelope.id,
                                includeInStats: true
                            }
                        })
                    }
                }

                // Konto wspólne
                if (data.toJoint && data.toJoint > 0) {
                    await tx.transaction.create({
                        data: {
                            userId: userId,
                            type: 'expense',
                            amount: data.toJoint,
                            description: 'Transfer: Konto wspólne',
                            date: data.date ? new Date(data.date) : new Date(),
                            includeInStats: true
                        }
                    })
                }

                // Inwestycje
                if (data.toInvestment && data.toInvestment > 0) {
                    await tx.transaction.create({
                        data: {
                            userId: userId,
                            type: 'expense',
                            amount: data.toInvestment,
                            description: 'Transfer: Inwestycje',
                            date: data.date ? new Date(data.date) : new Date(),
                            includeInStats: true
                        }
                    })
                }

                // Alokacja do kopert miesięcznych
                const monthlyEnvelopes = await tx.envelope.findMany({
                    where: {
                        userId: userId,
                        type: 'monthly'
                    },
                    orderBy: { name: 'asc' }
                })

                const allocations: { [key: string]: number } = {
                    'Jedzenie': 500,
                    'Transport': 300,
                    'Telekom/Subskrypcje': 100,
                    'Higiena/Zdrowie': 100,
                    'Rozrywka': 100,
                    'Ubrania': 150,
                    'Dom': 110,
                    'Nieprzewidziane': 150
                }

                for (const envelope of monthlyEnvelopes) {
                    const allocationAmount = allocations[envelope.name] || 0

                    if (allocationAmount > 0) {
                        await tx.envelope.update({
                            where: { id: envelope.id },
                            data: {
                                currentAmount: allocationAmount
                            }
                        })
                    }
                }
            })

            return NextResponse.json({
                success: true,
                message: 'Wypłata rozdzielona pomyślnie!'
            })

        } else if (data.type === 'other') {
            // ZAKTUALIZOWANE - obsługa includeInStats
            await prisma.transaction.create({
                data: {
                    userId: userId,
                    type: 'income',
                    amount: data.amount,
                    description: data.description || (data.includeInStats ? 'Inny przychód' : 'Zwrot/Refundacja'),
                    date: data.date ? new Date(data.date) : new Date(),
                    includeInStats: data.includeInStats !== false  // KLUCZOWA ZMIANA!
                }
            })

            return NextResponse.json({
                success: true,
                message: data.includeInStats !== false
                    ? `Przychód ${data.amount} zł został dodany do statystyk!`
                    : `Zwrot ${data.amount} zł został dodany (poza statystykami)!`
            })

        } else if (data.type === 'bonus') {
            // Zapisz premię - DODAJ includeInStats
            await prisma.transaction.create({
                data: {
                    userId: userId,
                    type: 'income',
                    amount: data.amount,
                    description: 'Premia kwartalna',
                    date: data.date ? new Date(data.date) : new Date(),
                    includeInStats: true  // DODANE - premia zawsze w statystykach
                }
            })

            // Reszta kodu bez zmian...
            const updates = [
                { name: 'Prezenty', amount: data.toGifts },
                { name: 'OC', amount: data.toInsurance },
                { name: 'Święta', amount: data.toHolidays },
                { name: 'Wolne środki (roczne)', amount: data.toFreedom }
            ]

            for (const update of updates) {
                if (update.amount && update.amount > 0) {
                    const envelope = await prisma.envelope.findFirst({
                        where: {
                            userId: userId,
                            name: update.name,
                            type: 'yearly'
                        }
                    })

                    if (envelope) {
                        await prisma.envelope.update({
                            where: { id: envelope.id },
                            data: {
                                currentAmount: envelope.currentAmount + update.amount
                            }
                        })
                    }
                }
            }

            return NextResponse.json({
                success: true,
                message: 'Premia rozdzielona pomyślnie!'
            })
        }

        return NextResponse.json(
            { error: 'Nieznany typ przychodu' },
            { status: 400 }
        )

    } catch (error) {
        return NextResponse.json(
            { error: 'Błąd zapisywania przychodu' },
            { status: 500 }
        )
    }
}