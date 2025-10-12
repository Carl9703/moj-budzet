import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getCategoryName, getCategoryIcon } from '@/lib/constants/categories'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'

interface MonthlyData {
    month: string
    year: number
    income: number
    expenses: number
    savings: number
}

interface CategoryBreakdown {
    categoryId: string
    categoryName: string
    categoryIcon: string
    amount: number
    percentage: number
}

interface CategoryComparison {
    categoryId: string
    categoryName: string
    categoryIcon: string
    currentAmount: number
    previousAmount: number
    change: number
    changePercent: number
}

interface EnvelopeAnalysis {
    name: string
    icon: string
    plannedAmount: number
    totalSpent: number
    avgMonthlySpent: number
    categoryBreakdown: CategoryBreakdown[]
    monthlyComparison?: {
        currentMonth: string
        previousMonth: string
        currentTotal: number
        previousTotal: number
        totalChange: number
        totalChangePercent: number
        categoryComparisons: CategoryComparison[]
    }
}

interface TransferAnalysis {
    name: string
    amount: number
    percentage: number
}

function getStartDate(period: string): Date {
    const now = new Date()
    
    switch (period) {
        case '1month':
            return new Date(now.getFullYear(), now.getMonth() - 1, 1)
        case 'currentMonth':
            return new Date(now.getFullYear(), now.getMonth(), 1)
        case '6months':
            return new Date(now.getFullYear(), now.getMonth() - 6, 1)
        case 'currentYear':
            return new Date(now.getFullYear(), 0, 1)
        default: // 3months
            return new Date(now.getFullYear(), now.getMonth() - 3, 1)
    }
}

