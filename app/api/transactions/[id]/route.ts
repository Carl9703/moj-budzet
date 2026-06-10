import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { isSavingsEnvelope } from '@/lib/constants/envelopeTypes'
import { jsonResponse } from '@/lib/utils/api'
import { toNum } from '@/lib/utils/decimal'
import { z } from 'zod'

const updateTransactionSchema = z.object({
    amount: z.number().positive('Kwota musi być większa od zera'),
    description: z.string().optional()
})

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
            return jsonResponse(
                { error: 'Transakcja nie znaleziona' },
                { status: 404 }
            )
        }

        return jsonResponse(transaction)
    } catch (error) {
        console.error('GET transaction error:', error)
        return jsonResponse(
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

        const validation = updateTransactionSchema.safeParse(data)
        if (!validation.success) {
            return jsonResponse(
                { error: 'Nieprawidłowe dane', details: validation.error.issues },
                { status: 400 }
            )
        }

        const validData = validation.data

        // Pobierz oryginalną transakcję
        const originalTransaction = await prisma.transaction.findUnique({
            where: {
                id: params.id,
                userId
            }
        })

        if (!originalTransaction) {
            return jsonResponse(
                { error: 'Transakcja nie znaleziona' },
                { status: 404 }
            )
        }

        // POPRAWIONA KALKULACJA różnicy kwoty
        const oldAmount = toNum(originalTransaction.amount)
        const newAmount = validData.amount
        const amountDifference = oldAmount - newAmount

        // Przykłady:
        // oldAmount=120, newAmount=50 → amountDifference=70 (zwrot)
        // oldAmount=120, newAmount=150 → amountDifference=-30 (dodatkowy wydatek)

        // Zaktualizuj transakcję i saldo w jednej transakcji bazy danych
        const updatedTransaction = await prisma.$transaction(async (tx) => {
            const ut = await tx.transaction.update({
                where: { id: params.id },
                data: {
                    amount: newAmount,
                    description: validData.description !== undefined ? validData.description : originalTransaction.description
                }
            })

            // Jeśli to wydatek z kopertą, zaktualizuj stan koperty
            if (originalTransaction.type === 'expense' && originalTransaction.envelopeId) {
                const envelope = await tx.envelope.findUnique({
                    where: { id: originalTransaction.envelopeId }
                })

                if (envelope) {
                    let incrementValue = amountDifference; // domyślnie dodajemy różnicę
                    
                    if (envelope.type === 'yearly') {
                        const isSavings = isSavingsEnvelope(envelope.envelopeType)
                        if (isSavings) {
                            incrementValue = -amountDifference; // odejmujemy różnicę
                        }
                    }

                    await tx.envelope.update({
                        where: { id: originalTransaction.envelopeId },
                        data: { currentAmount: { increment: incrementValue } }
                    })
                }
            }

            // Jeśli to przychód z kopertą, zaktualizuj stan koperty
            if (originalTransaction.type === 'income' && originalTransaction.envelopeId) {
                const envelope = await tx.envelope.findUnique({
                    where: { id: originalTransaction.envelopeId }
                })

                if (envelope) {
                    let incrementValue = -amountDifference; // domyślnie odejmujemy różnicę
                    
                    if (envelope.type === 'yearly') {
                        const isSavings = isSavingsEnvelope(envelope.envelopeType)
                        if (isSavings) {
                            incrementValue = amountDifference; // dodajemy różnicę
                        }
                    }

                    await tx.envelope.update({
                        where: { id: originalTransaction.envelopeId },
                        data: { currentAmount: { increment: incrementValue } }
                    })
                }
            }

            return ut;
        });

        return jsonResponse(updatedTransaction)

    } catch (error) {
        console.error('Transaction update error:', error)
        return jsonResponse(
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
            return jsonResponse(
                { error: 'Transakcja nie znaleziona' },
                { status: 404 }
            )
        }

        // Używamy transakcji bazy danych dla atomowości operacji
        await prisma.$transaction(async (tx) => {
            // Sprawdź czy to jest transfer (ma transferPairId)
            if (transaction.transferPairId) {
                // Znajdź wszystkie transakcje z tej pary transferów
                const allTransferTransactions = await tx.transaction.findMany({
                    where: { transferPairId: transaction.transferPairId }
                })

                if (allTransferTransactions.length > 0) {
                    // Iteruj po wszystkich transakcjach i odwróć ich skutki na kopertach
                    await Promise.all(allTransferTransactions.map(async (t) => {
                        if (t.envelopeId) {
                            const envelope = await tx.envelope.findUnique({
                                where: { id: t.envelopeId }
                            })

                            if (envelope) {
                                let incrementValue = 0
                                if (t.type === 'income') {
                                    incrementValue = -toNum(t.amount)
                                } else if (t.type === 'expense') {
                                    incrementValue = toNum(t.amount)
                                }

                                await tx.envelope.update({
                                    where: { id: envelope.id },
                                    data: { currentAmount: { increment: incrementValue } }
                                })
                            }
                        }
                    }))

                    // Usuń wszystkie transakcje z pary
                    await tx.transaction.deleteMany({
                        where: { transferPairId: transaction.transferPairId }
                    })
                }
            } else {
                // Cofnij konsumpcję FxLot jeśli to wydatek walutowy
                const consumptions = await tx.fxLotConsumption.findMany({
                    where: { transactionId: params.id }
                })

                if (consumptions.length > 0) {
                    await Promise.all(consumptions.map(async (consumption) => {
                        await tx.fxLot.update({
                            where: { id: consumption.fxLotId },
                            data: { remainingAmount: { increment: consumption.amountConsumed } }
                        })
                    }))
                    // Kaskadowe usuwanie usunie same logi w tabeli FxLotConsumption
                }

                // Standardowa logika dla pojedynczych transakcji
                if (transaction.type === 'expense' && transaction.envelopeId) {
                    const envelope = await tx.envelope.findUnique({
                        where: { id: transaction.envelopeId }
                    })

                    if (envelope) {
                        const txAmt = toNum(transaction.amount)
                        let incrementValue = 0

                        if (envelope.type === 'monthly') {
                            incrementValue = txAmt
                        } else if (envelope.type === 'yearly') {
                            const isSavings = isSavingsEnvelope(envelope.envelopeType)

                            if (isSavings) {
                                incrementValue = -txAmt
                            } else {
                                incrementValue = txAmt
                            }
                        }

                        // Uwaga: oryginalny kod zawierał Math.max(0) zabezpieczenie przed minusowymi wartościami,
                        // ale przy increment() polegamy na prawidłowym stanie bazy danych. W razie potrzeby 
                        // można by dodać constraint w bazie db.
                        await tx.envelope.update({
                            where: { id: transaction.envelopeId },
                            data: { currentAmount: { increment: incrementValue } }
                        })
                    }
                }

                if (transaction.type === 'income' && transaction.envelopeId) {
                    const envelope = await tx.envelope.findUnique({
                        where: { id: transaction.envelopeId }
                    })

                    if (envelope) {
                        const txAmt = toNum(transaction.amount)
                        let incrementValue = 0

                        if (envelope.type === 'monthly') {
                            incrementValue = -txAmt
                        } else if (envelope.type === 'yearly') {
                            const isSavings = isSavingsEnvelope(envelope.envelopeType)

                            if (isSavings) {
                                incrementValue = txAmt
                            } else {
                                incrementValue = -txAmt
                            }
                        }

                        await tx.envelope.update({
                            where: { id: transaction.envelopeId },
                            data: { currentAmount: { increment: incrementValue } }
                        })
                    }
                }

                // Usuń transakcję
                await tx.transaction.delete({
                    where: { id: params.id }
                })
            }
        });

        if (transaction.transferPairId) {
            return jsonResponse({
                success: true,
                message: 'Transfer został usunięty (cała operacja została cofnięta)'
            })
        }

        return jsonResponse({
            success: true,
            message: 'Transakcja została usunięta'
        })

    } catch (error) {
        console.error('Transaction delete error:', error)
        return jsonResponse(
            { error: 'Błąd usuwania transakcji' },
            { status: 500 }
        )
    }
}