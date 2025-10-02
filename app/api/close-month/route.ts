import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/utils/prisma'

co
import { getCurrentUser, createAuthResponse } from '@/lib/auth/getCurrentUser'nst userId = 'default-user'

export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request)
        
        if (!currentUser) {
            return createAuthResponse('Token required')
        }

        const userId = currentUser.userId

        let body = null
        try {
            body = await request.json()
        } catch {
            // Jeśli nie ma body, użyj aktualnego miesiąca
        }

        const targetMonth = body?.month || null
        let now: Date
        let startOfMonth: Date

        if (targetMonth) {
            // Parsuj miesiąc z formatu "2024-09"
            const [year, month] = targetMonth.split('-').map(Number)
            now = new Date(year, month - 1, 1) // month - 1 bo miesiące są 0-indexed
            startOfMonth = new Date(year, month - 1, 1)
        } else {
            // Użyj aktualnego miesiąca
            now = new Date()
            startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        }

        // Pobierz transakcje z docelowego miesiąca (wykluczając operacje zamknięcia)
        const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59)
        
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
                    },
                    {
                        description: {
                            contains: 'przeniesienie bilansu'
                        }
                    }
                ]
            }
        })

        // Osobno przychody w statystykach i poza nimi
        const statsIncome = monthTransactions
            .filter((t: { type: string; includeInStats?: boolean }) => 
                t.type === 'income' && t.includeInStats !== false
            )
            .reduce((sum, t) => sum + t.amount, 0)

        const nonStatsIncome = monthTransactions
            .filter((t: { type: string; includeInStats?: boolean }) => 
                t.type === 'income' && t.includeInStats === false
            )
            .reduce((sum, t) => sum + t.amount, 0)

        const totalExpenses = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0)

        // Oblicz składowe
        const monthBalance = statsIncome - totalExpenses  // oszczędności z realnych przychodów
        const returnsBalance = nonStatsIncome             // zwroty i refundacje
        const totalToTransfer = monthBalance + returnsBalance // całkowite saldo do przeniesienia

        console.log('Stats income (w statystykach):', statsIncome)
        console.log('Non-stats income (zwroty):', nonStatsIncome)
        console.log('Total expenses:', totalExpenses)
        console.log('Month balance (oszczędności):', monthBalance)
        console.log('Returns balance (zwroty):', returnsBalance)
        console.log('CAŁKOWITE do przeniesienia:', totalToTransfer)

        // Pobierz koperty miesięczne (tylko do informacji o stanie)
        const monthlyEnvelopes = await prisma.envelope.findMany({
            where: {
                userId: userId,
                type: 'monthly'
            }
        })

        // Zbierz informacje o stanie kopert (tylko informacyjnie)
        const envelopeDetails = []
        let totalUnusedFunds = 0

        for (const envelope of monthlyEnvelopes) {
            if (envelope.currentAmount > 0) {
                totalUnusedFunds += envelope.currentAmount
                envelopeDetails.push({
                    name: envelope.name,
                    icon: envelope.icon,
                    remaining: envelope.currentAmount
                })
            } else if (envelope.currentAmount < 0) {
                envelopeDetails.push({
                    name: envelope.name,
                    icon: envelope.icon,
                    overrun: Math.abs(envelope.currentAmount)
                })
            }
        }

        console.log('Niewykorzystane środki z kopert:', totalUnusedFunds)

        // Przenieś CAŁE SALDO do wolnych środków (jeśli dodatnie)
        if (totalToTransfer > 0) {
            const freedomEnvelope = await prisma.envelope.findFirst({
                where: {
                    userId: userId,
                    name: 'Wolne środki (roczne)',
                    type: 'yearly'
                }
            })

            if (freedomEnvelope) {
                console.log(`Transferring TOTAL ${totalToTransfer} to freedom envelope`)

                await prisma.envelope.update({
                    where: { id: freedomEnvelope.id },
                    data: {
                        currentAmount: freedomEnvelope.currentAmount + totalToTransfer
                    }
                })

                // Utwórz transakcję księgową z rozpisaniem
                let description = '🔒 Zamknięcie miesiąca'
                if (monthBalance > 0 && returnsBalance > 0) {
                    description += ` - oszczędności: ${monthBalance} zł, zwroty: ${returnsBalance} zł`
                } else if (monthBalance > 0) {
                    description += ` - oszczędności: ${monthBalance} zł`
                } else if (returnsBalance > 0) {
                    description += ` - zwroty: ${returnsBalance} zł`
                }

                await prisma.transaction.create({
                    data: {
                        userId: userId,
                        type: 'expense',
                        amount: totalToTransfer,
                        description: description,
                        date: now,
                        envelopeId: freedomEnvelope.id,
                        includeInStats: false  // Transfer nie wpływa na nowe statystyki
                    }
                })
            }
        }

        // Reset wszystkich kopert miesięcznych do 0
        for (const envelope of monthlyEnvelopes) {
            await prisma.envelope.update({
                where: { id: envelope.id },
                data: {
                    currentAmount: 0
                }
            })
        }


        const monthName = startOfMonth.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })

        // Oblicz stopę oszczędności (tylko z realnych przychodów)
        const savingsRate = statsIncome > 0 ? Math.round((monthBalance / statsIncome) * 100) : 0

        return NextResponse.json({
            success: true,
            monthName,
            summary: {
                statsIncome,        // przychody w statystykach
                nonStatsIncome,     // zwroty poza statystykami
                totalExpenses,      // wydatki
                monthBalance,       // oszczędności (statsIncome - expenses)
                returnsBalance,     // zwroty
                totalTransferred: totalToTransfer, // całkowite przeniesione
                savingsRate,        // stopa oszczędności
                unusedFunds: totalUnusedFunds
            },
            message: totalToTransfer > 0
                ? `Miesiąc ${monthName} zamknięty. Przeniesiono ${totalToTransfer} zł do wolnych środków` +
                (monthBalance > 0 && returnsBalance > 0
                    ? ` (oszczędności: ${monthBalance} zł + zwroty: ${returnsBalance} zł)`
                    : monthBalance > 0
                        ? ` (oszczędności: ${monthBalance} zł)`
                        : ` (zwroty: ${returnsBalance} zł)`) +
                `. Stopa oszczędności: ${savingsRate}%.`
                : totalToTransfer < 0
                    ? `Miesiąc ${monthName} zamknięty z deficytem ${Math.abs(totalToTransfer)} zł.`
                    : `Miesiąc ${monthName} zamknięty. Saldo wynosi 0 zł.`
        })

    } catch (error) {
        console.error('Close month API error:', error)
        return NextResponse.json(
            { error: 'Błąd zamykania miesiąca' },
            { status: 500 }
        )
    }
}