import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/utils/prisma'
import { jsonResponse } from '@/lib/utils/api'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { roundToCents } from '@/lib/utils/money'
import { isEmergencyEnvelope, isProtectedEnvelope, isBudgetEnvelope, isSavingsEnvelope, isGoalEnvelope } from '@/lib/constants/envelopeTypes'
import { toNum } from '@/lib/utils/decimal'

import { SYSTEM_DESCRIPTIONS, DEFAULT_APP_START_DATE } from '@/lib/constants/system'

interface Transaction {
    id: string
    userId: string
    type: string
    amount: any  // Prisma.Decimal po migracji; używamy toNum() przy arytmetyce
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


        // Sprawdź czy użytkownik istnieje (i pobierz datę stworzenia jako fallback dla startu)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, createdAt: true }
        })

        if (!user) {
            return jsonResponse(
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

        const { FinanceService } = await import('@/lib/services/FinanceService')
        const activeEnvelopes = await FinanceService.getActiveEnvelopes(userId)
        const { income: incomeFromSeptember, expenses: expensesFromSeptember, net } = await FinanceService.getTransactionBalance(userId)

        const startOfAppUsage = new Date(DEFAULT_APP_START_DATE)
        const recentTransactions = await prisma.transaction.findMany({
            where: {
                userId,
                type: { in: ['income', 'expense'] },
                date: { gte: startOfAppUsage },
                NOT: [
                    { description: { contains: SYSTEM_DESCRIPTIONS.BALANCE_TRANSFER } }
                ]
            },
            orderBy: { date: 'desc' },
            take: 20
        })

        // Znajdź kopertę Fundusz Awaryjny (emergency type)
        const emergencyFundEnvelope = activeEnvelopes.find((e: any) => isEmergencyEnvelope(e.envelopeType))
        const emergencyFundAmount = emergencyFundEnvelope ? toNum(emergencyFundEnvelope.currentAmount) : 0

        // Oblicz sumę wszystkich funduszy celowych/rocznych
        const goalFundsAmount = activeEnvelopes
            .filter((e: any) =>
                isGoalEnvelope(e.envelopeType, e.name) &&
                !isEmergencyEnvelope(e.envelopeType, e.name)
            )
            .reduce((sum: number, e: any) => sum + toNum(e.currentAmount), 0)

        // Oblicz saldo: przychody - wydatki - fundusz awaryjny - fundusze celowe
        const balance = roundToCents(net - emergencyFundAmount - goalFundsAmount)

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        let monthTransactions: Transaction[] = await prisma.transaction.findMany({
            where: {
                userId,
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth
                },
                type: { in: ['income', 'expense'] }
            }
        })

        const totalIncome = Math.round(monthTransactions
            .filter(t => {
                // Wykluczamy transfery wewnętrzne (z transferPairId)
                if (t.transferPairId) return false
                // Wykluczamy transakcje oznaczone jako nie wliczane do statystyk
                if (t.includeInStats === false) return false
                // Tylko przychody
                if (t.type !== 'income') return false
                // Wykluczamy transfery premii do kopert (mają envelopeId i opis zawiera →)
                if (t.envelopeId && t.description?.includes(SYSTEM_DESCRIPTIONS.BONUS_TRANSFER_INDICATOR)) return false
                return true
            })
            .reduce((sum, t) => sum + toNum(t.amount), 0) * 100) / 100

        const totalExpenses = Math.round(monthTransactions
            .filter(t => t.type === 'expense' && t.includeInStats !== false && !t.transferPairId)
            .reduce((sum, t) => sum + toNum(t.amount), 0) * 100) / 100

        // Oblicz środki już zaalokowane do kopert (transfery premii typu "Premia → Koperta")
        const allocatedToEnvelopes = Math.round(monthTransactions
            .filter(t => t.type === 'income' && t.envelopeId && t.description?.includes('→'))
            .reduce((sum, t) => sum + toNum(t.amount), 0) * 100) / 100

        // Oblicz zwroty (przychody niewliczane do statystyk, np. refundacje)
        const totalReturns = Math.round(monthTransactions
            .filter(t =>
                t.type === 'income' &&
                t.includeInStats === false &&
                !t.transferPairId
            )
            .reduce((sum, t) => sum + toNum(t.amount), 0) * 100) / 100



        const envelopeActivity: { [key: string]: number } = {}

        monthTransactions
            .filter(t => t.type === 'expense' && t.envelopeId)
            .forEach(transaction => {
                const envelopeId = transaction.envelopeId!
                envelopeActivity[envelopeId] = (envelopeActivity[envelopeId] || 0) + 1
            })

        // Pobierz wszystkie aktywne loty walutowe użytkownika (batch, bez N+1)
        const allFxLots = await prisma.fxLot.findMany({
            where: { userId, remainingAmount: { gt: 0 } },
            orderBy: { date: 'asc' }
        })
        // Grupuj po envelopeId
        const fxLotsByEnvelope: Record<string, typeof allFxLots> = {}
        for (const lot of allFxLots) {
            if (!fxLotsByEnvelope[lot.envelopeId]) fxLotsByEnvelope[lot.envelopeId] = []
            fxLotsByEnvelope[lot.envelopeId].push(lot)
        }

        // Helper: zwraca tablicę kieszeni walutowych pogrupowanych po walucie
        const buildFxPockets = (lots: typeof allFxLots) => {
            if (lots.length === 0) return null
            const byCurrency: Record<string, { available: number; totalPln: number }> = {}
            for (const lot of lots) {
                const cur = lot.foreignCurrency ?? 'EUR'
                if (!byCurrency[cur]) byCurrency[cur] = { available: 0, totalPln: 0 }
                const rem = toNum(lot.remainingAmount)
                byCurrency[cur].available += rem
                byCurrency[cur].totalPln += rem * toNum(lot.exchangeRate)
            }
            return Object.entries(byCurrency).map(([currency, { available, totalPln }]) => ({
                currency,
                available: Math.round(available * 10000) / 10000,
                rateAvg: available > 0 ? Math.round((totalPln / available) * 10000) / 10000 : 0
            }))
        }

        const monthlyEnvelopes = envelopes
            .filter(e => e.type === 'monthly')
            .map(e => {
                const envelopeTransactions = monthTransactions.filter(t =>
                    t.envelopeId === e.id && t.includeInStats !== false
                )
                const spent = roundToCents(envelopeTransactions.reduce((sum, t) => {
                    // Dla kopert akumulujących (savings, emergency, goal): expense to wpłata na oszczędności
                    const isAccumulating = isProtectedEnvelope(e.envelopeType)

                    if (isAccumulating) {
                        // Koperty oszczędnościowe: expense = wpłata na oszczędności (dodaje do spent)
                        // income = zwrot/wypłata (odejmuje od spent)
                        return t.type === 'expense' ? sum + toNum(t.amount) : sum - toNum(t.amount)
                    } else {
                        // Koperty wydatkowe: expense zwiększa spent (więcej wydatków)
                        return t.type === 'expense' ? sum + toNum(t.amount) : sum - toNum(t.amount)
                    }
                }, 0))

                const lots = fxLotsByEnvelope[e.id] ?? []
                const fxPocket = buildFxPockets(lots)

                return {
                    id: e.id,
                    name: e.name,
                    icon: e.icon,
                    spent: spent,
                    planned: toNum(e.plannedAmount),
                    current: toNum(e.currentAmount),
                    activityCount: envelopeActivity[e.id] || 0,
                    group: e.group,
                    isAccumulating: e.isAccumulating,
                    envelopeType: e.envelopeType,
                    currencyCode: e.currencyCode ?? 'PLN',
                    fxPocket
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
                    t.envelopeId === e.id && t.includeInStats !== false
                )
                // Oblicz faktyczne wydatki z tego miesiąca (dla sumy na pulpicie)
                const monthlyExpenses = roundToCents(envelopeTransactions.reduce((sum, t) => {
                    return t.type === 'expense' ? sum + toNum(t.amount) : sum - toNum(t.amount)
                }, 0))
                const lots = fxLotsByEnvelope[e.id] ?? []
                const fxPocket = buildFxPockets(lots)

                return {
                    id: e.id,
                    name: e.name,
                    icon: e.icon,
                    spent: Math.max(0, monthlyExpenses), // Wydatki z tego miesiąca (dla sumy w grupie)
                    planned: toNum(e.plannedAmount),
                    current: toNum(e.currentAmount),
                    group: e.group,
                    isAccumulating: e.isAccumulating,
                    envelopeType: e.envelopeType,
                    currencyCode: e.currencyCode ?? 'PLN',
                    fxPocket
                }
            })
            .sort((a, b) => a.name.localeCompare(b.name))

        // NOWA LOGIKA: Nadwyżka to suma niewykorzystanych limitów w kopertach budżetowych
        const envelopeSavings = monthlyEnvelopes
            .filter(e => isBudgetEnvelope(e.envelopeType))
            .reduce((sum, e) => sum + (e.planned - e.spent), 0)

        const monthlySurplus = roundToCents(envelopeSavings)

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

        const response = jsonResponse({
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
            goalFundsAmount,
            monthlySurplus,
            monthlyEnvelopes,
            yearlyEnvelopes,
            transactions: recentTransactions,
            monthlyReturns: totalReturns
        })

        // Wyłącz cache dla świeżych danych
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')

        return response

    } catch (error) {
        return jsonResponse(
            { error: 'Błąd pobierania danych' },
            { status: 500 }
        )
    }
}
