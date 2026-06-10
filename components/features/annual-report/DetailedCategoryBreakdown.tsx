'use client'
// Force rebuild

import { useState, useEffect, useMemo } from 'react' // Added useEffect
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Layers, CheckCircle2, RotateCcw, TrendingUp, TrendingDown, List, BarChart3 } from 'lucide-react'
import { GroupBreakdown } from '@/lib/api/annual-report'
import { TrendsData } from '@/lib/api/analytics'
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
    CartesianGrid,
    ReferenceLine,
    Cell
} from 'recharts'

interface DetailedCategoryBreakdownProps {
    groups: GroupBreakdown[]
    showTransactions?: boolean
    externalEnvelopeId?: string | null
    externalCategoryId?: string | null
    onEnvelopeChange?: (id: string | null) => void
    onCategoryChange?: (id: string | null) => void
    compareMode?: boolean
    previousTrends?: TrendsData
    monthsCount?: number
}

export function DetailedCategoryBreakdown({
    groups,
    showTransactions = true,
    externalEnvelopeId,
    externalCategoryId,
    onEnvelopeChange,
    onCategoryChange,
    compareMode = false,
    previousTrends,
    monthsCount = 12
}: DetailedCategoryBreakdownProps) {
    // Sort groups and envelopes by amount descending
    const sortedGroups = useMemo(() => {
        return [...groups]
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .map(group => ({
                ...group,
                envelopes: [...group.envelopes].sort((a, b) => b.totalAmount - a.totalAmount)
            }))
    }, [groups])


    const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
    const [expandedGroupChart, setExpandedGroupChart] = useState<string | null>(null)
    const [selectedEnvelopeId, setSelectedEnvelopeId] = useState<string | null>(null) // Always start collapsed
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'chart' | 'transactions'>('chart')

    // Sync from external props
    useEffect(() => {
        if (externalEnvelopeId !== undefined && externalEnvelopeId !== null && externalEnvelopeId !== selectedEnvelopeId) {
            setSelectedEnvelopeId(externalEnvelopeId)
            // Also expand the group if an external envelope is selected
            const groupOfExternalEnvelope = sortedGroups.find(g => g.envelopes.some(e => e.envelopeId === externalEnvelopeId))
            if (groupOfExternalEnvelope && expandedGroup !== groupOfExternalEnvelope.groupName) {
                setExpandedGroup(groupOfExternalEnvelope.groupName)
            }
        }
    }, [externalEnvelopeId, sortedGroups]) // Removed selectedEnvelopeId and expandedGroup from deps to avoid loop

    useEffect(() => {
        if (externalCategoryId !== undefined && externalCategoryId !== null && externalCategoryId !== selectedCategoryId) {
            setSelectedCategoryId(externalCategoryId)
            if (externalCategoryId) {
                setActiveTab('transactions') // Auto-switch to transactions when specifically selecting a category
            }
        }
    }, [externalCategoryId]) // Removed selectedCategoryId from deps to avoid loop

    const toggleGroup = (groupName: string) => {
        const newGroup = expandedGroup === groupName ? null : groupName
        setExpandedGroup(newGroup)

        // Notify parent if we are clearing selection
        if (newGroup === null) {
            setSelectedEnvelopeId(null)
            setSelectedCategoryId(null)
            onEnvelopeChange?.(null)
            onCategoryChange?.(null)
        }
    }

    const toggleEnvelope = (envelopeId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const newEnvelopeId = selectedEnvelopeId === envelopeId ? null : envelopeId
        setSelectedEnvelopeId(newEnvelopeId)
        setSelectedCategoryId(null)

        // Notify parent directly on action
        onEnvelopeChange?.(newEnvelopeId)
        onCategoryChange?.(null)
    }

    const selectCategory = (categoryId: string) => {
        const newCategoryId = selectedCategoryId === categoryId ? null : categoryId
        setSelectedCategoryId(newCategoryId)

        // Notify parent directly on action
        onCategoryChange?.(newCategoryId)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-xl"
        >
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                    <span>📊</span>
                    <span>Szczegółowa Analiza Wydatków</span>
                </h2>
            </div>
            <p className="text-sm text-zinc-400 mb-6">
                Wybierz grupę i kopertę, aby przeanalizować trendy i odchylenia od średniej.
            </p>

            <div className="space-y-4">
                {sortedGroups.map((group) => (
                    <div
                        key={group.groupName}
                        className="border border-zinc-700/50 rounded-xl overflow-hidden bg-zinc-800/20"
                    >
                        {/* Group Header */}
                        <button
                            onClick={() => toggleGroup(group.groupName)}
                            className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-800/30 transition-colors bg-gradient-to-r from-zinc-800/50 to-transparent"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
                                    <Layers size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-zinc-100">
                                        {group.groupName}
                                    </h3>
                                    <p className="text-sm text-zinc-400">
                                        {group.envelopes.length} kopert
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-lg font-bold text-zinc-100">
                                        {group.totalAmount.toFixed(2)} zł
                                    </p>
                                    <div className="flex items-center justify-end gap-2">
                                        {group.yearOverYear && (
                                            <div className="flex flex-col items-end">
                                                <div className={`text-xs font-medium flex items-center ${group.yearOverYear.change > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                    {group.yearOverYear.change > 0 ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                                                    {group.yearOverYear.changePercent > 0 ? '+' : ''}{group.yearOverYear.changePercent.toFixed(1)}%
                                                </div>
                                                <span className="text-xs text-zinc-500">
                                                    (Poprz: {group.yearOverYear.previousYearAmount.toFixed(0)} zł)
                                                </span>
                                            </div>
                                        )}
                                        <p className="text-sm text-amber-400 font-medium">
                                            {group.percentage.toFixed(1)}% całości
                                        </p>
                                    </div>
                                </div>
                                {expandedGroup === group.groupName ? (
                                    <ChevronUp className="text-zinc-400" size={20} />
                                ) : (
                                    <ChevronDown className="text-zinc-400" size={20} />
                                )}
                            </div>
                        </button>

                        {/* Expanded Group Content */}
                        <AnimatePresence>
                            {expandedGroup === group.groupName && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    className="overflow-hidden"
                                >
                                    {/* Group-Level Chart (Collapsible) */}
                                    {(() => {
                                        // Aggregate monthly data from all envelopes in this group
                                        const groupMonthlyMap = new Map<string, number>()
                                        let groupTrendYear: number | undefined = undefined;
                                        group.envelopes.forEach(env => {
                                            env.monthlyTrend.forEach((m: any) => {
                                                const current = groupMonthlyMap.get(m.month) || 0
                                                groupMonthlyMap.set(m.month, current + m.amount)
                                                if (m.year) groupTrendYear = m.year;
                                            })
                                        })

                                        const groupTrendData = Array.from(groupMonthlyMap.entries())
                                            .map(([month, amount]) => ({ month, amount, displayMonth: month.slice(0, 3) }))

                                        let groupTrendDivisor = 12;
                                        if (groupTrendYear === new Date().getFullYear()) {
                                            groupTrendDivisor = Math.max(1, new Date().getMonth() + 1);
                                        }

                                        const groupAverage = groupTrendData.length > 0
                                            ? groupTrendData.reduce((sum, d) => sum + d.amount, 0) / groupTrendDivisor
                                            : 0

                                        // Filter after calculating average to not show empty months, or keep them?
                                        // Wait, the composed chart handles empty data fine, but we filter them.
                                        const filteredGroupTrendData = groupTrendData.filter(d => d.amount > 0)

                                        if (filteredGroupTrendData.length === 0) return null

                                        const isChartExpanded = expandedGroupChart === group.groupName

                                        return (
                                            <div className="border-b border-zinc-700/30 bg-zinc-900/20">
                                                {/* Collapsible Header */}
                                                <button
                                                    onClick={() => setExpandedGroupChart(isChartExpanded ? null : group.groupName)}
                                                    className="w-full p-3 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <BarChart3 size={16} className="text-amber-400" />
                                                        <div className="text-left">
                                                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                                                Trend całej grupy
                                                            </p>
                                                            <p className="text-sm text-zinc-500">
                                                                Łącznie: <span className="font-bold text-zinc-300">{group.totalAmount.toFixed(0)} zł</span>
                                                                {groupTrendData.length > 1 && (
                                                                    <span className="ml-2">• Śr.: <span className="font-bold text-zinc-300">{groupAverage.toFixed(0)} zł/m-c</span></span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {group.yearOverYear && (
                                                            <div className={`text-xs font-medium flex items-center ${group.yearOverYear.change > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                                {group.yearOverYear.change > 0 ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                                                                {group.yearOverYear.changePercent > 0 ? '+' : ''}{group.yearOverYear.changePercent.toFixed(1)}%
                                                            </div>
                                                        )}
                                                        {isChartExpanded ? (
                                                            <ChevronUp size={16} className="text-zinc-500" />
                                                        ) : (
                                                            <ChevronDown size={16} className="text-zinc-500" />
                                                        )}
                                                    </div>
                                                </button>

                                                {/* Chart Content */}
                                                <AnimatePresence>
                                                    {isChartExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="px-4 pb-4">
                                                                <div className="h-[180px] w-full">
                                                                    <ResponsiveContainer width="100%" height="100%">
                                                                        <ComposedChart data={filteredGroupTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} vertical={false} />
                                                                            <XAxis
                                                                                dataKey="displayMonth"
                                                                                stroke="#64748b"
                                                                                fontSize={10}
                                                                                tickLine={false}
                                                                                axisLine={false}
                                                                                dy={5}
                                                                            />
                                                                            <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} width={35} />
                                                                            <Tooltip
                                                                                cursor={{ fill: 'rgba(51, 65, 85, 0.2)' }}
                                                                                content={({ active, payload }) => {
                                                                                    if (active && payload && payload.length) {
                                                                                        const data = payload[0].payload;
                                                                                        return (
                                                                                            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 shadow-xl">
                                                                                                <p className="text-zinc-400 text-xs mb-1 font-semibold">{data.month}</p>
                                                                                                <span className="text-lg font-bold text-white">{data.amount.toFixed(0)} zł</span>
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                    return null;
                                                                                }}
                                                                            />
                                                                            {filteredGroupTrendData.length > 1 && (
                                                                                <ReferenceLine y={groupAverage} stroke="#fbbf24" strokeDasharray="4 4" opacity={0.5} />
                                                                            )}
                                                                            <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={500}>
                                                                                {filteredGroupTrendData.map((entry, index) => (
                                                                                    <Cell
                                                                                        key={`cell-${index}`}
                                                                                        fill={entry.amount > groupAverage * 1.3 ? '#f59e0b' : '#8b5cf6'}
                                                                                        opacity={0.75}
                                                                                    />
                                                                                ))}
                                                                            </Bar>
                                                                        </ComposedChart>
                                                                    </ResponsiveContainer>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )
                                    })()}

                                    {/* Envelopes List */}
                                    <div className="p-2 space-y-2 bg-zinc-900/30">
                                        {group.envelopes.map((envelope) => {
                                            const isEnvelopeActive = selectedEnvelopeId === envelope.envelopeId

                                            // --- Data Preparation Logic ---
                                            let chartData = envelope.monthlyTrend
                                            let chartTitle = "Cała Koperta"
                                            let chartTotal = envelope.totalAmount
                                            let chartAverage = envelope.monthlyAverage

                                            // Previous year data for comparison
                                            let prevYearTotal = envelope.yearOverYear?.previousYearAmount
                                            let prevYearAverage = envelope.yearOverYear?.previousYearMonthlyAverage

                                            // Find selected category for trend and transactions
                                            const selectedCategory = selectedCategoryId ? envelope.categories.find(c => c.categoryId === selectedCategoryId) : null
                                            let previousTrendData: any[] = []

                                            if (selectedCategory && selectedCategory.monthlyTrend) {
                                                chartData = selectedCategory.monthlyTrend
                                                chartTitle = selectedCategory.categoryName
                                                chartTotal = selectedCategory.amount
                                                // Calculate average based on the actual period length (e.g. 1 if one month selected)
                                                // Default to 12 if not provided, but use dynamic value if passed
                                                // Ensure never dividing by 0
                                                const divisor = Math.max(1, monthsCount)
                                                chartAverage = chartTotal / divisor

                                                // Read YoY data from the selected category
                                                prevYearTotal = selectedCategory.yearOverYear?.previousYearAmount
                                                prevYearAverage = selectedCategory.yearOverYear?.previousYearMonthlyAverage

                                                // Get previous trend for category
                                                if (previousTrends && previousTrends.byCategoryName) {
                                                    const rawPrevTrend = previousTrends.byCategoryName[selectedCategory.categoryName] || []
                                                    // Map generic trend format to match chart structure if needed
                                                    previousTrendData = rawPrevTrend

                                                    if (rawPrevTrend.length > 0) {
                                                        const trendTotal = rawPrevTrend.reduce((sum: number, item: any) => sum + (item.value || 0), 0)
                                                        prevYearTotal = trendTotal
                                                        // Previous Average should ALWAYS be the annual average (benchmark)
                                                        prevYearAverage = trendTotal / 12
                                                    }
                                                }
                                            } else {
                                                // Get previous trend for envelope
                                                if (previousTrends && previousTrends.byEnvelopeName) {
                                                    const rawPrevTrend = previousTrends.byEnvelopeName[envelope.envelopeName] || []
                                                    previousTrendData = rawPrevTrend

                                                    if (rawPrevTrend.length > 0) {
                                                        const trendTotal = rawPrevTrend.reduce((sum: number, item: any) => sum + (item.value || 0), 0)
                                                        prevYearTotal = trendTotal
                                                        // Previous Average should ALWAYS be the annual average (benchmark)
                                                        prevYearAverage = trendTotal / 12
                                                    }
                                                }
                                            }

                                            // Determine colors based on average comparison (in a simple way for now)
                                            // const primaryColor = selectedCategoryId ? "##3b82f6" : "#8b5cf6"

                                            // Calculate actual average for the annual trend
                                            let trendDivisor = 12;
                                            const trendYear = chartData.length > 0 ? (chartData[0] as any).year : undefined;
                                            if (trendYear === new Date().getFullYear()) {
                                                trendDivisor = Math.max(1, new Date().getMonth() + 1);
                                            }
                                            const actualAverage = chartData.reduce((sum, t) => sum + t.amount, 0) / trendDivisor

                                            // Filter out months with no data for display
                                            const monthsWithData = chartData.filter(t => t.amount > 0)

                                            const formattedChartData = monthsWithData.map((t, idx) => {
                                                const diff = t.amount - actualAverage
                                                const monthStr = t.month || 'Mies'

                                                // Match previous year data by month name if possible
                                                const prevItem = previousTrendData.find((p: any) => p.period?.includes(monthStr.slice(0, 3))) || previousTrendData[idx]
                                                const prevVal = prevItem?.value || 0

                                                return {
                                                    ...t,
                                                    displayMonth: monthStr.slice(0, 3),
                                                    average: actualAverage,
                                                    previousAmount: prevVal,
                                                    diff: diff
                                                }
                                            })

                                            return (
                                                <div
                                                    key={envelope.envelopeId}
                                                    className={`rounded-lg border transition-all duration-300 overflow-hidden ${isEnvelopeActive ? 'border-amber-500/30 bg-amber-500/5 shadow-lg' : 'border-zinc-700/30 bg-zinc-800/40 hover:bg-zinc-700/30'}`}
                                                >
                                                    <button
                                                        onClick={(e) => toggleEnvelope(envelope.envelopeId, e)}
                                                        className="w-full p-3 flex items-center justify-between"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xl">{envelope.envelopeIcon}</span>
                                                            <div className="text-left">
                                                                <p className={`font-semibold transition-colors ${isEnvelopeActive ? 'text-amber-200' : 'text-zinc-200'}`}>{envelope.envelopeName}</p>
                                                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                                    {showTransactions && (
                                                                        <>
                                                                            <span>{envelope.transactionCount} transakcji</span>
                                                                            <span>•</span>
                                                                        </>
                                                                    )}
                                                                    <span className="text-zinc-400">Średnia z wybranego okresu: {envelope.monthlyAverage.toFixed(0)} zł/m-c</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-right">
                                                                <p className="font-bold text-zinc-200">{envelope.totalAmount.toFixed(2)} zł</p>
                                                                {envelope.yearOverYear && (
                                                                    <div className="flex items-center justify-end gap-1.5">
                                                                        <span className="text-xs text-zinc-500">
                                                                            {envelope.yearOverYear.previousYearAmount.toFixed(0)} zł
                                                                        </span>
                                                                        <span className={`text-xs font-mono ${envelope.yearOverYear.change > 0 ? 'text-amber-500/80' : 'text-emerald-500/80'}`}>
                                                                            {envelope.yearOverYear.changePercent > 0 ? '+' : ''}{envelope.yearOverYear.changePercent.toFixed(0)}%
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {isEnvelopeActive ? (
                                                                <ChevronUp className="text-zinc-500" size={16} />
                                                            ) : (
                                                                <ChevronDown className="text-zinc-500" size={16} />
                                                            )}
                                                        </div>
                                                    </button>

                                                    {/* Expanded Details Area */}
                                                    <AnimatePresence>
                                                        {isEnvelopeActive && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="p-4 border-t border-amber-500/20">
                                                                    {/* Category Chips - Horizontal */}
                                                                    <div className="mb-4">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                                                                Filtruj wg kategorii
                                                                            </p>
                                                                            {selectedCategoryId && (
                                                                                <button
                                                                                    onClick={() => setSelectedCategoryId(null)}
                                                                                    className="text-xs flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors font-medium"
                                                                                >
                                                                                    <RotateCcw size={12} />
                                                                                    Resetuj
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {/* "All" Chip */}
                                                                            <button
                                                                                onClick={() => setSelectedCategoryId(null)}
                                                                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${selectedCategoryId === null
                                                                                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                                                                    : 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/60 hover:text-zinc-200'
                                                                                    }`}
                                                                            >
                                                                                Cała Koperta
                                                                            </button>

                                                                            {/* Category Chips */}
                                                                            {envelope.categories && envelope.categories.map((cat) => (
                                                                                <button
                                                                                    key={cat.categoryId}
                                                                                    onClick={() => selectCategory(cat.categoryId)}
                                                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${selectedCategoryId === cat.categoryId
                                                                                        ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                                                                                        : 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/60 hover:text-zinc-200'
                                                                                        }`}
                                                                                >
                                                                                    <span>{cat.categoryIcon}</span>
                                                                                    <span>{cat.categoryName}</span>
                                                                                    <span className="opacity-60">({cat.amount.toFixed(0)} zł)</span>
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    {/* Full-width Chart Area */}
                                                                    <div className="bg-zinc-900/40 rounded-xl p-5 border border-zinc-700/50 flex flex-col">
                                                                        {/* Header with Title and Tabs */}
                                                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-4 border-b border-zinc-700/50">
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Analizowany zakres</p>
                                                                                <h4 className="text-xl font-bold text-zinc-100 flex items-center gap-2 truncate">
                                                                                    {chartTitle}
                                                                                </h4>
                                                                            </div>

                                                                            <div className="flex flex-col sm:items-end gap-3 shrink-0">
                                                                                {/* Tab Switcher */}
                                                                                {showTransactions && (
                                                                                    <div className="flex bg-zinc-800/80 p-1 rounded-lg border border-zinc-700/50 self-start sm:self-auto">
                                                                                        <button
                                                                                            onClick={() => setActiveTab('chart')}
                                                                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'chart' ? 'bg-amber-500 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}`}
                                                                                        >
                                                                                            <BarChart3 size={14} />
                                                                                            Trend
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => setActiveTab('transactions')}
                                                                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'transactions' ? 'bg-amber-500 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}`}
                                                                                        >
                                                                                            <List size={14} />
                                                                                            Transakcje
                                                                                        </button>
                                                                                    </div>
                                                                                )}

                                                                                <div className="flex gap-4 sm:gap-6">
                                                                                    {prevYearAverage && (
                                                                                        <div className="text-right hidden sm:block">
                                                                                            <p className="text-xs text-zinc-500 mb-0.5">Śr. poprzednio: {prevYearAverage.toFixed(0)} zł</p>
                                                                                        </div>
                                                                                    )}
                                                                                    <div className="text-right">
                                                                                        <p className="text-xs text-zinc-500 mb-0.5">
                                                                                            {activeTab === 'chart' ? `Śr. roczna (wykres): ${actualAverage.toFixed(0)} zł` : `Śr. w wybranym okresie: ${chartAverage.toFixed(0)} zł`}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Content Area with Animation */}
                                                                        <div className="h-[300px] relative">
                                                                            <AnimatePresence mode="wait">
                                                                                {(!showTransactions || activeTab === 'chart') ? (
                                                                                    <motion.div
                                                                                        key="chart"
                                                                                        initial={{ opacity: 0, x: -10 }}
                                                                                        animate={{ opacity: 1, x: 0 }}
                                                                                        exit={{ opacity: 0, x: -10 }}
                                                                                        className="h-full flex flex-col"
                                                                                    >
                                                                                        <div className="h-[280px] w-full">
                                                                                            <ResponsiveContainer width="100%" height="100%">
                                                                                                <ComposedChart data={formattedChartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                                                                                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} vertical={false} />
                                                                                                    <XAxis
                                                                                                        dataKey="displayMonth"
                                                                                                        stroke="#64748b"
                                                                                                        fontSize={11}
                                                                                                        tickLine={false}
                                                                                                        axisLine={false}
                                                                                                        dy={10}
                                                                                                        interval="preserveStartEnd"
                                                                                                        minTickGap={10}
                                                                                                    />
                                                                                                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} width={30} />
                                                                                                    <Tooltip
                                                                                                        cursor={{ fill: 'rgba(51, 65, 85, 0.2)' }}
                                                                                                        content={({ active, payload }) => {
                                                                                                            if (active && payload && payload.length) {
                                                                                                                const data = payload[0].payload;
                                                                                                                const avg = data.average || actualAverage;
                                                                                                                const isAboveAvg = data.amount > avg;
                                                                                                                const diff = Math.abs(data.amount - avg);
                                                                                                                const showAvgComparison = monthsWithData.length > 1;

                                                                                                                return (
                                                                                                                    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl">
                                                                                                                        <p className="text-zinc-400 text-xs mb-1 font-semibold uppercase">{data.month}</p>
                                                                                                                        <div className="flex items-baseline gap-2 mb-2">
                                                                                                                            <span className="text-xl font-bold text-white">{data.amount.toFixed(2)} zł</span>
                                                                                                                            {compareMode && data.previousAmount > 0 && (
                                                                                                                                <span className="text-xs text-zinc-500">
                                                                                                                                    vs {data.previousAmount.toFixed(2)} zł
                                                                                                                                </span>
                                                                                                                            )}
                                                                                                                        </div>
                                                                                                                        {showAvgComparison && (
                                                                                                                            <div className={`text-xs flex items-center gap-1 ${isAboveAvg ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                                                                                                {isAboveAvg ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                                                                                                <span>{diff.toFixed(0)} zł {isAboveAvg ? 'powyżej' : 'poniżej'} średniej</span>
                                                                                                                            </div>
                                                                                                                        )}
                                                                                                                    </div>
                                                                                                                );
                                                                                                            }
                                                                                                            return null;
                                                                                                        }}
                                                                                                    />
                                                                                                    {monthsWithData.length > 1 && (
                                                                                                        <ReferenceLine y={actualAverage} stroke="#fbbf24" strokeDasharray="4 4" opacity={0.6} />
                                                                                                    )}
                                                                                                    <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={50} minPointSize={2} animationDuration={500}>
                                                                                                        {formattedChartData.map((entry, index) => (
                                                                                                            <Cell
                                                                                                                key={`cell-${index}`}
                                                                                                                fill={monthsWithData.length > 1 && entry.amount > actualAverage * 1.5 ? '#f59e0b' : (selectedCategoryId ? '#3b82f6' : '#8b5cf6')}
                                                                                                                opacity={monthsWithData.length > 1 && entry.amount > actualAverage * 1.5 ? 0.9 : 0.7}
                                                                                                            />
                                                                                                        ))}
                                                                                                    </Bar>
                                                                                                    {compareMode && (
                                                                                                        <Line
                                                                                                            type="monotone"
                                                                                                            dataKey="previousAmount"
                                                                                                            stroke="#94a3b8"
                                                                                                            strokeWidth={2}
                                                                                                            dot={{ r: 3, fill: '#64748b' }}
                                                                                                            strokeDasharray="4 4"
                                                                                                            name="Poprzedni okres"
                                                                                                        />
                                                                                                    )}
                                                                                                </ComposedChart>
                                                                                            </ResponsiveContainer>
                                                                                        </div>
                                                                                        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-zinc-500">
                                                                                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-amber-500/80"></div><span>Skok (&gt;150%)</span></div>
                                                                                            <div className="flex items-center gap-1"><div className="w-2 h-0.5 border-t border-dashed border-amber-400"></div><span>Średnia roczna</span></div>
                                                                                        </div>
                                                                                    </motion.div>
                                                                                ) : (
                                                                                    <motion.div
                                                                                        key="transactions"
                                                                                        initial={{ opacity: 0, x: 10 }}
                                                                                        animate={{ opacity: 1, x: 0 }}
                                                                                        exit={{ opacity: 0, x: 10 }}
                                                                                        className="h-full flex flex-col"
                                                                                    >
                                                                                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                                                                            {(() => {
                                                                                                const trxs = selectedCategory ? selectedCategory.transactions : envelope.transactions;
                                                                                                if (!trxs || trxs.length === 0) {
                                                                                                    return (
                                                                                                        <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-60 py-10">
                                                                                                            <List size={32} className="mb-2" />
                                                                                                            <p className="text-sm">Brak transakcji w tym okresie</p>
                                                                                                        </div>
                                                                                                    )
                                                                                                }
                                                                                                return trxs.map((trx: any) => (
                                                                                                    <div
                                                                                                        key={trx.id}
                                                                                                        className="group flex items-center justify-between p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/30 hover:bg-zinc-800/50 hover:border-zinc-600/50 transition-all duration-200"
                                                                                                    >
                                                                                                        <div className="flex flex-col gap-0.5 min-w-0">
                                                                                                            <div className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
                                                                                                                {trx.description}
                                                                                                            </div>
                                                                                                            <div className="text-xs text-zinc-500 font-mono">
                                                                                                                {new Date(trx.date).toLocaleDateString('pl-PL')}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        <div className="text-sm font-bold text-zinc-100 font-mono ml-4">
                                                                                                            {(trx.amount || 0).toFixed(2)} zł
                                                                                                        </div>
                                                                                                    </div>
                                                                                                ))
                                                                                            })()}
                                                                                        </div>
                                                                                    </motion.div>
                                                                                )}
                                                                            </AnimatePresence>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </motion.div>
    )
}
