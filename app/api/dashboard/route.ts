import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { roundToCents } from '@/lib/utils/money'
import { isEmergencyEnvelope, isProtectedEnvelope } from '@/lib/constants/envelopeTypes'

interface Transaction {
    id: string
    userId: string
    type: string
    amount: number
    description: string | null
    date: Date
    envelopeId: string | null
    transferPairId: string | null
    includeInStats: boolean
}

export async function GET(request: NextRequest) {
    try {
        // Pobierz userId z JWT tokenu
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }


        // Sprawdź czy użytkownik istnieje
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Użytkownik nie znaleziony' },
                { status: 404 }
            )
        }

        let envelopes
        try {
            envelopes = await prisma.envelope.findMany({
                where: { userId, isArchived: false },
                orderBy: { name: 'asc' }
            })
        } catch (error) {
            // Fallback jeśli kolumna isArchived nie istnieje
            console.error('Error fetching envelopes with isArchived filter:', error)
            envelopes = await prisma.envelope.findMany({
                where: { userId },
                orderBy: { name: 'asc' }
            })
        }

        // Pobierz transakcje od 1 września 2025 (po imporcie historycznych danych)
        const startOfAppUsage = new Date('2025-09-01')

        const transactionsFromSeptember = await prisma.transaction.findMany({
            where: {
                userId,
                type: { in: ['income', 'expense'] },
                date: { gte: startOfAppUsage },
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

        // Oblicz saldo z transakcji od września (normalna logika)
        // Ignoruj TYLKO transakcje z transferPairId - to są transfery wewnętrzne, nie wpływają na główne saldo
        // NIE filtruj po includeInStats - wszystkie transakcje wpływają na saldo główne
        const incomeFromSeptember = Math.round(transactionsFromSeptember
            .filter(t => {
                const hasTransferPairId = !!(t as { transferPairId?: string | null }).transferPairId
                return t.type === 'income' && !hasTransferPairId
            })
            .reduce((sum, t) => sum + t.amount, 0) * 100) / 100

        const expensesFromSeptember = Math.round(transactionsFromSeptember
            .filter(t => {
                const hasTransferPairId = !!(t as { transferPairId?: string | null }).transferPairId
                return t.type === 'expense' && !hasTransferPairId
            })
            .reduce((sum, t) => sum + t.amount, 0) * 100) / 100

        // Znajdź kopertę Fundusz Awaryjny (emergency type)
        const emergencyFundEnvelope = envelopes.find(e => isEmergencyEnvelope(e.envelopeType))
        const emergencyFundAmount = emergencyFundEnvelope ? emergencyFundEnvelope.currentAmount : 0

        // Oblicz saldo: przychody od września - wydatki od września - fundusz awaryjny
        const balance = Math.round((incomeFromSeptember - expensesFromSeptember - emergencyFundAmount) * 100) / 100

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        const monthCloseTransaction = await prisma.transaction.findFirst({
            where: {
                userId,
                description: {
                    contains: 'Zamknięcie miesiąca'
                },
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        })

        let monthTransactions: Transaction[] = []

        if (monthCloseTransaction) {
            monthTransactions = await prisma.transaction.findMany({
                where: {
                    userId,
                    date: {
                        gt: monthCloseTransaction.date,
                        lte: endOfMonth
                    },
                    type: { in: ['income', 'expense'] },
                    NOT: {
                        description: {
                            contains: 'Zamknięcie miesiąca'
                        }
                    }
                }
            })
        } else {
            monthTransactions = await prisma.transaction.findMany({
                where: {
                    userId,
                    date: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    },
                    type: { in: ['income', 'expense'] },
                    NOT: {
                        description: {
                            contains: 'Zamknięcie miesiąca'
                        }
                    }
                }
            })
        }

        const totalIncome = Math.round(monthTransactions
            .filter(t => {
                // Wykluczamy transfery wewnętrzne (z transferPairId)
                if (t.transferPairId) return false
                // Wykluczamy transakcje oznaczone jako nie wliczane do statystyk
                if (t.includeInStats === false) return false
                // Tylko przychody
                if (t.type !== 'income') return false
                // Wykluczamy transfery premii do kopert (mają envelopeId i opis zawiera →)
                if (t.envelopeId && t.description?.includes('→')) return false
                return true
            })
            .reduce((sum, t) => sum + t.amount, 0) * 100) / 100

        const totalExpenses = Math.round(monthTransactions
            .filter(t => t.type === 'expense' && t.includeInStats !== false && !t.transferPairId)
            .reduce((sum, t) => sum + t.amount, 0) * 100) / 100

        // Oblicz środki już zaalokowane do kopert (transfery premii typu "Premia → Koperta")
        const allocatedToEnvelopes = Math.round(monthTransactions
            .filter(t => t.type === 'income' && t.envelopeId && t.description?.includes('→'))
            .reduce((sum, t) => sum + t.amount, 0) * 100) / 100

        // Oblicz wpłaty do Funduszu Awaryjnego w tym miesiącu
        const emergencyFundEnvelopeId = emergencyFundEnvelope?.id
        const monthlyEmergencyFundTransfers = emergencyFundEnvelopeId
            ? Math.round(monthTransactions
                .filter(t => t.envelopeId === emergencyFundEnvelopeId && t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0) * 100) / 100
            : 0

        // Oblicz zwroty (przychody niewliczane do statystyk, np. refundacje)
        const totalReturns = Math.round(monthTransactions
            .filter(t =>
                t.type === 'income' &&
                t.includeInStats === false &&
                !t.transferPairId
            )
            .reduce((sum, t) => sum + t.amount, 0) * 100) / 100

        // Oblicz nadwyżkę miesiąca (do transferu do Wolnych Środków)
        // = przychody (stats) + zwroty (non-stats) - wydatki - wpłaty do FA
        let monthlySurplus = Math.round((totalIncome + totalReturns - totalExpenses - monthlyEmergencyFundTransfers) * 100) / 100

        // Zbierz transfery do kopert (zmniejszające saldo główne)
        const monthlyTransfersToEnvelopes: { name: string; icon: string; amount: number }[] = []

        // Wpłaty do FA
        if (monthlyEmergencyFundTransfers > 0 && emergencyFundEnvelope) {
            monthlyTransfersToEnvelopes.push({
                name: emergencyFundEnvelope.name,
                icon: emergencyFundEnvelope.icon || '🚨',
                amount: monthlyEmergencyFundTransfers
            })
        }

        // Alokacje do innych kopert (transfery premii)
        // Musimy rozróżnić:
        // 1. Alokacje do kopert ROCZNYCH (np. Wolne środki, Wakacje) -> te środki tam zostają, więc pomniejszają nadwyżkę
        // 2. Alokacje do kopert MIESIĘCZNYCH (np. Jedzenie) -> te koperty i tak są zerowane przy zamknięciu, więc środki wracają do nadwyżki
        const bonusTransfers = monthTransactions.filter(t =>
            t.type === 'income' && t.envelopeId && t.description?.includes('→')
        )

        let allocatedToYearlyEnvelopes = 0

        for (const transfer of bonusTransfers) {
            const envelope = envelopes.find(e => e.id === transfer.envelopeId)
            if (envelope) {
                monthlyTransfersToEnvelopes.push({
                    name: envelope.name,
                    icon: envelope.icon || '📦',
                    amount: transfer.amount
                })

                // Jeśli koperta jest roczna (lub chroniona typem), odejmij od nadwyżki
                // 'yearly' envelopes OR protected types (savings, etc, which are effectively persistent)
                if (envelope.type === 'yearly' || isProtectedEnvelope(envelope.envelopeType)) {
                    allocatedToYearlyEnvelopes += transfer.amount
                }
            }
        }
        // Recalculate surplus subtracting yearly allocations
        // Note: monthlyAllocations are effectively ignored (treated as surplus)
        monthlySurplus = Math.round((monthlySurplus - allocatedToYearlyEnvelopes) * 100) / 100

        const isMonthClosed = !!monthCloseTransaction

        const envelopeActivity: { [key: string]: number } = {}

        monthTransactions
            .filter(t => t.type === 'expense' && t.envelopeId)
            .forEach(transaction => {
                const envelopeId = transaction.envelopeId!
                envelopeActivity[envelopeId] = (envelopeActivity[envelopeId] || 0) + 1
            })

        const monthlyEnvelopes = envelopes
            .filter(e => e.type === 'monthly')
            .map(e => {
                const envelopeTransactions = monthTransactions.filter(t =>
                    t.envelopeId === e.id
                )
                const spent = roundToCents(envelopeTransactions.reduce((sum, t) => {
                    // Dla kopert akumulujących (savings, emergency, goal): expense to wpłata na oszczędności
                    const isAccumulating = isProtectedEnvelope(e.envelopeType)

                    if (isAccumulating) {
                        // Koperty oszczędnościowe: expense = wpłata na oszczędności (dodaje do spent)
                        // income = zwrot/wypłata (odejmuje od spent)
                        return t.type === 'expense' ? sum + t.amount : sum - t.amount
                    } else {
                        // Koperty wydatkowe: expense zwiększa spent (więcej wydatków)
                        return t.type === 'expense' ? sum + t.amount : sum - t.amount
                    }
                }, 0))

                return {
                    id: e.id,
                    name: e.name,
                    icon: e.icon,
                    spent: spent,
                    planned: e.plannedAmount,
                    current: e.currentAmount,
                    activityCount: envelopeActivity[e.id] || 0,
                    group: e.group,
                    isAccumulating: e.isAccumulating,
                    envelopeType: e.envelopeType
                }
            })
            .sort((a, b) => {
                if (a.activityCount !== b.activityCount) {
                    return b.activityCount - a.activityCount
                }
                return a.name.localeCompare(b.name)
            })

        const yearlyEnvelopes = envelopes
            .filter(e => e.type === 'yearly')
            .map(e => {
                const envelopeTransactions = monthTransactions.filter(t =>
                    t.envelopeId === e.id
                )
                // Oblicz faktyczne wydatki z tego miesiąca (dla sumy na pulpicie)
                const monthlyExpenses = envelopeTransactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0)
                return {
                    id: e.id,
                    name: e.name,
                    icon: e.icon,
                    spent: monthlyExpenses, // Wydatki z tego miesiąca (dla sumy w grupie)
                    planned: e.plannedAmount,
                    current: e.currentAmount,
                    group: e.group,
                    isAccumulating: e.isAccumulating,
                    envelopeType: e.envelopeType
                }
            })
            .sort((a, b) => a.name.localeCompare(b.name))

        // Oblicz dostępne środki (saldo główne)
        const availableFunds = balance

        // Oblicz stopę oszczędności
        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

        // Oblicz dni pozostałe do końca miesiąca
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        const daysRemaining = Math.max(0, lastDay.getDate() - now.getDate())

        // Oblicz dzienny budżet
        const dailyBudget = daysRemaining > 0 ? (totalIncome - totalExpenses) / daysRemaining : 0

        // Oblicz postęp miesiąca
        const currentDay = now.getDate()
        const totalDays = lastDay.getDate()
        const monthProgress = currentDay

        const response = NextResponse.json({
            success: true,
            mainBalance: balance,
            availableFunds,
            monthlyIncome: totalIncome,
            monthlyExpenses: totalExpenses,
            savingsRate,
            daysRemaining,
            dailyBudget,
            monthProgress,
            totalDays,
            balance,
            totalIncome,
            totalExpenses,
            allocatedToEnvelopes,
            emergencyFundAmount,
            monthlySurplus,
            monthlyTransfersToEnvelopes,
            monthlyEnvelopes,
            yearlyEnvelopes,
            transactions: transactionsFromSeptember.slice(0, 20),
            monthlyReturns: totalReturns,
            isMonthClosed
        })

        // Wyłącz cache dla świeżych danych
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')

        return response

    } catch (error) {
        return NextResponse.json(
            { error: 'Błąd pobierania danych' },
            { status: 500 }
        )
    }
}