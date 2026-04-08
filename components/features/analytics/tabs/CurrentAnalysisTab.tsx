'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import type { DateRange } from '@/lib/types'
import { fetchAnalyticsData, fetchIncomeAnalytics } from '@/lib/api/analytics'
import { GlobalFilters } from '@/components/features/analytics/filters/GlobalFilters'
import { KeyMetricsCards } from '@/components/features/annual-report/KeyMetricsCards'
import { DrillDownExpenseChart } from '@/components/features/annual-report/DrillDownExpenseChart'
import { DetailedCategoryBreakdown } from '@/components/features/annual-report/DetailedCategoryBreakdown'
import { IncomeStructureChart } from '@/components/features/annual-report/IncomeStructure'
import { DetailedIncomeBreakdown } from '@/components/features/annual-report/DetailedIncomeBreakdown'
import { getPreviousDateRange } from '@/lib/utils/analytics-helpers'
import { useCurrentAnalysisData } from '@/lib/hooks/useCurrentAnalysisData'
import { EmptyState } from '@/components/ui/EmptyState'
import { MainBalanceSkeleton, ChartSkeleton } from '@/components/ui/SkeletonLoader'

interface CurrentAnalysisTabProps {
    data: any
    incomeData: any
    loading: boolean
    dateRange: DateRange
    compareMode: boolean
    period?: string
    onDateRangeChange: (range: DateRange, period?: string) => void
    onCompareModeChange: (enabled: boolean) => void
}

