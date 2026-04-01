'use client'

import { motion } from 'framer-motion'
import { Calendar, CalendarDays, TrendingUp, CalendarRange, Filter } from 'lucide-react'
import type { DateRange } from '@/lib/types'
import { formatMoneyWithSeparators } from '@/lib/utils/money'

// Annual Report style components
import { EnvelopePieChart } from '@/components/features/annual-report/EnvelopePieChart'
import { DetailedCategoryBreakdown } from '@/components/features/annual-report/DetailedCategoryBreakdown'

interface CurrentAnalysisViewProps {
    data: any
    loading: boolean
    dateRange: DateRange
    compareMode: boolean
    period?: string
    onDateRangeChange: (range: DateRange, period?: string) => void
    onCompareModeChange: (enabled: boolean) => void
}

const PREDEFINED_PERIODS = [
    { key: 'currentMonth', label: 'Obecny miesiąc', icon: Calendar, getDates: () => ({ from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), to: new Date() }) },
    { key: 'previousMonth', label: 'Poprzedni miesiąc', icon: CalendarDays, getDates: () => ({ from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), to: new Date(new Date().getFullYear(), new Date().getMonth(), 0) }) },
    { key: 'last3Months', label: 'Ostatnie 3 miesiące', icon: TrendingUp, getDates: () => ({ from: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1), to: new Date() }) },
    { key: 'last6Months', label: 'Ostatnie 6 miesięcy', icon: TrendingUp, getDates: () => ({ from: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1), to: new Date() }) },
    { key: 'currentYear', label: 'Ten rok', icon: CalendarRange, getDates: () => ({ from: new Date(new Date().getFullYear(), 0, 1), to: new Date() }) },
]

