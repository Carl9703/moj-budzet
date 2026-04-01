'use client'

import { motion } from 'framer-motion'
import { KeyMetricsCards } from '@/components/features/annual-report/KeyMetricsCards'
import { IncomeExpenseChart } from '@/components/features/annual-report/IncomeExpenseChart'
import { IncomeStructureChart } from '@/components/features/annual-report/IncomeStructure'
import { YearComparisonChart } from '@/components/features/annual-report/YearComparisonChart'
import { IncomeComparisonChart } from '@/components/features/annual-report/IncomeComparisonChart'
import { DetailedCategoryBreakdown } from '@/components/features/annual-report/DetailedCategoryBreakdown'
import { MainBalanceSkeleton, ChartSkeleton } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'

interface YearlyAnalysisTabProps {
    data: any
    previousYearData: any
    loading?: boolean
    selectedYear: number
    availableYears: number[]
    onYearChange: (year: number) => void
}

export function YearlyAnalysisTab({
    data,
    previousYearData,
    loading,
    selectedYear,
    availableYears,
    onYearChange
}: YearlyAnalysisTabProps) {

    // Helper rendering top row (reusable for loading state)
    const renderTopRow = () => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">📅</span> Raport Roczny {selectedYear}
                </h2>
                <p className="text-xs text-slate-500 font-medium tracking-wide mt-1">
                    Kompleksowa analiza finansów za rok {selectedYear}
                </p>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Wybierz rok</span>
                <select
                    value={selectedYear}
                    onChange={(e) => onYearChange(Number(e.target.value))}
                    className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer hover:bg-slate-700/50 transition-all"
                >
                    {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>
        </motion.div>
    )

    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                {renderTopRow()}
                <MainBalanceSkeleton />
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <div className="xl:col-span-8 h-full">
                        <ChartSkeleton />
                    </div>
                    <div className="xl:col-span-4 h-full">
                        <ChartSkeleton />
                    </div>
                </div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="flex flex-col gap-6">
                {renderTopRow()}
                <EmptyState
                    icon="📂"
                    title="Brak danych dla wybranego roku"
                    description={`Zmień kryteria wyszukiwania lub wróć w innej chwili. System nie znalazł transakcji dla ${selectedYear}.`}
                />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Top Row: Title & Year Selector (Bento) */}
            {renderTopRow()}


            {/* Key Metrics Cards */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <KeyMetricsCards
                    summary={data.summary}
                    previousYearSummary={data.previousYearSummary}
                />
            </motion.div>

            {/* Main Content Area: Charts Grid (Bento) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Income vs Expenses Chart (Large Bento) */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="xl:col-span-8 p-6 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-white/5 h-full"
                >
                    <IncomeExpenseChart
                        data={data.monthlyData}
                        year={selectedYear}
                    />
                </motion.div>

                {/* Income Structure Chart (Bento Sidebar) */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="xl:col-span-4 p-6 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-white/5 h-full"
                >
                    <IncomeStructureChart
                        data={data.incomeBreakdown}
                        totalIncome={data.summary.income}
                    />
                </motion.div>

                {/* Year Comparison Charts (Optional Row) */}
                {previousYearData && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="xl:col-span-6 p-6 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-white/5"
                        >
                            <IncomeComparisonChart
                                currentYearData={data.monthlyData}
                                previousYearData={previousYearData.monthlyData}
                                currentYear={selectedYear}
                                previousYear={selectedYear - 1}
                            />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="xl:col-span-6 p-6 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-white/5"
                        >
                            <YearComparisonChart
                                currentYearData={data.monthlyData}
                                previousYearData={previousYearData.monthlyData}
                                currentYear={selectedYear}
                                previousYear={selectedYear - 1}
                            />
                        </motion.div>
                    </>
                )}

                {/* Detailed Budget Breakdown (Full Width Bento) */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="xl:col-span-12"
                >
                    <DetailedCategoryBreakdown
                        groups={data.groupsBreakdown || []}
                        showTransactions={false}
                    />
                </motion.div>
            </div>

            {/* Footer Stats (Simple Bento Footer) */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="p-6 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-white/5 flex justify-between items-center"
            >
                <div className="flex gap-4 items-center">
                    <span className="text-2xl">📊</span>
                    <p className="text-sm text-slate-400">
                        Raport wygenerowany na podstawie <span className="text-white font-bold">{data.summary?.totalTransactions || 0}</span> transakcji
                    </p>
                </div>
                <div className="text-[10px] text-slate-600 font-mono tracking-tighter uppercase italic">
                    Final Annual Report {selectedYear} {'//'} Verified
                </div>
            </motion.div>
        </div>
    )
}
