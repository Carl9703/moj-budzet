import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { roundToCents } from '@/lib/utils/money'

export async function POST(request: NextRequest) {
    try {
        // Pobierz userId z JWT tokenu
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

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
        // Wyklucz transfery (transakcje z transferPairId) - to są tylko wewnętrzne przepływy między kopertami
        const statsIncome = monthTransactions
            .filter((t: { type: string; includeInStats?: boolean; transferPairId?: string | null }) => 
                t.type === 'income' && t.includeInStats !== false && !t.transferPairId
            )
            .reduce((sum, t) => sum + t.amount, 0)

        // Zwroty i refundacje - przychody poza statystykami, ale NIE transfery
        const nonStatsIncome = monthTransactions
            .filter((t: { type: string; includeInStats?: boolean; transferPairId?: string | null }) => 
                t.type === 'income' && t.includeInStats === false && !t.transferPairId
            )
            .reduce((sum, t) => sum + t.amount, 0)

        // Wydatki - wyklucz transfery
        const totalExpenses = monthTransactions
            .filter((t: { type: string; includeInStats?: boolean; transferPairId?: string | null }) => 
                t.type === 'expense' && t.includeInStats !== false && !t.transferPairId
            )
            .reduce((sum, t) => sum + t.amount, 0)

        // Oblicz składowe
        const monthBalance = statsIncome - totalExpenses  // oszczędności z realnych przychodów
        const returnsBalance = nonStatsIncome             // zwroty i refundacje
        const totalToTransfer = monthBalance + returnsBalance // całkowite saldo do przeniesienia


        // Pobierz WSZYSTKIE koperty użytkownika
        const allEnvelopes = await prisma.envelope.findMany({
            where: {
                userId: userId
            }
        })

        // Lista chronionych nazw kopert rocznych (NIE mogą być zerowane)
        const protectedEnvelopeNames = ['Budowanie Przyszłości', 'Fundusz Awaryjny', 'Wolne środki (roczne)', 'Cele finansowe']
        const protectedNamesSet = new Set(protectedEnvelopeNames)

        // Zbierz informacje o stanie kopert miesięcznych (tylko informacyjnie)
        const envelopeDetails = []
        let totalUnusedFunds = 0

        // Tylko koperty miesięczne (nie roczne i nie chronione) do informacji
        const actualMonthlyEnvelopes = allEnvelopes.filter(e => 
            e.type === 'monthly' && 
            !protectedNamesSet.has(e.name)
        )

        for (const envelope of actualMonthlyEnvelopes) {
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

                await prisma.envelope.update({
                    where: { id: freedomEnvelope.id },
                    data: {
                        currentAmount: freedomEnvelope.currentAmount + totalToTransfer
                    }
                })

                // Utwórz transakcję księgową z rozpisaniem
                const roundedMonthBalance = roundToCents(monthBalance)
                const roundedReturnsBalance = roundToCents(returnsBalance)
                
                let description = '🔒 Zamknięcie miesiąca'
                if (roundedMonthBalance > 0 && roundedReturnsBalance > 0) {
                    description += ` - oszczędności: ${roundedMonthBalance.toFixed(2)} zł, zwroty: ${roundedReturnsBalance.toFixed(2)} zł`
                } else if (roundedMonthBalance > 0) {
                    description += ` - oszczędności: ${roundedMonthBalance.toFixed(2)} zł`
                } else if (roundedReturnsBalance > 0) {
                    description += ` - zwroty: ${roundedReturnsBalance.toFixed(2)} zł`
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

        // Reset TYLKO kopert miesięcznych do 0
        // WAŻNE: Wyklucz koperty roczne (type='yearly') i koperty z chronionymi nazwami
        const monthlyEnvelopesToReset = await prisma.envelope.findMany({
            where: {
                userId: userId,
                type: 'monthly',
                NOT: {
                    name: {
                        in: Array.from(protectedNamesSet)
                    }
                }
            }
        })
        
        // Resetuj koperty miesięczne (chronione są już wykluczone przez zapytanie)
        for (const envelope of monthlyEnvelopesToReset) {
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

        const response = NextResponse.json({
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

        // Wyłącz cache dla świeżych danych
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')

        return response

    } catch (error) {
        console.error('Close month API error:', error)
        return NextResponse.json(
            { error: 'Błąd zamykania miesiąca' },
            { status: 500 }
        )
    }
}