export function CurrentAnalysisTab({
    data,
    incomeData,
    loading,
    dateRange,
    compareMode,
    period,
    onDateRangeChange,
    onCompareModeChange
}: CurrentAnalysisTabProps) {
    const [activeSubTab, setActiveSubTab] = useState<'expenses' | 'income'>('expenses')
    const [selectedEnvelopeId, setSelectedEnvelopeId] = useState<string | null>(null)
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

    // Comparison Data Logic
    const previousRange = useMemo(() => getPreviousDateRange(dateRange), [dateRange])

    const { data: previousData } = useQuery({
        queryKey: ['analytics', previousRange.from?.toISOString(), previousRange.to?.toISOString(), false],
        queryFn: () => fetchAnalyticsData(previousRange, false),
        enabled: compareMode && !!previousRange.from && !!previousRange.to
    })

    const { data: previousIncomeData } = useQuery({
        queryKey: ['analytics-income', previousRange.from?.toISOString(), previousRange.to?.toISOString()],
        queryFn: () => fetchIncomeAnalytics(previousRange),
        enabled: compareMode && !!previousRange.from && !!previousRange.to
    })

    // Calculate actual months count in the selected range
    const monthsInPeriod = useMemo(() => {
        if (!dateRange.from || !dateRange.to) return 12 // Default to year
        const start = new Date(dateRange.from)
        const end = new Date(dateRange.to)
        // Calculate difference in months (inclusive of start month)
        return Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1)
    }, [dateRange])

    // Use external hook for data transformation
    const {
        summary,
        previousSummary,
        groupsBreakdown,
        incomeSourcesMapped,
        previousIncomeSourcesMapped
    } = useCurrentAnalysisData({
        data,
        incomeData,
        compareMode,
        previousIncomeData,
        monthsInPeriod
    })

    return (
        <div className="flex flex-col gap-4">
            {/* Filters Row (Full Width - No Container) */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
            >
                <GlobalFilters
                    dateRange={dateRange}
                    compareMode={compareMode}
                    period={period}
                    onDateRangeChange={onDateRangeChange}
                    onCompareModeChange={onCompareModeChange}
                    loading={loading}
                />
            </motion.div>

            {loading && !data && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col gap-6 w-full animate-in fade-in duration-500 mt-2"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MainBalanceSkeleton />
                        <MainBalanceSkeleton />
                        <MainBalanceSkeleton />
                        <MainBalanceSkeleton />
                    </div>
                    <div className="h-[450px]">
                        <ChartSkeleton />
                    </div>
                </motion.div>
            )}

            {!loading && !data && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-6"
                >
                    <EmptyState
                        icon="📭"
                        title="Brak danych dla tego okresu"
                        description="Zmień wybrany zakres dat, aby wygenerować analizę wydatków i wpływów z innego przedziału czasowego."
                    />
                </motion.div>
            )}

            {/* Content when data is present */}
            {data && (
                <>
                    {/* Key Metrics - Income/Expenses are clickable */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        {summary && (
                            <KeyMetricsCards
                                summary={summary}
                                previousYearSummary={previousSummary}
                                activeTab={activeSubTab}
                                onTabChange={setActiveSubTab}
                            />
                        )}
                    </motion.div>

                    {/* Bottom Section: Charts and Detailed Data */}
                    <AnimatePresence mode="wait">
                        {activeSubTab === 'expenses' ? (
                            <motion.div
                                key="expenses-tab"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col gap-6"
                            >
                                {/* Drill-Down Expense Chart (Large Bento Item) */}
                                {groupsBreakdown.length > 0 && (
                                    <DrillDownExpenseChart
                                        groups={groupsBreakdown}
                                        totalExpenses={data?.totalExpenses || 0}
                                        compareMode={compareMode}
                                        onSelectEnvelope={(id) => {
                                            setSelectedEnvelopeId(id)
                                            setSelectedCategoryId(null)
                                        }}
                                        onSelectCategory={(id) => {
                                            setSelectedCategoryId(id)
                                        }}
                                    />
                                )}

                                {/* Detailed Category Breakdown (Large Bento Item) */}
                                {groupsBreakdown.length > 0 && (
                                    <DetailedCategoryBreakdown
                                        groups={groupsBreakdown}
                                        externalEnvelopeId={selectedEnvelopeId}
                                        externalCategoryId={selectedCategoryId}
                                        onEnvelopeChange={setSelectedEnvelopeId}
                                        onCategoryChange={setSelectedCategoryId}
                                        compareMode={compareMode}
                                        previousTrends={previousData?.trends}
                                        monthsCount={monthsInPeriod}
                                    />
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="income-tab"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col gap-6"
                            >
                                {/* Income Analysis Section - Same layout as Expenses */}
                                {incomeData && (
                                    <>
                                        {/* Income Structure Chart (Full Width - matches DrillDownExpenseChart) */}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="p-6 rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-xl"
                                        >
                                            <IncomeStructureChart
                                                data={(incomeData.sources || []).map((s: any) => ({
                                                    categoryId: s.source,
                                                    categoryName: s.source,
                                                    categoryIcon: '💰',
                                                    amount: s.total,
                                                    percentage: (s.total / incomeData.totalIncome) * 100
                                                }))}
                                                totalIncome={incomeData.totalIncome}
                                            />
                                        </motion.div>

                                        {/* Detailed Income Breakdown */}
                                        <div className="p-6 rounded-3xl bg-zinc-900/50 backdrop-blur-xl border border-white/5">
                                            <DetailedIncomeBreakdown
                                                sources={incomeSourcesMapped}
                                                trends={incomeData.trends}
                                                compareMode={compareMode}
                                                previousSources={previousIncomeSourcesMapped}
                                            />
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer Summary Info (Bento Style) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-6 p-6 rounded-3xl bg-zinc-900/50 backdrop-blur-xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6"
                    >
                        <div className="flex gap-12">
                            <div className="text-center md:text-left">
                                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">
                                    {activeSubTab === 'expenses' ? 'Kategorie' : 'Źródła Przychodów'}
                                </div>
                                <div className="text-2xl font-black text-white tracking-tight">
                                    {activeSubTab === 'expenses'
                                        ? (data?.summary?.totalCategories || 0)
                                        : (incomeData?.summary?.totalSources || 0)}
                                </div>
                            </div>
                            <div className="text-center md:text-left">
                                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Liczba Operacji</div>
                                <div className="text-2xl font-black text-white tracking-tight">
                                    {activeSubTab === 'expenses'
                                        ? (data?.summary?.totalTransactions || 0)
                                        : (incomeData?.summary?.totalTransactions || 0)}
                                </div>
                            </div>
                        </div>
                        <div className="text-[10px] text-zinc-600 font-mono italic">
                            Analiza wygenerowana automatycznie na podstawie aktualnych danych
                        </div>
                    </motion.div>
                </>
            )}
        </div>
    )
}
