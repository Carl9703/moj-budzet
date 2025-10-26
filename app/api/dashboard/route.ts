import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { roundToCents } from '@/lib/utils/money'

interface Transaction {
    id: string
    userId: string
    type: string
    amount: number
    description: string | null
    date: Date
    envelopeId: string | null
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

        const envelopes = await prisma.envelope.findMany({
            where: { userId },
            orderBy: { name: 'asc' }
        })

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
        const incomeFromSeptember = Math.round(transactionsFromSeptember
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0) * 100) / 100

        const expensesFromSeptember = Math.round(transactionsFromSeptember
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0) * 100) / 100

        // Znajdź kopertę Fundusz Awaryjny
        const emergencyFundEnvelope = envelopes.find(e => e.name === 'Fundusz Awaryjny')
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
            .filter(t => t.type === 'income' && (t as { includeInStats?: boolean }).includeInStats !== false)
            .reduce((sum, t) => sum + t.amount, 0) * 100) / 100

        const totalExpenses = Math.round(monthTransactions
            .filter(t => t.type === 'expense' && (t as { includeInStats?: boolean }).includeInStats !== false)
            .reduce((sum, t) => sum + t.amount, 0) * 100) / 100

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
                    // Dla kopert wydatkowych: expense = wydatki, income = transfery do koperty (zmniejsza spent)
                    // Dla kopert oszczędnościowych: expense = transfery z koperty, income = transfery do koperty (zwiększa spent)
                    const isSavingsEnvelope = e.name === 'Fundusz Awaryjny'
                    
                    if (isSavingsEnvelope) {
                        // Koperty oszczędnościowe: income zwiększa spent (więcej oszczędności)
                        return t.type === 'income' ? sum + t.amount : sum - t.amount
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
                    group: e.group
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
                return {
                    id: e.id,
                    name: e.name,
                    icon: e.icon,
                    spent: e.currentAmount, // Dla kopert rocznych używamy currentAmount
                    planned: e.plannedAmount,
                    current: e.currentAmount,
                    group: e.group
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
            monthlyEnvelopes,
            yearlyEnvelopes,
            transactions: transactionsFromSeptember.slice(0, 20),
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