export function CurrentAnalysisView({
    data,
    loading,
    dateRange,
    compareMode,
    period,
    onDateRangeChange,
    onCompareModeChange
}: CurrentAnalysisViewProps) {
    const selectedPeriod = period || 'currentMonth'

    const handlePeriodSelect = (periodKey: string) => {
        const periodData = PREDEFINED_PERIODS.find(p => p.key === periodKey)
        if (periodData) onDateRangeChange(periodData.getDates(), periodKey)
    }

    const formatDate = (date: Date | undefined) =>
        date?.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }) || ''

    // Transform spendingTree to groupsBreakdown format for annual-report components
    const groupsBreakdown = data?.spendingTree?.map((group: any) => ({
        groupName: group.name,
        totalAmount: group.total,
        percentage: data?.totalExpenses ? (group.total / data.totalExpenses) * 100 : 0,
        yearOverYear: compareMode && data?.comparison ? {
            previousYearAmount: data.comparison.previousPeriod?.byGroup?.[group.name] || 0,
            change: group.total - (data.comparison.previousPeriod?.byGroup?.[group.name] || 0),
            changePercent: data.comparison.previousPeriod?.byGroup?.[group.name]
                ? ((group.total - data.comparison.previousPeriod.byGroup[group.name]) / data.comparison.previousPeriod.byGroup[group.name]) * 100
                : 0,
            previousYearMonthlyAverage: 0
        } : undefined,
        envelopes: group.children?.filter((c: any) => c.type === 'ENVELOPE').map((envelope: any) => ({
            envelopeId: envelope.id,
            envelopeName: envelope.name,
            envelopeIcon: envelope.icon || '📦',
            totalAmount: envelope.total,
            percentage: group.total ? (envelope.total / group.total) * 100 : 0,
            monthlyAverage: envelope.total,
            transactionCount: envelope.transactionCount || 0,
            monthlyTrend: [],
            categories: envelope.children?.filter((c: any) => c.type === 'CATEGORY').map((cat: any) => ({
                categoryId: cat.id,
                categoryName: cat.name,
                categoryIcon: cat.icon || '📌',
                amount: cat.total,
                percentage: envelope.total ? (cat.total / envelope.total) * 100 : 0,
                monthlyTrend: [],
                monthlyAverage: cat.total,
                transactionCount: cat.transactionCount || 0
            })) || []
        })) || []
    })) || []

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
        >
            {/* Period Filters - Premium Style */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl mb-8"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Filter size={20} className="text-indigo-400" />
                        <h3 className="text-lg font-semibold text-white">Wybierz okres</h3>
                    </div>
                    <label className="text-sm font-medium text-slate-400 cursor-pointer flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={compareMode}
                            onChange={(e) => onCompareModeChange(e.target.checked)}
                            disabled={loading}
                            className="w-4 h-4 accent-indigo-500 cursor-pointer rounded"
                        />
                        Porównaj z poprzednim okresem
                    </label>
                </div>

                <div className="flex flex-wrap gap-2">
                    {PREDEFINED_PERIODS.map(p => {
                        const Icon = p.icon
                        const isSelected = selectedPeriod === p.key
                        return (
                            <button
                                key={p.key}
                                onClick={() => handlePeriodSelect(p.key)}
                                disabled={loading}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isSelected
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-600'
                                    } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                                <Icon size={16} />
                                {p.label}
                            </button>
                        )
                    })}
                </div>

                <div className="mt-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Wybrany okres</div>
                    <div className="text-white font-semibold">
                        {formatDate(dateRange.from)} — {formatDate(dateRange.to)}
                        {compareMode && <span className="ml-2 text-indigo-400 text-sm">+ porównanie</span>}
                    </div>
                </div>
            </motion.div>

            {/* Key Metrics - Premium Cards */}
            {data?.mainMetrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <MetricCard
                        label="Przychody"
                        value={data.mainMetrics.currentPeriod?.totalIncome || 0}
                        previousValue={compareMode ? data.mainMetrics.previousPeriod?.totalIncome : undefined}
                        icon="💰"
                        color="emerald"
                    />
                    <MetricCard
                        label="Wydatki"
                        value={data.mainMetrics.currentPeriod?.totalExpenses || 0}
                        previousValue={compareMode ? data.mainMetrics.previousPeriod?.totalExpenses : undefined}
                        icon="💸"
                        color="rose"
                    />
                    <MetricCard
                        label="Bilans"
                        value={(data.mainMetrics.currentPeriod?.totalIncome || 0) - (data.mainMetrics.currentPeriod?.totalExpenses || 0)}
                        previousValue={compareMode ? ((data.mainMetrics.previousPeriod?.totalIncome || 0) - (data.mainMetrics.previousPeriod?.totalExpenses || 0)) : undefined}
                        icon="📊"
                        color="blue"
                    />
                    <MetricCard
                        label="Stopa Oszczędności"
                        value={data.mainMetrics.currentPeriod?.savingsRate || 0}
                        previousValue={compareMode ? data.mainMetrics.previousPeriod?.savingsRate : undefined}
                        icon="%"
                        color="violet"
                        isPercentage
                    />
                </div>
            )}

            {/* Envelope Pie Chart */}
            {groupsBreakdown.length > 0 && (
                <EnvelopePieChart
                    groups={groupsBreakdown}
                    totalExpenses={data?.totalExpenses || 0}
                />
            )}

            {/* Detailed Category Breakdown - like in Annual Reports */}
            {groupsBreakdown.length > 0 && (
                <DetailedCategoryBreakdown
                    groups={groupsBreakdown}
                />
            )}

            {!data && !loading && (
                <div className="text-center py-16">
                    <div className="text-5xl mb-4">📊</div>
                    <p className="text-slate-400">Wybierz okres, aby zobaczyć analizy</p>
                </div>
            )}
        </motion.div>
    )
}

// Premium Metric Card Component with comparison
function MetricCard({
    label,
    value,
    previousValue,
    icon,
    color,
    isPercentage = false
}: {
    label: string
    value: number
    previousValue?: number
    icon: string
    color: 'emerald' | 'rose' | 'blue' | 'violet'
    isPercentage?: boolean
}) {
    const colorClasses = {
        emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400',
        rose: 'from-rose-500/20 to-rose-600/5 border-rose-500/30 text-rose-400',
        blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400',
        violet: 'from-violet-500/20 to-violet-600/5 border-violet-500/30 text-violet-400'
    }

    const change = previousValue !== undefined ? value - previousValue : null
    const changePercent = previousValue && previousValue !== 0 ? (change! / previousValue) * 100 : null

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-2xl border bg-gradient-to-br backdrop-blur-xl ${colorClasses[color]}`}
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">{label}</span>
                <span className="text-2xl">{icon}</span>
            </div>
            <div className={`text-2xl font-bold ${colorClasses[color].split(' ').pop()}`}>
                {isPercentage ? `${value.toFixed(1)}%` : formatMoneyWithSeparators(value)}
            </div>

            {/* Comparison indicator */}
            {change !== null && (
                <div className={`mt-2 text-xs font-medium ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {change >= 0 ? '↗' : '↘'} {change >= 0 && '+'}{isPercentage ? change.toFixed(1) + '%' : formatMoneyWithSeparators(change)}
                    {changePercent !== null && (
                        <span className="text-slate-500 ml-1">({changePercent >= 0 && '+'}{changePercent.toFixed(1)}%)</span>
                    )}
                </div>
            )}
        </motion.div>
    )
}
