import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { isSavingsEnvelope } from '@/lib/constants/envelopeTypes'
import { jsonResponse } from '@/lib/utils/api'
import { toNum } from '@/lib/utils/decimal'

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
                const currentAmt = toNum(envelope.currentAmount)
                let newCurrentAmount: number = currentAmt

                if (envelope.type === 'monthly') {
                    // Dla kopert miesięcznych: expense zmniejsza saldo, więc przy zmianie kwoty odwracamy znak
                    newCurrentAmount = currentAmt + amountDifference
                } else if (envelope.type === 'yearly') {
                    // Dla kopert rocznych: rozróżniamy oszczędzanie od wydawania
                    const isSavings = isSavingsEnvelope(envelope.envelopeType)

                    if (isSavings) {
                        // Koperty oszczędnościowe: expense zwiększa saldo, więc przy zmianie kwoty zmieniamy znak
                        newCurrentAmount = currentAmt - amountDifference
                    } else {
                        // Koperty wydatkowe roczne: expense zmniejsza saldo, więc przy zmianie kwoty odwracamy znak
                        newCurrentAmount = currentAmt + amountDifference
                    }
                }

                await prisma.envelope.update({
                    where: { id: originalTransaction.envelopeId },
                    data: {
                        currentAmount: newCurrentAmount
                    }
                })
            }
        }

        // Jeśli to przychód z kopertą, zaktualizuj stan koperty
        if (originalTransaction.type === 'income' && originalTransaction.envelopeId) {
            const envelope = await prisma.envelope.findUnique({
                where: { id: originalTransaction.envelopeId }
            })

            if (envelope) {
                const currentAmt = toNum(envelope.currentAmount)
                let newCurrentAmount: number = currentAmt

                if (envelope.type === 'monthly') {
                    // Dla kopert miesięcznych: income zwiększa saldo, więc przy zmianie kwoty odwracamy znak
                    newCurrentAmount = currentAmt - amountDifference
                } else if (envelope.type === 'yearly') {
                    // Dla kopert rocznych: rozróżniamy oszczędzanie od wydawania
                    const isSavings = isSavingsEnvelope(envelope.envelopeType)

                    if (isSavings) {
                        // Koperty oszczędnościowe: income zmniejsza saldo, więc przy zmianie kwoty zmieniamy znak
                        newCurrentAmount = currentAmt + amountDifference
                    } else {
                        // Koperty wydatkowe roczne: income zwiększa saldo, więc przy zmianie kwoty odwracamy znak
                        newCurrentAmount = currentAmt - amountDifference
                    }
                }

                await prisma.envelope.update({
                    where: { id: originalTransaction.envelopeId },
                    data: {
                        currentAmount: newCurrentAmount
                    }
                })
            }
        }

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

        // Sprawdź czy to jest transfer (ma transferPairId)
        if (transaction.transferPairId) {
            // Znajdź wszystkie transakcje z tej pary transferów
            const allTransferTransactions = await prisma.transaction.findMany({
                where: {
                    transferPairId: transaction.transferPairId
                }
            })

            if (allTransferTransactions.length > 0) {
                // Iteruj po wszystkich transakcjach i odwróć ich skutki na kopertach
                await Promise.all(allTransferTransactions.map(async (t) => {
                    if (t.envelopeId) {
                        const envelope = await prisma.envelope.findUnique({
                            where: { id: t.envelopeId }
                        })

                        if (envelope) {
                            const envAmt = toNum(envelope.currentAmount)
                            let newCurrentAmount: number = envAmt
                            if (t.type === 'income') {
                                // Cofnięcie wpływu -> odejmij kwotę
                                newCurrentAmount = envAmt - toNum(t.amount)
                            } else if (t.type === 'expense') {
                                // Cofnięcie wydatku -> dodaj kwotę
                                newCurrentAmount = envAmt + toNum(t.amount)
                            }

                            // Zabezpieczenie przed ujemnym saldem (opcjonalne, ale warto dać max(0))
                            // Chociaż przy cofaniu wydatku (add) nie trzeba. Przy cofaniu wpływu (sub) można.
                            // Zachowajmy logikę prostą matematykę, ewentualnie max(0) dla income revert.
                            /* 
                               W oryginalnym kodzie było Math.max(0, ...). 
                            */

                            await prisma.envelope.update({
                                where: { id: envelope.id },
                                data: {
                                    currentAmount: newCurrentAmount
                                }
                            })
                        }
                    }
                }))

                // Usuń wszystkie transakcje z pary
                await prisma.transaction.deleteMany({
                    where: {
                        transferPairId: transaction.transferPairId
                    }
                })

                return jsonResponse({
                    success: true,
                    message: 'Transfer został usunięty (cała operacja została cofnięta)'
                })
            }
        }

        // Standardowa logika dla pojedynczych transakcji
        if (transaction.type === 'expense' && transaction.envelopeId) {
            const envelope = await prisma.envelope.findUnique({
                where: { id: transaction.envelopeId }
            })

            if (envelope) {
                const envAmt = toNum(envelope.currentAmount)
                const txAmt = toNum(transaction.amount)
                let newCurrentAmount: number

                if (envelope.type === 'monthly') {
                    // Dla kopert miesięcznych: expense zmniejsza saldo (wydatek z budżetu)
                    newCurrentAmount = envAmt + txAmt
                } else if (envelope.type === 'yearly') {
                    // Dla kopert rocznych: rozróżniamy oszczędzanie od wydawania
                    const isSavings = isSavingsEnvelope(envelope.envelopeType)

                    if (isSavings) {
                        // Koperty oszczędnościowe: expense zwiększa saldo, więc przy usuwaniu odwracamy: zmniejszamy saldo
                        newCurrentAmount = Math.max(0, envAmt - txAmt)
                    } else {
                        // Koperty wydatkowe roczne: expense zmniejsza saldo, więc przy usuwaniu odwracamy: zwiększamy saldo
                        newCurrentAmount = envAmt + txAmt
                    }
                } else {
                    newCurrentAmount = envAmt
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
                const envAmt = toNum(envelope.currentAmount)
                const txAmt = toNum(transaction.amount)
                let newCurrentAmount: number

                if (envelope.type === 'monthly') {
                    // Dla kopert miesięcznych: income zwiększa saldo (transfer do koperty)
                    // Przy usuwaniu odwracamy: zmniejszamy saldo
                    newCurrentAmount = Math.max(0, envAmt - txAmt)
                } else if (envelope.type === 'yearly') {
                    // Dla kopert rocznych: rozróżniamy oszczędzanie od wydawania
                    const isSavings = isSavingsEnvelope(envelope.envelopeType)

                    if (isSavings) {
                        // Koperty oszczędnościowe: income zmniejsza saldo, więc przy usuwaniu odwracamy: zwiększamy saldo
                        newCurrentAmount = envAmt + txAmt
                    } else {
                        // Koperty wydatkowe roczne: income zwiększa saldo, więc przy usuwaniu odwracamy: zmniejszamy saldo
                        newCurrentAmount = Math.max(0, envAmt - txAmt)
                    }
                } else {
                    newCurrentAmount = envAmt
                }

                await prisma.envelope.update({
                    where: { id: transaction.envelopeId },
                    data: {
                        currentAmount: newCurrentAmount
                    }
                })
            }
        }

        // Usuń transakcję
        await prisma.transaction.delete({
            where: { id: params.id }
        })

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