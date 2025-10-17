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

async function getEnvelopeAnalysis(realExpenses: any[], envelopes: any[], sortedMonths: MonthlyData[], userId: string): Promise<EnvelopeAnalysis[]> {
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
            const currentMonthStart = new Date(currentMonthData.year, getMonthIndex(currentMonthData.month), 1)
            const currentMonthEnd = new Date(currentMonthData.year, getMonthIndex(currentMonthData.month) + 1, 0, 23, 59, 59)
            
            const currentMonthTransactions = await prisma.transaction.findMany({
                where: {
                    userId: userId,
                    type: 'expense',
                    date: { 
                        gte: currentMonthStart,
                        lte: currentMonthEnd
                    },
                    envelope: { name: envelopeName }
                }
            })

            const previousMonthStart = new Date(previousMonthData.year, getMonthIndex(previousMonthData.month), 1)
            const previousMonthEnd = new Date(previousMonthData.year, getMonthIndex(previousMonthData.month) + 1, 0, 23, 59, 59)
            
            const previousMonthTransactions = await prisma.transaction.findMany({
                where: {
                    userId: userId,
                    type: 'expense',
                    date: { 
                        gte: previousMonthStart,
                        lte: previousMonthEnd
                    },
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

            const allCategories = Array.from(new Set([...Object.keys(currentCategories), ...Object.keys(previousCategories)]))
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

function getGroupIcon(groupName: string): string {
    const groupIcons: { [key: string]: string } = {
        'POTRZEBY': '🏠',
        'STYL ŻYCIA': '🎯',
        'CELE FINANSOWE': '💰',
        'Inne': '📦'
    }
    return groupIcons[groupName] || '📦'
}

async function getTrendsData(userId: string, startDate: Date, endDate: Date) {
    const trends = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59)
        
        const monthTransactions = await prisma.transaction.findMany({
            where: {
                userId: userId,
                type: 'expense',
                date: { gte: monthStart, lte: monthEnd },
                NOT: [
                    { description: { contains: 'Zamknięcie miesiąca' } },
                    { description: { contains: 'przeniesienie bilansu' } }
                ]
            }
        })
        
        const totalExpenses = monthTransactions
            .filter(t => (t as { includeInStats?: boolean }).includeInStats !== false)
            .reduce((sum, t) => sum + t.amount, 0)
        
        trends.push({
            period: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
            totalExpenses
        })
        
        currentDate.setMonth(currentDate.getMonth() + 1)
    }
    
    return trends
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
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const compare = searchParams.get('compare') === 'true'
        
        // Jeśli nie podano dat, użyj domyślnego okresu
        let start: Date, end: Date
        if (startDate && endDate) {
            start = new Date(startDate)
            end = new Date(endDate)
        } else {
        const period = searchParams.get('period') || '3months'
            start = getStartDate(period)
            end = new Date()
        }

        // Pobierz koperty
        const envelopes = await prisma.envelope.findMany({
            where: { userId: userId }
        })

        // === GŁÓWNE METRYKI DLA BIEŻĄCEGO OKRESU ===
        const currentPeriodTransactions = await prisma.transaction.findMany({
            where: {
                userId: userId,
                type: { in: ['income', 'expense'] },
                date: { gte: start, lte: end },
                NOT: [
                    { description: { contains: 'Zamknięcie miesiąca' } },
                    { description: { contains: 'przeniesienie bilansu' } }
                ]
            },
            include: { envelope: true }
        })

        const currentIncome = currentPeriodTransactions
            .filter(t => t.type === 'income' && (t as { includeInStats?: boolean }).includeInStats !== false)
            .reduce((sum, t) => sum + t.amount, 0)

        const currentExpenses = currentPeriodTransactions
            .filter(t => t.type === 'expense' && (t as { includeInStats?: boolean }).includeInStats !== false)
            .reduce((sum, t) => sum + t.amount, 0)

        const currentBalance = currentIncome - currentExpenses
        const currentSavingsRate = currentIncome > 0 ? currentBalance / currentIncome : 0

        // === DANE PORÓWNAWCZE (jeśli włączony tryb porównawczy) ===
        let previousPeriodData = null
        if (compare) {
            const periodLength = end.getTime() - start.getTime()
            const previousStart = new Date(start.getTime() - periodLength)
            const previousEnd = new Date(start.getTime() - 1)

            const previousPeriodTransactions = await prisma.transaction.findMany({
                where: {
                    userId: userId,
                    type: { in: ['income', 'expense'] },
                    date: { gte: previousStart, lte: previousEnd },
                    NOT: [
                        { description: { contains: 'Zamknięcie miesiąca' } },
                        { description: { contains: 'przeniesienie bilansu' } }
                    ]
                }
            })

            const previousIncome = previousPeriodTransactions
                .filter(t => t.type === 'income' && (t as { includeInStats?: boolean }).includeInStats !== false)
                .reduce((sum, t) => sum + t.amount, 0)

            const previousExpenses = previousPeriodTransactions
                .filter(t => t.type === 'expense' && (t as { includeInStats?: boolean }).includeInStats !== false)
                .reduce((sum, t) => sum + t.amount, 0)

            const previousBalance = previousIncome - previousExpenses
            const previousSavingsRate = previousIncome > 0 ? previousBalance / previousIncome : 0

            previousPeriodData = {
                income: previousIncome,
                expense: previousExpenses,
                balance: previousBalance,
                savingsRate: previousSavingsRate
            }
        }

        // === ROZKŁAD WYDATKÓW WEDŁUG GRUP KOPERT ===
        const expensesByGroup: { [key: string]: { amount: number; envelopes: any[] } } = {}
        
        for (const transaction of currentPeriodTransactions.filter(t => t.type === 'expense' && (t as { includeInStats?: boolean }).includeInStats !== false)) {
            const envelope = transaction.envelope
            const groupName = envelope?.group || 'Inne'
            
            if (!expensesByGroup[groupName]) {
                expensesByGroup[groupName] = { amount: 0, envelopes: [] }
            }
            
            expensesByGroup[groupName].amount += transaction.amount
            
            const existingEnvelope = expensesByGroup[groupName].envelopes.find(e => e.name === envelope?.name)
            if (existingEnvelope) {
                existingEnvelope.amount += transaction.amount
                } else {
                expensesByGroup[groupName].envelopes.push({
                    name: envelope?.name || 'Inne',
                    amount: transaction.amount,
                    icon: envelope?.icon || '📦',
                    percentage: 0
                })
            }
        }

        // Oblicz procenty dla kopert w grupach
        Object.values(expensesByGroup).forEach(group => {
            group.envelopes.forEach(envelope => {
                envelope.percentage = group.amount > 0 ? Math.round((envelope.amount / group.amount) * 100) : 0
            })
            group.envelopes.sort((a, b) => b.amount - a.amount)
        })

        const spendingBreakdownByGroup = Object.entries(expensesByGroup).map(([groupName, data]) => ({
            group: groupName,
            amount: data.amount,
            percentage: currentExpenses > 0 ? Math.round((data.amount / currentExpenses) * 100) : 0,
            icon: getGroupIcon(groupName),
            envelopes: data.envelopes
        })).sort((a, b) => b.amount - a.amount)

        // === ROZKŁAD WYDATKÓW WEDŁUG KOPERT ===
        const expensesByEnvelope: { [key: string]: { amount: number; categories: any[] } } = {}
        
        for (const transaction of currentPeriodTransactions.filter(t => t.type === 'expense' && (t as { includeInStats?: boolean }).includeInStats !== false)) {
            const envelope = transaction.envelope
            const envelopeName = envelope?.name || 'Inne'
            const category = transaction.category || 'other'
            
            if (!expensesByEnvelope[envelopeName]) {
                expensesByEnvelope[envelopeName] = { amount: 0, categories: [] }
            }
            
            expensesByEnvelope[envelopeName].amount += transaction.amount
            
            const existingCategory = expensesByEnvelope[envelopeName].categories.find(c => c.categoryId === category)
            if (existingCategory) {
                existingCategory.amount += transaction.amount
            } else {
                expensesByEnvelope[envelopeName].categories.push({
                    categoryId: category,
                    categoryName: getCategoryName(category),
                    amount: transaction.amount,
                    icon: getCategoryIcon(category),
                    percentage: 0
                })
            }
        }

        // Oblicz procenty dla kategorii w kopertach
        Object.values(expensesByEnvelope).forEach(envelope => {
            envelope.categories.forEach(category => {
                category.percentage = envelope.amount > 0 ? Math.round((category.amount / envelope.amount) * 100) : 0
            })
            envelope.categories.sort((a, b) => b.amount - a.amount)
        })

        const spendingBreakdownByEnvelope = Object.entries(expensesByEnvelope).map(([envelopeName, data]) => ({
            envelope: envelopeName,
            amount: data.amount,
            percentage: currentExpenses > 0 ? Math.round((data.amount / currentExpenses) * 100) : 0,
            icon: envelopes.find(e => e.name === envelopeName)?.icon || '📦',
            categories: data.categories
        })).sort((a, b) => b.amount - a.amount)

        // === ROZKŁAD WEDŁUG KATEGORII ===
        const expensesByCategory: { [key: string]: { amount: number } } = {}
        
        for (const transaction of currentPeriodTransactions.filter(t => t.type === 'expense' && (t as { includeInStats?: boolean }).includeInStats !== false)) {
            const category = transaction.category || 'other'
            if (!expensesByCategory[category]) {
                expensesByCategory[category] = { amount: 0 }
            }
            expensesByCategory[category].amount += transaction.amount
        }

        const spendingBreakdownByCategory = Object.entries(expensesByCategory).map(([categoryId, data]) => ({
            category: getCategoryName(categoryId),
            amount: data.amount,
            percentage: currentExpenses > 0 ? Math.round((data.amount / currentExpenses) * 100) : 0,
            icon: getCategoryIcon(categoryId)
        })).sort((a, b) => b.amount - a.amount)

        // === TRENDY CZASOWE ===
        const trends = await getTrendsData(userId, start, end)

        return NextResponse.json({
            mainMetrics: {
                currentPeriod: {
                    income: currentIncome,
                    expense: currentExpenses,
                    balance: currentBalance,
                    savingsRate: currentSavingsRate
                },
                previousPeriod: previousPeriodData
            },
            spendingBreakdown: {
                byGroup: spendingBreakdownByGroup,
                byEnvelope: spendingBreakdownByEnvelope,
                byCategory: spendingBreakdownByCategory
            },
            trends
        })

    } catch (error) {
        console.error('Analytics API error:', error)
        return NextResponse.json(
            { error: 'Błąd pobierania analiz' },
            { status: 500 }
        )
    }
}