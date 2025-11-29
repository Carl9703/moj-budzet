import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
    try {
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        const body = await request.json()
        const envelopeName = body.envelopeName || 'Budowanie Przyszłości'

        // Znajdź kopertę
        const envelope = await prisma.envelope.findFirst({
            where: {
                userId: userId,
                name: envelopeName,
                type: 'yearly'
            }
        })

        if (!envelope) {
            return NextResponse.json(
                { error: `Koperta "${envelopeName}" nie znaleziona` },
                { status: 404 }
            )
        }

        // Pobierz wszystkie transakcje dla tej koperty
        const allTransactions = await prisma.transaction.findMany({
            where: {
                userId: userId,
                envelopeId: envelope.id
            },
            orderBy: {
                date: 'asc'
            }
        })

        // Oblicz saldo od zera używając nowej logiki
        // Dla transferów - one zmieniają saldo bezpośrednio w kodzie transferu:
        // - expense z transferPairId = wyjście z koperty źródłowej (już zmienione w transferze)
        // - income z transferPairId = wejście do koperty docelowej (już zmienione w transferze)
        // Więc dla transferów po prostu uwzględniamy je jako już zmienione saldo
        
        let calculatedBalance = 0
        const isSavingsEnvelope = envelope.name === 'Budowanie Przyszłości'

        for (const transaction of allTransactions) {
            if (transaction.transferPairId) {
                // Transfery już zmieniły saldo bezpośrednio w kodzie transferu
                // income z transferPairId = zwiększenie saldo (już zrobione)
                // expense z transferPairId = zmniejszenie saldo (już zrobione)
                // Więc uwzględniamy efekt transferu
                if (transaction.type === 'income') {
                    // Transfer do tej koperty - zwiększa saldo
                    calculatedBalance += transaction.amount
                } else if (transaction.type === 'expense') {
                    // Transfer z tej koperty - zmniejsza saldo
                    calculatedBalance -= transaction.amount
                }
            } else {
                // Zwykłe transakcje - przeliczamy używając nowej logiki
                if (transaction.type === 'expense') {
                    if (isSavingsEnvelope) {
                        // Koperty oszczędnościowe: expense zwiększa saldo
                        calculatedBalance += transaction.amount
                    } else {
                        // Koperty wydatkowe roczne: expense zmniejsza saldo
                        calculatedBalance -= transaction.amount
                    }
                } else if (transaction.type === 'income') {
                    if (isSavingsEnvelope) {
                        // Koperty oszczędnościowe: income zmniejsza saldo (wypłata z oszczędności)
                        calculatedBalance -= transaction.amount
                    } else {
                        // Koperty wydatkowe roczne: income zwiększa saldo (zwrot/wpłata do koperty)
                        calculatedBalance += transaction.amount
                    }
                }
            }
        }

        // Zaktualizuj saldo w bazie
        await prisma.envelope.update({
            where: { id: envelope.id },
            data: {
                currentAmount: Math.max(0, calculatedBalance)
            }
        })

        return NextResponse.json({
            success: true,
            message: `Saldo koperty "${envelopeName}" zostało przeliczone`,
            oldBalance: envelope.currentAmount,
            newBalance: Math.max(0, calculatedBalance),
            transactionsCount: allTransactions.length
        })

    } catch (error) {
        console.error('Fix envelope balance error:', error)
        return NextResponse.json(
            { error: 'Błąd przeliczania salda koperty' },
            { status: 500 }
        )
    }
}

