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

export const analyticsApi = {
    getExpenses: (dateRange: DateRange, compare: boolean) => {
        const params = new URLSearchParams()
        if (dateRange.from && dateRange.to) {
            params.append('startDate', dateRange.from.toISOString())
            params.append('endDate', dateRange.to.toISOString())
        }
        if (compare) {
            params.append('compare', 'true')
        }
        return api.get<AnalyticsData>(`/api/analytics?${params.toString()}`)
    },

    getIncome: (dateRange: DateRange) => {
        const params = new URLSearchParams()
        if (dateRange.from && dateRange.to) {
            params.append('startDate', dateRange.from.toISOString())
            params.append('endDate', dateRange.to.toISOString())
        }
        return api.get<IncomeAnalyticsData>(`/api/analytics/income?${params.toString()}`)
    }
}

export const fetchAnalyticsData = analyticsApi.getExpenses
export const fetchIncomeAnalytics = analyticsApi.getIncome
