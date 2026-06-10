import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { jsonResponse } from '@/lib/utils/api'
import { SYSTEM_DESCRIPTIONS, GROUP_NAME_MAP } from '@/lib/constants/system'
import { toNum } from '@/lib/utils/decimal'
import {
    AnnualReportData,
    GroupBreakdown,
    CategoryBreakdown,
    MonthlySummary,
    YearSummary
} from '@/lib/api/annual-report'

const MONTH_NAMES = [
    'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
    'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'
]

// Local map removed in favor of system constant

function isSystemTransaction(description: string): boolean {
    return Object.values(SYSTEM_DESCRIPTIONS).some(desc => description.includes(desc))
}

export async function GET(request: NextRequest) {
    try {
        // Authentication
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        // Get year parameter (default to current year)
        const { searchParams } = new URL(request.url)
        const yearParam = searchParams.get('year')
        const requestedYear = yearParam ? parseInt(yearParam) : new Date().getFullYear()
        const previousYear = requestedYear - 1
        const isCurrentYear = requestedYear === new Date().getFullYear()
        const currentMonth = new Date().getMonth() + 1
        const currentDivisor = isCurrentYear ? currentMonth : 12

        const prevDivisor = 12 // Previous year is always fully completed


        // Date ranges
        const yearStart = new Date(requestedYear, 0, 1)
        const yearEnd = new Date(requestedYear, 11, 31, 23, 59, 59, 999)
        const prevYearStart = new Date(previousYear, 0, 1)
        const prevYearEnd = new Date(previousYear, 11, 31, 23, 59, 59, 999)

        // Fetch categories for mapping
        const categories = await prisma.category.findMany({
            where: { userId }
        })
        const categoryMap = new Map(categories.map(c => [c.id, c]))
        const getCategoryName = (id: string) => categoryMap.get(id)?.name || 'Inne'
        const getCategoryIcon = (id: string) => categoryMap.get(id)?.icon || '📦'

        // Fetch all transactions for the year
        const yearTransactions = await prisma.transaction.findMany({
            where: {
                userId,
                date: { gte: yearStart, lte: yearEnd }
            },
            include: { envelope: true },
            orderBy: { date: 'asc' }
        })

        // Fetch previous year transactions for comparison
        const prevYearTransactions = await prisma.transaction.findMany({
            where: {
                userId,
                date: { gte: prevYearStart, lte: prevYearEnd }
            },
            include: { envelope: true }
        })

        // Filter out system transactions and those with includeInStats=false
        const filterTransactions = (txns: typeof yearTransactions) =>
            txns.filter(t =>
                !isSystemTransaction(t.description || '') &&
                (t as { includeInStats?: boolean }).includeInStats !== false
            )

        const validYearTransactions = filterTransactions(yearTransactions)
        const validPrevYearTransactions = filterTransactions(prevYearTransactions)

        // Separate income and expense transactions
        const expenseTransactions = validYearTransactions.filter(t => t.type === 'expense')
        const prevExpenseTransactions = validPrevYearTransactions.filter(t => t.type === 'expense')

        // Calculate year totals
        const yearIncome = validYearTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + toNum(t.amount), 0)

        const yearExpenses = validYearTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + toNum(t.amount), 0)

        const yearSavings = yearIncome - yearExpenses
        const yearSavingsRate = yearIncome > 0 ? (yearSavings / yearIncome) * 100 : 0

        const summary: YearSummary = {
            income: yearIncome,
            expenses: yearExpenses,
            savings: yearSavings,
            savingsRate: yearSavingsRate,
            monthlyAverage: {
                income: yearIncome / currentDivisor,
                expenses: yearExpenses / currentDivisor,
                savings: yearSavings / currentDivisor
            }
        }

        // Calculate previous year totals
        const prevYearIncome = validPrevYearTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + toNum(t.amount), 0)

        const prevYearExpenses = validPrevYearTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + toNum(t.amount), 0)

        const prevYearSavings = prevYearIncome - prevYearExpenses
        const prevYearSavingsRate = prevYearIncome > 0 ? (prevYearSavings / prevYearIncome) * 100 : 0

        const previousYearSummary: YearSummary = {
            income: prevYearIncome,
            expenses: prevYearExpenses,
            savings: prevYearSavings,
            savingsRate: prevYearSavingsRate,
            monthlyAverage: {
                income: prevYearIncome / prevDivisor,
                expenses: prevYearExpenses / prevDivisor,
                savings: prevYearSavings / prevDivisor
            }
        }

        // === CALCULATE MONTHLY DATA ===
        const monthlyData: MonthlySummary[] = []

        for (let month = 0; month < 12; month++) {
            const monthStart = new Date(requestedYear, month, 1)
            const monthEnd = new Date(requestedYear, month + 1, 0, 23, 59, 59, 999)

            const monthTransactions = validYearTransactions.filter(
                t => t.date >= monthStart && t.date <= monthEnd
            )

            const monthIncome = monthTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + toNum(t.amount), 0)

            const monthExpenses = monthTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + toNum(t.amount), 0)

            const monthSavings = monthIncome - monthExpenses
            const monthSavingsRate = monthIncome > 0 ? (monthSavings / monthIncome) * 100 : 0

            monthlyData.push({
                month: MONTH_NAMES[month],
                monthNumber: month + 1,
                income: monthIncome,
                expenses: monthExpenses,
                savings: monthSavings,
                savingsRate: monthSavingsRate
            })
        }

        // === CALCULATE GROUPS BREAKDOWN ===
        // Unified aggregation for BOTH years to ensure we show envelopes/categories that existed last year but not this year

        interface UnifiedCategoryData {
            id: string // categoryId or 'other'
            name: string
            icon: string
            currentAmount: number
            prevAmount: number
            currentTransactions: typeof expenseTransactions
        }

        interface UnifiedEnvelopeData {
            id: string
            name: string
            icon: string
            currentAmount: number
            prevAmount: number
            currentTransactions: typeof expenseTransactions
            categories: Map<string, UnifiedCategoryData>
        }

        interface UnifiedGroupData {
            totalCurrent: number
            totalPrev: number
            envelopes: Map<string, UnifiedEnvelopeData>
        }

        const unifiedGroups = new Map<string, UnifiedGroupData>()

        // Helper to process transactions into the unified structure
        const processTransactions = (transactions: typeof yearTransactions, isCurrentYear: boolean) => {
            transactions.forEach(t => {
                const groupName = t.envelope?.group || (t.type === 'income' ? 'income' : 'other')

                if (!unifiedGroups.has(groupName)) {
                    unifiedGroups.set(groupName, {
                        totalCurrent: 0,
                        totalPrev: 0,
                        envelopes: new Map()
                    })
                }
                const gData = unifiedGroups.get(groupName)!

                if (isCurrentYear) {
                    gData.totalCurrent += toNum(t.amount)
                } else {
                    gData.totalPrev += toNum(t.amount)
                }

                const envelopeName = t.envelope?.name || 'Inne'
                // Use envelope Name as key to merge same-named envelopes across years
                const envelopeKey = envelopeName

                const envelopeId = t.envelope?.id || 'other'
                const envelopeIcon = t.envelope?.icon || '📦'

                if (!gData.envelopes.has(envelopeKey)) {
                    gData.envelopes.set(envelopeKey, {
                        id: envelopeId,
                        name: envelopeName,
                        icon: envelopeIcon,
                        currentAmount: 0,
                        prevAmount: 0,
                        currentTransactions: [],
                        categories: new Map()
                    })
                }
                const eData = gData.envelopes.get(envelopeKey)!

                // Update Metadata if it was created from a previous year txn but now we have a current one
                if (isCurrentYear) {
                    eData.id = envelopeId
                    eData.icon = envelopeIcon
                    eData.currentAmount += toNum(t.amount)
                    eData.currentTransactions.push(t)
                } else {
                    eData.prevAmount += toNum(t.amount)
                }

                // --- Category Processing ---
                let catId = t.category
                if (!catId && t.envelope?.name) {
                    // Try to infer category from default envelope if missing
                    const envCats = categories.filter(c => c.defaultEnvelope === t.envelope?.name)
                    if (envCats.length > 0) catId = envCats[0].id
                }
                catId = catId || 'other'
                const catName = getCategoryName(catId)
                const catIcon = getCategoryIcon(catId)

                if (!eData.categories.has(catId)) {
                    eData.categories.set(catId, {
                        id: catId,
                        name: catName,
                        icon: catIcon,
                        currentAmount: 0,
                        prevAmount: 0,
                        currentTransactions: []
                    })
                }
                const cData = eData.categories.get(catId)!

                if (isCurrentYear) {
                    cData.currentAmount += toNum(t.amount)
                    cData.currentTransactions.push(t)
                } else {
                    cData.prevAmount += toNum(t.amount)
                }
            })
        }

        // 1. Process Current Year
        processTransactions(expenseTransactions, true)

        // 2. Process Previous Year
        processTransactions(prevExpenseTransactions, false)

        // 3. Transform to Response Structure
        const groupsBreakdown: GroupBreakdown[] = Array.from(unifiedGroups.entries())
            .map(([groupName, gData]) => {
                const groupChange = gData.totalCurrent - gData.totalPrev
                const groupChangePercent = gData.totalPrev > 0
                    ? (groupChange / gData.totalPrev) * 100
                    : (gData.totalCurrent > 0 ? 100 : 0)
                const prevGroupAvg = gData.totalPrev / prevDivisor

                const envelopes = Array.from(gData.envelopes.values())
                    .map((eData) => {
                        // Monthly trend for envelope (AreaChart data) - ONLY for Current Year
                        const monthlyTrend = []
                        for (let m = 0; m < 12; m++) {
                            const monthStart = new Date(requestedYear, m, 1)
                            const monthEnd = new Date(requestedYear, m + 1, 0, 23, 59, 59, 999)
                            const monthAmount = eData.currentTransactions
                                .filter(t => t.date >= monthStart && t.date <= monthEnd)
                                .reduce((sum, t) => sum + toNum(t.amount), 0)

                            monthlyTrend.push({
                                month: MONTH_NAMES[m],
                                amount: monthAmount
                            })
                        }

                        const envelopeCategories = Array.from(eData.categories.values())
                            .map((cData) => {
                                // Calculate monthly trend for category (Current Year)
                                const catMonthlyTrend = []
                                for (let m = 0; m < 12; m++) {
                                    const monthStart = new Date(requestedYear, m, 1)
                                    const monthEnd = new Date(requestedYear, m + 1, 0, 23, 59, 59, 999)
                                    const monthAmount = cData.currentTransactions
                                        .filter(t => t.date >= monthStart && t.date <= monthEnd)
                                        .reduce((sum, t) => sum + toNum(t.amount), 0)

                                    catMonthlyTrend.push({
                                        month: MONTH_NAMES[m],
                                        amount: monthAmount
                                    })
                                }

                                const catChange = cData.currentAmount - cData.prevAmount
                                const catChangePercent = cData.prevAmount > 0
                                    ? (catChange / cData.prevAmount) * 100
                                    : (cData.currentAmount > 0 ? 100 : 0)
                                const prevCatAvg = cData.prevAmount / prevDivisor

                                return {
                                    categoryId: cData.id,
                                    categoryName: cData.name,
                                    categoryIcon: cData.icon,
                                    amount: cData.currentAmount,
                                    percentage: eData.currentAmount > 0 ? (cData.currentAmount / eData.currentAmount) * 100 : 0,
                                    monthlyTrend: catMonthlyTrend,
                                    monthlyAverage: cData.currentAmount / currentDivisor,
                                    transactionCount: cData.currentTransactions.length,
                                    yearOverYear: (cData.prevAmount > 0 || cData.currentAmount > 0) ? {
                                        previousYearAmount: cData.prevAmount,
                                        change: catChange,
                                        changePercent: catChangePercent,
                                        previousYearMonthlyAverage: prevCatAvg
                                    } : undefined
                                }
                            })
                            .sort((a, b) => (b.amount || (b.yearOverYear?.previousYearAmount || 0)) - (a.amount || (a.yearOverYear?.previousYearAmount || 0)))

                        const envChange = eData.currentAmount - eData.prevAmount
                        const envChangePercent = eData.prevAmount > 0
                            ? (envChange / eData.prevAmount) * 100
                            : (eData.currentAmount > 0 ? 100 : 0)
                        const prevEnvAvg = eData.prevAmount / prevDivisor

                        return {
                            envelopeId: eData.id,
                            envelopeName: eData.name,
                            envelopeIcon: eData.icon,
                            totalAmount: eData.currentAmount,
                            percentage: gData.totalCurrent > 0 ? (eData.currentAmount / gData.totalCurrent) * 100 : 0,
                            monthlyAverage: eData.currentAmount / currentDivisor,
                            transactionCount: eData.currentTransactions.length,
                            yearOverYear: (eData.prevAmount > 0 || eData.currentAmount > 0) ? {
                                previousYearAmount: eData.prevAmount,
                                change: envChange,
                                changePercent: envChangePercent,
                                previousYearMonthlyAverage: prevEnvAvg
                            } : undefined,
                            monthlyTrend,
                            categories: envelopeCategories
                        }
                    })
                    // Sort by total amount desc, but if 0 use prev amount desc to keep relevant dead envelopes visible
                    .sort((a, b) => (b.totalAmount || (b.yearOverYear?.previousYearAmount || 0)) - (a.totalAmount || (a.yearOverYear?.previousYearAmount || 0)))

                return {
                    groupName: GROUP_NAME_MAP[groupName.toLowerCase()] || groupName,
                    totalAmount: gData.totalCurrent,
                    percentage: yearExpenses > 0 ? (gData.totalCurrent / yearExpenses) * 100 : 0,
                    yearOverYear: (gData.totalPrev > 0 || gData.totalCurrent > 0) ? {
                        previousYearAmount: gData.totalPrev,
                        change: groupChange,
                        changePercent: groupChangePercent,
                        previousYearMonthlyAverage: prevGroupAvg
                    } : undefined,
                    envelopes
                }
            })
            // Sort groups
            .sort((a, b) => (b.totalAmount || (b.yearOverYear?.previousYearAmount || 0)) - (a.totalAmount || (a.yearOverYear?.previousYearAmount || 0)))

        // === CALCULATE CATEGORY BREAKDOWN (Old logic kept for PieChart) ===
        // Group by category
        const categoryData = new Map<string, {
            transactions: typeof expenseTransactions
            totalAmount: number
            envelopeBreakdown: Map<string, { amount: number, icon: string }>
        }>()

        expenseTransactions.forEach(transaction => {
            let categoryId = transaction.category

            // Infer category from envelope if not set
            if (!categoryId && transaction.envelope?.name) {
                const envelopeCategories = categories.filter(
                    c => c.defaultEnvelope === transaction.envelope?.name
                )
                if (envelopeCategories.length > 0) {
                    categoryId = envelopeCategories[0].id
                }
            }
            categoryId = categoryId || 'other'

            if (!categoryData.has(categoryId)) {
                categoryData.set(categoryId, {
                    transactions: [],
                    totalAmount: 0,
                    envelopeBreakdown: new Map()
                })
            }

            const data = categoryData.get(categoryId)!
            data.transactions.push(transaction)
            data.totalAmount += toNum(transaction.amount)

            // Track envelope breakdown
            const envelopeName = transaction.envelope?.name || 'Inne'
            const envelopeIcon = transaction.envelope?.icon || '📦'

            if (!data.envelopeBreakdown.has(envelopeName)) {
                data.envelopeBreakdown.set(envelopeName, { amount: 0, icon: envelopeIcon })
            }
            data.envelopeBreakdown.get(envelopeName)!.amount += toNum(transaction.amount)
        })

        // Build category breakdown with year-over-year comparison
        const categoryBreakdown: CategoryBreakdown[] = []

        // Use Array.from before iterating to avoid TS errors
        const categoryDataArray = Array.from(categoryData.entries())

        for (const [categoryId, data] of categoryDataArray) {
            const categoryName = getCategoryName(categoryId)
            const categoryIcon = getCategoryIcon(categoryId)
            const totalAmount = data.totalAmount
            const percentage = yearExpenses > 0 ? (totalAmount / yearExpenses) * 100 : 0
            const monthlyAverage = totalAmount / currentDivisor

            // Calculate previous year amount for this category
            const prevYearAmount = prevExpenseTransactions
                .filter(t => {
                    let catId = t.category
                    if (!catId && t.envelope?.name) {
                        const envCats = categories.filter(c => c.defaultEnvelope === t.envelope?.name)
                        if (envCats.length > 0) catId = envCats[0].id
                    }
                    return (catId || 'other') === categoryId
                })
                .reduce((sum, t) => sum + toNum(t.amount), 0)

            const change = totalAmount - prevYearAmount
            const changePercent = prevYearAmount > 0 ? (change / prevYearAmount) * 100 : 0

            // Calculate monthly trend for this category (REAL DATA)
            const monthlyTrend: { month: string; amount: number }[] = []
            for (let m = 0; m < 12; m++) {
                const monthStart = new Date(requestedYear, m, 1)
                const monthEnd = new Date(requestedYear, m + 1, 0, 23, 59, 59, 999)

                const monthAmount = data.transactions
                    .filter(t => t.date >= monthStart && t.date <= monthEnd)
                    .reduce((sum, t) => sum + toNum(t.amount), 0)

                monthlyTrend.push({
                    month: MONTH_NAMES[m],
                    amount: monthAmount
                })
            }

            // Build subcategories (envelope breakdown)
            const subcategories = Array.from(data.envelopeBreakdown.entries())
                .map(([envelopeName, info]) => ({
                    envelopeName,
                    envelopeIcon: info.icon,
                    amount: info.amount,
                    percentage: totalAmount > 0 ? (info.amount / totalAmount) * 100 : 0
                }))
                .sort((a, b) => b.amount - a.amount)

            categoryBreakdown.push({
                categoryId,
                categoryName,
                categoryIcon,
                totalAmount,
                percentage,
                monthlyAverage,
                transactionCount: data.transactions.length,
                yearOverYear: prevYearAmount > 0 ? {
                    previousYearAmount: prevYearAmount,
                    change,
                    changePercent,
                    previousYearMonthlyAverage: prevYearAmount / prevDivisor
                } : undefined,
                monthlyTrend,
                subcategories
            })
        }

        // Sort by total amount descending
        categoryBreakdown.sort((a, b) => b.totalAmount - a.totalAmount)

        // === CALCULATE INCOME BREAKDOWN ===
        // Logic adapted from app/api/analytics/income/route.ts for consistency
        const incomeData = new Map<string, {
            amount: number
            transactions: typeof validYearTransactions
        }>()

        // Common patterns for detection
        const monthsPattern = 'styczeń|luty|marzec|kwiecień|maj|czerwiec|lipiec|sierpień|wrzesień|październik|listopad|grudzień'
        const patterns = [
            {
                name: 'Wypłata', regex: [
                    /wypłata.*\d{4}/i, /salary.*\d{4}/i, /pensja.*\d{4}/i,
                    /wypłata\s+miesięczna/i, /miesięczna\s+wypłata/i, /wypłata/i, /pensja/i, /salary/i,
                    new RegExp(`wypłata.*(${monthsPattern})`, 'i')
                ]
            },
            {
                name: 'Premia', regex: [
                    /premia.*\d{4}/i, /bonus.*\d{4}/i, /premia\s+miesięczna/i, /miesięczna\s+premia/i,
                    /dodatek.*\d{4}/i, /premia/i, /bonus/i,
                    new RegExp(`premia.*(${monthsPattern})`, 'i'),
                    new RegExp(`dodatek.*(${monthsPattern})`, 'i')
                ]
            },
            {
                name: 'Inne', regex: [
                    /inne\s+przychody.*\d{4}/i, /dodatkowe\s+przychody.*\d{4}/i, /pozostałe\s+przychody.*\d{4}/i,
                    new RegExp(`inne\\s+przychody.*(${monthsPattern})`, 'i'),
                    new RegExp(`dodatkowe\\s+przychody.*(${monthsPattern})`, 'i'),
                    new RegExp(`pozostałe\\s+przychody.*(${monthsPattern})`, 'i')
                ]
            },
            { name: 'Multisport', regex: [/multisport/i] },
            { name: 'Delegacja', regex: [/delegacja/i] }
        ]

        validYearTransactions
            .filter(t => t.type === 'income')
            .forEach(t => {
                const originalSource = t.description || 'Inne przychody'
                let normalizedSource = originalSource.trim()
                const description = normalizedSource.toLowerCase()

                let found = false
                for (const p of patterns) {
                    if (p.regex.some(r => r.test(description))) {
                        normalizedSource = p.name
                        found = true
                        break
                    }
                }

                if (!found) {
                    // Simple normalization for unknown sources: Title Case
                    normalizedSource = normalizedSource.charAt(0).toUpperCase() + normalizedSource.slice(1).toLowerCase()
                }

                if (!incomeData.has(normalizedSource)) {
                    incomeData.set(normalizedSource, { amount: 0, transactions: [] })
                }
                const data = incomeData.get(normalizedSource)!
                data.amount += toNum(t.amount)
                data.transactions.push(t)
            })

        const incomeBreakdown = Array.from(incomeData.entries())
            .map(([sourceName, data]) => ({
                categoryId: sourceName, // Using source name as ID for visuals
                categoryName: sourceName,
                categoryIcon: '💰', // Default icon for income sources
                amount: data.amount,
                percentage: yearIncome > 0 ? (data.amount / yearIncome) * 100 : 0
            }))
            .sort((a, b) => b.amount - a.amount)

        // === BUILD RESPONSE ===
        const response: AnnualReportData = {
            year: requestedYear,
            previousYear,
            summary,
            previousYearSummary,
            monthlyData,
            categoryBreakdown,
            groupsBreakdown,
            incomeBreakdown,
            totalTransactions: validYearTransactions.length
        }

        return jsonResponse(response)

    } catch (error) {
        console.error('Error in annual report API:', error)
        return jsonResponse(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
