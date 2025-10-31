import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
    try {
        // Pobierz userId z JWT tokenu
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        // Znajdź ostatnią transakcję zamknięcia miesiąca
        const closeTransaction = await prisma.transaction.findFirst({
            where: {
                userId: userId,
                description: {
                    contains: 'Zamknięcie miesiąca'
                }
            },
            orderBy: {
                date: 'desc'
            }
        })

        if (!closeTransaction) {
            return NextResponse.json(
                { error: 'Nie znaleziono transakcji zamknięcia miesiąca do cofnięcia' },
                { status: 404 }
            )
        }

        // Pobierz informacje o transakcji zamknięcia
        const transactionDescription = closeTransaction.description || ''
        
        // Wyciągnij kwoty z opisu transakcji
        let monthBalance = 0
        let returnsBalance = 0
        
        const oszczednosciMatch = transactionDescription.match(/oszczędności:\s*([\d,\.]+)/)
        const zwrotyMatch = transactionDescription.match(/zwroty:\s*([\d,\.]+)/)
        
        if (oszczednosciMatch) {
            monthBalance = parseFloat(oszczednosciMatch[1].replace(',', '.'))
        }
        if (zwrotyMatch) {
            returnsBalance = parseFloat(zwrotyMatch[1].replace(',', '.'))
        }
        
        const totalToTransfer = monthBalance + returnsBalance

        // Cofnij przeniesienie do wolnych środków
        if (closeTransaction.envelopeId && totalToTransfer > 0) {
            const freedomEnvelope = await prisma.envelope.findUnique({
                where: { id: closeTransaction.envelopeId }
            })

            if (freedomEnvelope) {
                await prisma.envelope.update({
                    where: { id: freedomEnvelope.id },
                    data: {
                        currentAmount: Math.max(0, freedomEnvelope.currentAmount - totalToTransfer)
                    }
                })
            }
        }

        // Pobierz datę transakcji zamknięcia, aby określić który miesiąc cofnąć
        const closeDate = new Date(closeTransaction.date)
        const startOfMonth = new Date(closeDate.getFullYear(), closeDate.getMonth(), 1)
        const endOfMonth = new Date(closeDate.getFullYear(), closeDate.getMonth() + 1, 0, 23, 59, 59)

        // Pobierz wszystkie transakcje z tego miesiąca (bez transakcji zamknięcia)
        const monthTransactions = await prisma.transaction.findMany({
            where: {
                userId: userId,
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth
                },
                NOT: [
                    {
                        description: {
                            contains: 'Zamknięcie miesiąca'
                        }
                    }
                ]
            }
        })

        // Przywróć stany kopert miesięcznych na podstawie transakcji z miesiąca
        // WAŻNE: Pomiń koperty roczne - one nie powinny być zerowane ani przywracane
        const rocznyEnvelopeNames = ['Budowanie Przyszłości', 'Fundusz Awaryjny', 'Wolne środki (roczne)']
        const monthlyEnvelopes = await prisma.envelope.findMany({
            where: {
                userId: userId,
                type: 'monthly'
            }
        })

        // Oblicz stany kopert na podstawie wszystkich transakcji z miesiąca
        // Uwzględnij tylko koperty miesięczne (pomiń roczne)
        const regularMonthlyEnvelopes = monthlyEnvelopes.filter(e => !rocznyEnvelopeNames.includes(e.name))

        for (const envelope of regularMonthlyEnvelopes) {
            const envelopeTransactions = monthTransactions.filter(t => t.envelopeId === envelope.id)
            let currentAmount = 0

            for (const transaction of envelopeTransactions) {
                // Pomiń transfery - one są tylko wewnętrznymi przepływami
                if (transaction.transferPairId) {
                    continue
                }

                if (transaction.type === 'expense') {
                    currentAmount -= transaction.amount
                } else if (transaction.type === 'income') {
                    currentAmount += transaction.amount
                }
            }

            await prisma.envelope.update({
                where: { id: envelope.id },
                data: {
                    currentAmount: currentAmount
                }
            })
        }

        // Usuń transakcję zamknięcia miesiąca
        await prisma.transaction.delete({
            where: { id: closeTransaction.id }
        })

        return NextResponse.json({
            success: true,
            message: `Zamknięcie miesiąca z ${closeDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })} zostało cofnięte`
        })

    } catch (error) {
        console.error('Undo close month API error:', error)
        return NextResponse.json(
            { error: 'Błąd cofania zamknięcia miesiąca' },
            { status: 500 }
        )
    }
}

