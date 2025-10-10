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

                // Automatyczne wydatki po dodaniu wypłaty
                // 1. Z koperty "Budowanie Przyszłości" - IKE
                if (data.toInvestment && data.toInvestment > 0) {
                    const budowaniePrzyszlosciEnvelope = await tx.envelope.findFirst({
                        where: {
                            userId: userId,
                            name: 'Budowanie Przyszłości',
                            type: 'monthly'
                        }
                    })

                    if (budowaniePrzyszlosciEnvelope) {
                        await tx.envelope.update({
                            where: { id: budowaniePrzyszlosciEnvelope.id },
                            data: {
                                currentAmount: budowaniePrzyszlosciEnvelope.currentAmount + data.toInvestment
                            }
                        })

                        await tx.transaction.create({
                            data: {
                                userId: userId,
                                type: 'expense',
                                amount: data.toInvestment,
                                description: 'IKE',
                                date: data.date ? new Date(data.date) : new Date(),
                                envelopeId: budowaniePrzyszlosciEnvelope.id,
                                category: 'ike',
                                includeInStats: true
                            }
                        })
                    }
                }

                // 2. Z koperty "Mieszkanie" - Wspólne opłaty
                if (data.toJoint && data.toJoint > 0) {
                    const mieszkanieEnvelope = await tx.envelope.findFirst({
                        where: {
                            userId: userId,
                            name: 'Mieszkanie',
                            type: 'monthly'
                        }
                    })

                    if (mieszkanieEnvelope) {
                        await tx.envelope.update({
                            where: { id: mieszkanieEnvelope.id },
                            data: {
                                currentAmount: mieszkanieEnvelope.currentAmount + data.toJoint
                            }
                        })

                        await tx.transaction.create({
                            data: {
                                userId: userId,
                                type: 'expense',
                                amount: data.toJoint,
                                description: 'Wspólne opłaty',
                                date: data.date ? new Date(data.date) : new Date(),
                                envelopeId: mieszkanieEnvelope.id,
                                category: 'housing-bills',
                                includeInStats: true
                            }
                        })
                    }
                }

                // 3. Z koperty "Żywność" - Wspólne zakupy
                if (data.toGroceries && data.toGroceries > 0) {
                    const zywnoscEnvelope = await tx.envelope.findFirst({
                        where: {
                            userId: userId,
                            name: 'Żywność',
                            type: 'monthly'
                        }
                    })

                    if (zywnoscEnvelope) {
                        await tx.envelope.update({
                            where: { id: zywnoscEnvelope.id },
                            data: {
                                currentAmount: zywnoscEnvelope.currentAmount + data.toGroceries
                            }
                        })

                        await tx.transaction.create({
                            data: {
                                userId: userId,
                                type: 'expense',
                                amount: data.toGroceries,
                                description: 'Wspólne zakupy',
                                date: data.date ? new Date(data.date) : new Date(),
                                envelopeId: zywnoscEnvelope.id,
                                category: 'shared-groceries',
                                includeInStats: true
                            }
                        })
                    }
                }



                // Fundusz Awaryjny
                if (data.toSavings && data.toSavings > 0) {
                    const funduszAwaryjnyEnvelope = await tx.envelope.findFirst({
                        where: {
                            userId: userId,
                            name: 'Fundusz Awaryjny',
                            type: 'monthly'
                        }
                    })

                    if (funduszAwaryjnyEnvelope) {
                        await tx.envelope.update({
                            where: { id: funduszAwaryjnyEnvelope.id },
                            data: {
                                currentAmount: funduszAwaryjnyEnvelope.currentAmount + data.toSavings
                            }
                        })

                        await tx.transaction.create({
                            data: {
                                userId: userId,
                                type: 'expense',
                                amount: data.toSavings,
                                description: 'Fundusz Awaryjny',
                                date: data.date ? new Date(data.date) : new Date(),
                                envelopeId: funduszAwaryjnyEnvelope.id,
                                category: 'emergency',
                                includeInStats: true
                            }
                        })
                    }
                }

                // Transfer na Wakacje (koperta roczna)
                if (data.toVacation && data.toVacation > 0) {
                    const podrozeEnvelope = await tx.envelope.findFirst({
                        where: {
                            userId: userId,
                            name: 'Podróże',
                            type: 'yearly'
                        }
                    })

                    if (podrozeEnvelope) {
                        await tx.envelope.update({
                            where: { id: podrozeEnvelope.id },
                            data: {
                                currentAmount: podrozeEnvelope.currentAmount + data.toVacation
                            }
                        })

                        await tx.transaction.create({
                            data: {
                                userId: userId,
                                type: 'expense',
                                amount: data.toVacation,
                                description: 'Transfer: Wakacje',
                                date: data.date ? new Date(data.date) : new Date(),
                                envelopeId: podrozeEnvelope.id,
                                category: 'vacation',
                                includeInStats: true
                            }
                        })
                    }
                }

                // Transfer na Wesele (koperta roczna)
                if (data.toWedding && data.toWedding > 0) {
                    const weseleEnvelope = await tx.envelope.findFirst({
                        where: {
                            userId: userId,
                            name: 'Wesele',
                            type: 'yearly'
                        }
                    })

                    if (weseleEnvelope) {
                        await tx.envelope.update({
                            where: { id: weseleEnvelope.id },
                            data: {
                                currentAmount: weseleEnvelope.currentAmount + data.toWedding
                            }
                        })

                        await tx.transaction.create({
                            data: {
                                userId: userId,
                                type: 'expense',
                                amount: data.toWedding,
                                description: 'Transfer: Wesele',
                                date: data.date ? new Date(data.date) : new Date(),
                                envelopeId: weseleEnvelope.id,
                                category: 'wedding',
                                includeInStats: true
                            }
                        })
                    }
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
                { name: 'Prezenty i Okazje', amount: data.toGifts + data.toHolidays },
                { name: 'Auto: Serwis i Ubezpieczenie', amount: data.toInsurance },
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
                        
                        // Utwórz transakcję do koperty
                        await prisma.transaction.create({
                            data: {
                                userId: userId,
                                type: 'expense',
                                amount: update.amount,
                                description: `Transfer: ${update.name}`,
                                date: data.date ? new Date(data.date) : new Date(),
                                envelopeId: envelope.id,
                                includeInStats: false
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