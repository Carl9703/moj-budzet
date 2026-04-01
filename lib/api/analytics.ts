import { api } from './client'
import { SpendingTreeNode, DateRange } from '../types'

export interface MainMetrics {
    currentPeriod: {
        income: number
        expense: number
        balance: number
        savingsRate: number
    }
    previousPeriod?: {
        income: number
        expense: number
        balance: number
        savingsRate: number
    }
}

export interface TrendData {
    period: string
    value: number
}

export interface TrendsData {
    totalExpenses: TrendData[]
    byEnvelope: { [envelopeId: string]: TrendData[] }
    byEnvelopeName: { [envelopeName: string]: TrendData[] }
    byCategoryName: { [categoryName: string]: TrendData[] }
}

export interface CategoryAnalysis {
    categoryId: string
    categoryName: string
    categoryIcon: string
    totalAmount: number
    transactionCount: number
    avgTransactionAmount: number
    percentage: number
    envelopeBreakdown: {
        envelopeName: string
        envelopeIcon: string
        amount: number
        percentage: number
    }[]
    monthlyTrend: {
        month: string
        year: number
        amount: number
    }[]
    transactions: {
        id: string
        amount: number
        description: string
        date: string
        envelopeName: string
        envelopeIcon: string
    }[]
}

export interface AnalyticsData {
    mainMetrics: MainMetrics
    spendingTree: SpendingTreeNode[]
    trends: TrendsData
    categoryAnalysis: CategoryAnalysis[]
    totalExpenses: number
    period: string
    summary: {
        totalCategories: number
        totalTransactions: number
        avgTransactionAmount: number
    }
}

export interface IncomeSource {
    source: string
    total: number
    count: number
    avgAmount: number
    percentage: number
    transactions: {
        id: string
        amount: number
        description: string
        date: string
    }[]
}

export interface IncomeTrendData {
    period: string
    value: number
}

export interface IncomeAnalyticsData {
    sources: IncomeSource[]
    trends: IncomeTrendData[]
    totalIncome: number
    period: string
    summary: {
        totalSources: number
        totalTransactions: number
        avgTransactionAmount: number
    }
}

const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export const analyticsApi = {
    getExpenses: (dateRange: DateRange, compare: boolean) => {
        const params = new URLSearchParams()
        if (dateRange.from && dateRange.to) {
            params.append('startDate', formatDate(dateRange.from))
            params.append('endDate', formatDate(dateRange.to))
        }
        if (compare) {
            params.append('compare', 'true')
        }
        // Extract period from URL if possible to pass it to API
        const urlParams = new URLSearchParams(window.location.search)
        const period = urlParams.get('period')
        if (period) {
            params.append('period', period)
        }

        return api.get<AnalyticsData>(`/api/analytics?${params.toString()}`)
    },

    getIncome: (dateRange: DateRange) => {
        const params = new URLSearchParams()
        if (dateRange.from && dateRange.to) {
            params.append('startDate', formatDate(dateRange.from))
            params.append('endDate', formatDate(dateRange.to))
        }
        const urlParams = new URLSearchParams(window.location.search)
        const period = urlParams.get('period')
        if (period) {
            params.append('period', period)
        }

        return api.get<IncomeAnalyticsData>(`/api/analytics/income?${params.toString()}`)
    },

    getAvailableYears: () => {
        return api.get<number[]>('/api/analytics/available-years')
    }
}

export const fetchAnalyticsData = analyticsApi.getExpenses
export const fetchIncomeAnalytics = analyticsApi.getIncome
export const fetchAvailableYears = analyticsApi.getAvailableYears