async function getMonthlyData(userId: string): Promise<{ [key: string]: MonthlyData }> {
    const monthlyData: { [key: string]: MonthlyData } = {}
    const now = new Date()

    for (let i = 11; i >= 0; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
        const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59)

        const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth()).padStart(2, '0')}`
        const monthName = targetDate.toLocaleDateString('pl-PL', { month: 'long' })
        const year = targetDate.getFullYear()

        // Pobierz transakcje z miesiąca - ZAWSZE wszystkie transakcje z miesiąca
        const monthTransactions = await prisma.transaction.findMany({
            where: {
                userId: userId,
                date: { gte: startOfMonth, lte: endOfMonth },
                type: { in: ['income', 'expense'] },
                NOT: [
                    { description: { contains: 'Zamknięcie miesiąca' } },
                    { description: { contains: 'przeniesienie bilansu' } }
                ]
            }
        })

        const totalIncome = monthTransactions
            .filter(t => t.type === 'income' && (t as { includeInStats?: boolean }).includeInStats !== false)
            .reduce((sum, t) => sum + t.amount, 0)

        const totalExpenses = monthTransactions
            .filter(t => t.type === 'expense' && (t as { includeInStats?: boolean }).includeInStats !== false)
            .reduce((sum, t) => sum + t.amount, 0)

        if (totalIncome > 0 || totalExpenses > 0) {
            monthlyData[monthKey] = {
                month: monthName,
                year: year,
                income: totalIncome,
                expenses: totalExpenses,
                savings: totalIncome - totalExpenses
            }
        }
    }

    return monthlyData
}

async function getEnvelopeAnalysis(realExpenses: any[], envelopes: any[], sortedMonths: MonthlyData[]): Promise<EnvelopeAnalysis[]> {
    const envelopeAnalysis: EnvelopeAnalysis[] = []

    // Grupuj wydatki po kopertach
    const expensesByEnvelope: { [key: string]: { amount: number; envelope?: { name?: string | null } | null; category?: string | null }[] } = {}
    for (const expense of realExpenses) {
        const envelopeName = expense.envelope?.name || 'Inne'
        if (!expensesByEnvelope[envelopeName]) {
            expensesByEnvelope[envelopeName] = []
        }
        expensesByEnvelope[envelopeName].push(expense)
    }

    // Pobierz dane z ostatnich 2 miesięcy dla porównania
    const lastTwoMonths = sortedMonths.slice(-2)
    const currentMonthData = lastTwoMonths[1]
    const previousMonthData = lastTwoMonths[0]

    for (const [envelopeName, transactions] of Object.entries(expensesByEnvelope)) {
        const envelope = envelopes.find(e => e.name === envelopeName)
        const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0)

        // Grupuj po kategoriach
        const categoriesInEnvelope: { [key: string]: { amount: number, icon: string, name: string } } = {}

        transactions.forEach(transaction => {
            const categoryId = transaction.category || 'other'
            const categoryName = getCategoryName(categoryId)
            const categoryIcon = getCategoryIcon(categoryId)

            if (!categoriesInEnvelope[categoryId]) {
                categoriesInEnvelope[categoryId] = { amount: 0, name: categoryName, icon: categoryIcon }
            }
            categoriesInEnvelope[categoryId].amount += transaction.amount
        })

        const categoryBreakdown: CategoryBreakdown[] = Object.entries(categoriesInEnvelope)
            .map(([categoryId, data]) => ({
                categoryId,
                categoryName: data.name,
                categoryIcon: data.icon,
                amount: data.amount,
                percentage: Math.round((data.amount / totalSpent) * 100)
            }))
            .sort((a, b) => b.amount - a.amount)

        // === PORÓWNANIE MIESIĘCZNE ===
        let monthlyComparison
        if (currentMonthData && previousMonthData) {
            // Pobierz transakcje z bieżącego miesiąca dla tej koperty
            const currentMonthTransactions = await prisma.transaction.findMany({
                where: {
                    userId: transactions[0].userId,
                    type: 'expense',
                    date: { gte: new Date(currentMonthData.year, getMonthIndex(currentMonthData.month), 1) },
                    envelope: { name: envelopeName }
                }
            })

            const previousMonthTransactions = await prisma.transaction.findMany({
                where: {
                    userId: transactions[0].userId,
                    type: 'expense',
                    date: { gte: new Date(previousMonthData.year, getMonthIndex(previousMonthData.month), 1) },
                    envelope: { name: envelopeName }
                }
            })

            const currentTotal = currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0)
            const previousTotal = previousMonthTransactions.reduce((sum, t) => sum + t.amount, 0)
            const totalChange = currentTotal - previousTotal
            const totalChangePercent = previousTotal > 0 ? Math.round((totalChange / previousTotal) * 100) : 0

            // Porównanie kategorii
            const categoryComparisons: CategoryComparison[] = []
            const currentCategories: { [key: string]: number } = {}
            const previousCategories: { [key: string]: number } = {}

            currentMonthTransactions.forEach(t => {
                const categoryId = t.category || 'other'
                currentCategories[categoryId] = (currentCategories[categoryId] || 0) + t.amount
            })

            previousMonthTransactions.forEach(t => {
                const categoryId = t.category || 'other'
                previousCategories[categoryId] = (previousCategories[categoryId] || 0) + t.amount
            })

            const allCategories = new Set([...Object.keys(currentCategories), ...Object.keys(previousCategories)])
            for (const categoryId of allCategories) {
                const currentAmount = currentCategories[categoryId] || 0
                const previousAmount = previousCategories[categoryId] || 0
                const change = currentAmount - previousAmount
                const changePercent = previousAmount > 0 ? Math.round((change / previousAmount) * 100) : 0

                categoryComparisons.push({
                    categoryId,
                    categoryName: getCategoryName(categoryId),
                    categoryIcon: getCategoryIcon(categoryId),
                    currentAmount,
                    previousAmount,
                    change,
                    changePercent
                })
            }

            categoryComparisons.sort((a, b) => b.currentAmount - a.currentAmount)

            monthlyComparison = {
                currentMonth: currentMonthData.month,
                previousMonth: previousMonthData.month,
                currentTotal,
                previousTotal,
                totalChange,
                totalChangePercent,
                categoryComparisons
            }
        }

        envelopeAnalysis.push({
            name: envelopeName,
            icon: envelope?.icon || '📦',
            plannedAmount: envelope?.plannedAmount || 0,
            totalSpent: totalSpent,
            avgMonthlySpent: Math.round(totalSpent / Math.max(1, sortedMonths.length)),
            categoryBreakdown,
            monthlyComparison
        })
    }

    return envelopeAnalysis
}

function getMonthIndex(monthName: string): number {
    const months = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
        'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień']
    return months.indexOf(monthName)
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

        const { searchParams } = new URL(request.url)
        const period = searchParams.get('period') || '3months'
        const startDate = getStartDate(period)

        // Pobierz koperty
        const envelopes = await prisma.envelope.findMany({
            where: { userId: userId }
        })

        // === TRENDY MIESIĘCZNE - OSTATNIE 12 MIESIĘCY ===
        const monthlyData = await getMonthlyData(userId)

        const sortedMonths = Object.values(monthlyData).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year
            const months = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
                'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień']
            return months.indexOf(a.month) - months.indexOf(b.month)
        })

        // === ANALIZA WYDATKÓW DLA WYBRANEGO OKRESU ===
        const allTransactions = await prisma.transaction.findMany({
            where: {
                userId: userId,
                type: { in: ['income', 'expense'] },
                date: { gte: startDate },
                NOT: [
                    { description: { contains: 'Zamknięcie miesiąca' } },
                    { description: { contains: 'przeniesienie bilansu' } }
                ]
            },
            include: { envelope: true }
        })

        const expenseTransactions = allTransactions.filter(t => t.type === 'expense')

        const transfers: TransferAnalysis[] = []
        const realExpenses: { amount: number; envelope?: { name?: string | null } | null; category?: string | null }[] = []
        let totalTransferAmount = 0
        let totalExpenseAmount = 0

        for (const transaction of expenseTransactions) {
            // Use includeInStats flag to determine if transaction should be counted as expense or transfer
            const shouldIncludeInStats = (transaction as { includeInStats?: boolean }).includeInStats !== false
            
            if (shouldIncludeInStats) {
                // Real expense - include in statistics
                realExpenses.push(transaction)
                totalExpenseAmount += transaction.amount
            } else {
                // Transfer/savings - exclude from statistics
                const desc = transaction.description?.toLowerCase() || ''
                const envelopeName = transaction.envelope?.name || ''
                
                let transferName = envelopeName
                if (desc.includes('transfer:')) {
                    transferName = transaction.description?.replace(/transfer:\s*/i, '').trim() || envelopeName
                }

                const existing = transfers.find(t => t.name === transferName)
                if (existing) {
                    existing.amount += transaction.amount
                } else {
                    transfers.push({ name: transferName, amount: transaction.amount, percentage: 0 })
                }
                totalTransferAmount += transaction.amount
            }
        }

        transfers.forEach(transfer => {
            transfer.percentage = totalTransferAmount > 0 ? Math.round((transfer.amount / totalTransferAmount) * 100) : 0
        })
        transfers.sort((a, b) => b.amount - a.amount)

        // === ANALIZA KOPERT Z PORÓWNANIAMI MIESIĘCZNYMI ===
        const envelopeAnalysis = await getEnvelopeAnalysis(realExpenses, envelopes, sortedMonths)

        for (const [envelopeName, transactions] of Object.entries(expensesByEnvelope)) {
            const envelope = envelopes.find(e => e.name === envelopeName)
            const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0)

            // Grupuj po kategoriach
            const categoriesInEnvelope: { [key: string]: { amount: number, icon: string, name: string } } = {}

            transactions.forEach(transaction => {
                const categoryId = transaction.category || 'other'
                const categoryName = getCategoryName(categoryId)
                const categoryIcon = getCategoryIcon(categoryId)

                if (!categoriesInEnvelope[categoryId]) {
                    categoriesInEnvelope[categoryId] = { amount: 0, name: categoryName, icon: categoryIcon }
                }
                categoriesInEnvelope[categoryId].amount += transaction.amount
            })

            const categoryBreakdown: CategoryBreakdown[] = Object.entries(categoriesInEnvelope)
                .map(([categoryId, data]) => ({
                    categoryId,
                    categoryName: data.name,
                    categoryIcon: data.icon,
                    amount: data.amount,
                    percentage: Math.round((data.amount / totalSpent) * 100)
                }))
                .sort((a, b) => b.amount - a.amount)

            // === PORÓWNANIE MIESIĘCZNE ===
            let monthlyComparison
            if (currentMonthData && previousMonthData) {
                // Pobierz transakcje z bieżącego miesiąca dla tej koperty
                const currentMonthTransactions = await prisma.transaction.findMany({
                    where: {
                        userId: userId,
                        type: 'expense',
                        envelope: { name: envelopeName },
                        date: {
                            gte: new Date(currentMonthData.year,
                                ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
                                    'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień']
                                    .indexOf(currentMonthData.month), 1),
                            lte: new Date(currentMonthData.year,
                                ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
                                    'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień']
                                    .indexOf(currentMonthData.month) + 1, 0, 23, 59, 59)
                        },
                        NOT: [
                            { description: { contains: 'Zamknięcie miesiąca' } },
                            { description: { contains: 'przeniesienie bilansu' } }
                        ]
                    }
                })

                // Pobierz transakcje z poprzedniego miesiąca dla tej koperty
                const previousMonthTransactions = await prisma.transaction.findMany({
                    where: {
                        userId: userId,
                        type: 'expense',
                        envelope: { name: envelopeName },
                        date: {
                            gte: new Date(previousMonthData.year,
                                ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
                                    'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień']
                                    .indexOf(previousMonthData.month), 1),
                            lte: new Date(previousMonthData.year,
                                ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
                                    'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień']
                                    .indexOf(previousMonthData.month) + 1, 0, 23, 59, 59)
                        },
                        NOT: [
                            { description: { contains: 'Zamknięcie miesiąca' } },
                            { description: { contains: 'przeniesienie bilansu' } }
                        ]
                    }
                })

                // Grupuj po kategoriach dla obu miesięcy
                const currentCategories: { [key: string]: number } = {}
                const previousCategories: { [key: string]: number } = {}

                currentMonthTransactions.forEach(t => {
                    const categoryId = t.category || 'other'
                    currentCategories[categoryId] = (currentCategories[categoryId] || 0) + t.amount
                })

                previousMonthTransactions.forEach(t => {
                    const categoryId = t.category || 'other'
                    previousCategories[categoryId] = (previousCategories[categoryId] || 0) + t.amount
                })

                // Utwórz porównania kategorii
                const allCategoryIds = new Set([...Object.keys(currentCategories), ...Object.keys(previousCategories)])
                const categoryComparisons: CategoryComparison[] = Array.from(allCategoryIds).map(categoryId => {
                    const currentAmount = currentCategories[categoryId] || 0
                    const previousAmount = previousCategories[categoryId] || 0
                    const change = currentAmount - previousAmount
                    const changePercent = previousAmount > 0 ? Math.round((change / previousAmount) * 100) : 0

                    return {
                        categoryId,
                        categoryName: getCategoryName(categoryId),
                        categoryIcon: getCategoryIcon(categoryId),
                        currentAmount,
                        previousAmount,
                        change,
                        changePercent
                    }
                }).filter(c => c.currentAmount > 0 || c.previousAmount > 0)
                    .sort((a, b) => Math.max(b.currentAmount, b.previousAmount) - Math.max(a.currentAmount, a.previousAmount))

                const currentTotal = Object.values(currentCategories).reduce((sum, amount) => sum + amount, 0)
                const previousTotal = Object.values(previousCategories).reduce((sum, amount) => sum + amount, 0)
                const totalChange = currentTotal - previousTotal
                const totalChangePercent = previousTotal > 0 ? Math.round((totalChange / previousTotal) * 100) : 0

                if (categoryComparisons.length > 0) {
                    monthlyComparison = {
                        currentMonth: currentMonthData.month.slice(0, 3),
                        previousMonth: previousMonthData.month.slice(0, 3),
                        currentTotal,
                        previousTotal,
                        totalChange,
                        totalChangePercent,
                        categoryComparisons
                    }
                }
            }

            envelopeAnalysis.push({
                name: envelopeName,
                icon: envelope?.icon || '📦',
                plannedAmount: envelope?.plannedAmount || 0,
                totalSpent,
                avgMonthlySpent: Math.round(totalSpent / Math.max(1,
                    Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)))),
                categoryBreakdown,
                monthlyComparison
            })
        }

        envelopeAnalysis.sort((a, b) => b.totalSpent - a.totalSpent)

        // === PORÓWNANIA OKRESOWE ===
        const lastMonth = sortedMonths[sortedMonths.length - 1]
        const previousMonth = sortedMonths[sortedMonths.length - 2]

        const monthComparison = previousMonth ? {
            incomeChange: lastMonth.income - previousMonth.income,
            expenseChange: lastMonth.expenses - previousMonth.expenses,
            savingsChange: lastMonth.savings - previousMonth.savings,
            incomeChangePercent: previousMonth.income > 0 ? Math.round(((lastMonth.income - previousMonth.income) / previousMonth.income) * 100) : 0,
            expenseChangePercent: previousMonth.expenses > 0 ? Math.round(((lastMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100) : 0
        } : null

        // Średnie ruchome (3 miesiące)
        const movingAverages = sortedMonths.slice(-3).reduce((acc, month) => {
            acc.avgIncome += month.income
            acc.avgExpenses += month.expenses
            acc.avgSavings += month.savings
            return acc
        }, { avgIncome: 0, avgExpenses: 0, avgSavings: 0 })

        if (sortedMonths.length >= 3) {
            movingAverages.avgIncome = Math.round(movingAverages.avgIncome / 3)
            movingAverages.avgExpenses = Math.round(movingAverages.avgExpenses / 3)
            movingAverages.avgSavings = Math.round(movingAverages.avgSavings / 3)
        }

        const expenseVsTransferRatio = totalExpenseAmount > 0 ?
            Math.round((totalTransferAmount / (totalExpenseAmount + totalTransferAmount)) * 100) : 0

        return NextResponse.json({
            monthlyTrends: sortedMonths,
            envelopeAnalysis,
            transfers,
            monthComparison,
            movingAverages,
            summary: {
                totalRealExpenses: totalExpenseAmount,
                totalTransfers: totalTransferAmount,
                expenseVsTransferRatio
            }
        })

    } catch (error) {
        console.error('Analytics API error:', error)
        return NextResponse.json(
            { error: 'Błąd pobierania analiz' },
            { status: 500 }
        )
    }
}