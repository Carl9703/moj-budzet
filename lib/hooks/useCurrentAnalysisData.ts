import { useMemo } from 'react'
import { formatTrendData, calculateSourceTrend } from '@/lib/utils/analytics-helpers'

interface UseCurrentAnalysisDataProps {
    data: any
    incomeData: any
    compareMode: boolean
    previousIncomeData?: any
    monthsInPeriod: number
}

export function useCurrentAnalysisData({
    data,
    incomeData,
    compareMode,
    previousIncomeData,
    monthsInPeriod
}: UseCurrentAnalysisDataProps) {

    // Transform analytics data to annual-report format
    const summary = useMemo(() => data ? {
        income: data.mainMetrics?.currentPeriod?.income || 0,
        expenses: data.mainMetrics?.currentPeriod?.expense || 0,
        savings: (data.mainMetrics?.currentPeriod?.income || 0) - (data.mainMetrics?.currentPeriod?.expense || 0),
        savingsRate: data.mainMetrics?.currentPeriod?.savingsRate || 0,
        monthlyAverage: {
            income: data.mainMetrics?.currentPeriod?.income || 0,
            expenses: data.mainMetrics?.currentPeriod?.expense || 0,
            savings: (data.mainMetrics?.currentPeriod?.income || 0) - (data.mainMetrics?.currentPeriod?.expense || 0)
        }
    } : null, [data])

    const previousSummary = useMemo(() => (compareMode && data?.mainMetrics?.previousPeriod) ? {
        income: data.mainMetrics.previousPeriod.income || 0,
        expenses: data.mainMetrics.previousPeriod.expense || 0,
        savings: (data.mainMetrics.previousPeriod.income || 0) - (data.mainMetrics.previousPeriod.expense || 0),
        savingsRate: data.mainMetrics.previousPeriod.savingsRate || 0,
        monthlyAverage: {
            income: data.mainMetrics.previousPeriod.income || 0,
            expenses: data.mainMetrics.previousPeriod.expense || 0,
            savings: (data.mainMetrics.previousPeriod.income || 0) - (data.mainMetrics.previousPeriod.expense || 0)
        }
    } : undefined, [compareMode, data])

    const groupsBreakdown = useMemo(() => data?.spendingTree?.map((group: any) => ({
        groupName: group.name,
        totalAmount: group.total,
        percentage: data?.totalExpenses ? (group.total / data.totalExpenses) * 100 : 0,
        yearOverYear: group.comparison ? {
            previousYearAmount: group.comparison.previousTotal,
            change: group.comparison.change,
            changePercent: group.comparison.changePercent,
            previousYearMonthlyAverage: group.comparison.previousTotal
        } : undefined,
        envelopes: group.children?.filter((c: any) => c.type === 'ENVELOPE').map((envelope: any) => {
            const envTrend = data.trends?.byEnvelopeName?.[envelope.name] || []
            return {
                envelopeId: envelope.id,
                envelopeName: envelope.name,
                envelopeIcon: envelope.icon || '📦',
                totalAmount: envelope.total,
                percentage: group.total ? (envelope.total / group.total) * 100 : 0,
                monthlyAverage: envelope.total / monthsInPeriod,
                transactionCount: (envelope.children?.filter((c: any) => c.type === 'CATEGORY').flatMap((cat: any) =>
                    cat.children?.filter((t: any) => t.type === 'TRANSACTION') || []
                ) || []).length,
                monthlyTrend: formatTrendData(envTrend),
                transactions: envelope.children?.filter((c: any) => c.type === 'CATEGORY').flatMap((cat: any) =>
                    cat.children?.filter((t: any) => t.type === 'TRANSACTION').map((t: any) => ({
                        id: t.id,
                        total: t.total,
                        amount: t.total,
                        description: t.description,
                        date: t.date
                    })) || []
                ) || [],
                yearOverYear: envelope.comparison ? {
                    previousYearAmount: envelope.comparison.previousTotal,
                    change: envelope.comparison.change,
                    changePercent: envelope.comparison.changePercent,
                    previousYearMonthlyAverage: envelope.comparison.previousTotal
                } : undefined,
                categories: envelope.children?.filter((c: any) => c.type === 'CATEGORY').map((cat: any) => {
                    const catTrend = data.trends?.byCategoryName?.[cat.name] || []
                    return {
                        categoryId: cat.id,
                        categoryName: cat.name,
                        categoryIcon: cat.icon || '📌',
                        amount: cat.total,
                        percentage: envelope.total ? (cat.total / envelope.total) * 100 : 0,
                        monthlyTrend: formatTrendData(catTrend),
                        monthlyAverage: cat.total / monthsInPeriod,
                        transactions: cat.children?.filter((t: any) => t.type === 'TRANSACTION').map((t: any) => ({
                            id: t.id,
                            total: t.total,
                            amount: t.total,
                            description: t.description,
                            date: t.date
                        })) || [],
                        transactionCount: (cat.children?.filter((t: any) => t.type === 'TRANSACTION') || []).length,
                        yearOverYear: cat.comparison ? {
                            previousYearAmount: cat.comparison.previousTotal,
                            change: cat.comparison.change,
                            changePercent: cat.comparison.changePercent,
                            previousYearMonthlyAverage: cat.comparison.previousTotal / 12
                        } : undefined,
                    }
                }) || []
            }
        }) || []
    })) || [], [data, monthsInPeriod])

    const incomeSourcesMapped = useMemo(() => (incomeData?.sources || []).map((s: any) => ({
        source: s.source,
        total: s.total,
        count: s.count,
        percentage: (s.total / incomeData.totalIncome) * 100,
        transactions: s.transactions,
        monthlyTrend: calculateSourceTrend(s.transactions, incomeData.trends)
    })), [incomeData])

    const previousIncomeSourcesMapped = useMemo(() => previousIncomeData?.sources?.map((s: any) => ({
        source: s.source,
        monthlyTrend: calculateSourceTrend(s.transactions, previousIncomeData.trends || [])
    })), [previousIncomeData])

    return {
        summary,
        previousSummary,
        groupsBreakdown,
        incomeSourcesMapped,
        previousIncomeSourcesMapped
    }
}
