import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'

// GET - pobierz pojedynczą transakcję
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // Pobierz userId z JWT tokenu
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        const params = await context.params
        const transaction = await prisma.transaction.findUnique({
            where: {
                id: params.id,
                userId
            },
            include: {
                envelope: true
            }
        })

        if (!transaction) {
            return NextResponse.json(
                { error: 'Transakcja nie znaleziona' },
                { status: 404 }
            )
        }

        return NextResponse.json(transaction)
    } catch (error) {
        console.error('GET transaction error:', error)
        return NextResponse.json(
            { error: 'Błąd pobierania transakcji' },
            { status: 500 }
        )
    }
}

// PATCH - edytuj transakcję (obsługa zwrotów i zwiększenia kwoty)
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // Pobierz userId z JWT tokenu
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        const params = await context.params
        const data = await request.json()

        // Pobierz oryginalną transakcję
        const originalTransaction = await prisma.transaction.findUnique({
            where: {
                id: params.id,
                userId
            }
        })

        if (!originalTransaction) {
            return NextResponse.json(
                { error: 'Transakcja nie znaleziona' },
                { status: 404 }
            )
        }

        // POPRAWIONA KALKULACJA różnicy kwoty
        const oldAmount = originalTransaction.amount
        const newAmount = data.amount
        const amountDifference = oldAmount - newAmount

        // Przykłady:
        // oldAmount=120, newAmount=50 → amountDifference=70 (zwrot)
        // oldAmount=120, newAmount=150 → amountDifference=-30 (dodatkowy wydatek)

        // Zaktualizuj transakcję
        const updatedTransaction = await prisma.transaction.update({
            where: { id: params.id },
            data: {
                amount: newAmount,
                description: data.description || originalTransaction.description
            }
        })

        // Jeśli to wydatek z kopertą, zaktualizuj stan koperty
        if (originalTransaction.type === 'expense' && originalTransaction.envelopeId) {
            const envelope = await prisma.envelope.findUnique({
                where: { id: originalTransaction.envelopeId }
            })

            if (envelope) {
                let newCurrentAmount = envelope.currentAmount

                if (envelope.type === 'monthly') {
                    newCurrentAmount = envelope.currentAmount + amountDifference
                } else if (envelope.type === 'yearly') {
                    newCurrentAmount = envelope.currentAmount + amountDifference
                }

                await prisma.envelope.update({
                    where: { id: originalTransaction.envelopeId },
                    data: {
                        currentAmount: newCurrentAmount
                    }
                })
            }
        }

        return NextResponse.json(updatedTransaction)

    } catch (error) {
        console.error('Transaction update error:', error)
        return NextResponse.json(
            { error: 'Błąd aktualizacji transakcji' },
            { status: 500 }
        )
    }
}

// DELETE - usuń transakcję
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // Pobierz userId z JWT tokenu
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        const params = await context.params
        const transaction = await prisma.transaction.findUnique({
            where: {
                id: params.id,
                userId
            }
        })

        if (!transaction) {
            return NextResponse.json(
                { error: 'Transakcja nie znaleziona' },
                { status: 404 }
            )
        }

                // Sprawdź czy to jest transfer (ma transferPairId)
                if (transaction.transferPairId) {
                    // Znajdź drugą transakcję z tej pary transferów
                    const pairedTransaction = await prisma.transaction.findFirst({
                        where: {
                            transferPairId: transaction.transferPairId,
                            id: { not: transaction.id }
                        }
                    })

                    if (pairedTransaction) {
                        // Usuń obie transakcje z pary transferów
                        await prisma.transaction.deleteMany({
                            where: {
                                transferPairId: transaction.transferPairId
                            }
                        })

                        // Przywróć salda kopert - odwróć operacje transferu
                        if (transaction.type === 'income' && transaction.envelopeId) {
                            const envelope = await prisma.envelope.findUnique({
                                where: { id: transaction.envelopeId }
                            })
                            if (envelope) {
                                await prisma.envelope.update({
                                    where: { id: transaction.envelopeId },
                                    data: {
                                        currentAmount: Math.max(0, envelope.currentAmount - transaction.amount)
                                    }
                                })
                            }
                        }

                        if (pairedTransaction.type === 'expense' && pairedTransaction.envelopeId) {
                            const envelope = await prisma.envelope.findUnique({
                                where: { id: pairedTransaction.envelopeId }
                            })
                            if (envelope) {
                                await prisma.envelope.update({
                                    where: { id: pairedTransaction.envelopeId },
                                    data: {
                                        currentAmount: envelope.currentAmount + pairedTransaction.amount
                                    }
                                })
                            }
                        }

                        return NextResponse.json({
                            success: true,
                            message: 'Transfer został usunięty (oba transfery)'
                        })
                    }
                }

        // Standardowa logika dla pojedynczych transakcji
        if (transaction.type === 'expense' && transaction.envelopeId) {
            const envelope = await prisma.envelope.findUnique({
                where: { id: transaction.envelopeId }
            })

            if (envelope) {
                let newCurrentAmount: number
                
                if (envelope.type === 'monthly') {
                    newCurrentAmount = envelope.currentAmount + transaction.amount
                } else if (envelope.type === 'yearly') {
                    newCurrentAmount = Math.max(0, envelope.currentAmount - transaction.amount)
                } else {
                    newCurrentAmount = envelope.currentAmount
                }

                await prisma.envelope.update({
                    where: { id: transaction.envelopeId },
                    data: {
                        currentAmount: newCurrentAmount
                    }
                })
            }
        }

        if (transaction.type === 'income' && transaction.envelopeId) {
            const envelope = await prisma.envelope.findUnique({
                where: { id: transaction.envelopeId }
            })

            if (envelope) {
                await prisma.envelope.update({
                    where: { id: transaction.envelopeId },
                    data: {
                        currentAmount: Math.max(0, envelope.currentAmount - transaction.amount)
                    }
                })
            }
        }

        // Usuń transakcję
        await prisma.transaction.delete({
            where: { id: params.id }
        })

        return NextResponse.json({
            success: true,
            message: 'Transakcja została usunięta'
        })

    } catch (error) {
        console.error('Transaction delete error:', error)
        return NextResponse.json(
            { error: 'Błąd usuwania transakcji' },
            { status: 500 }
        )
    }
}