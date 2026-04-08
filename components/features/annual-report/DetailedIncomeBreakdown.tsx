'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, WalletCards, List, BarChart3, TrendingUp, TrendingDown, CheckCircle2, RotateCcw } from 'lucide-react'
import {
    ComposedChart,
    Bar,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
    CartesianGrid,
    Cell,
    Line
} from 'recharts'

interface IncomeSourceItem {
    source: string
    total: number
    count: number
    percentage: number
    transactions: {
        id: string
        amount: number
        description: string
        date: string
    }[]
    monthlyTrend?: { month: string; amount: number }[] // Pre-calculated trend
}

interface DetailedIncomeBreakdownProps {
    sources: IncomeSourceItem[]
    trends: any[] // Kept for prop compatibility but unused for now
    externalSourceId?: string | null
    onSourceChange?: (id: string | null) => void
    compareMode?: boolean
    previousSources?: { source: string; monthlyTrend: { month: string; amount: number }[] }[]
}

export function DetailedIncomeBreakdown({
    sources,
    trends,
    externalSourceId,
    onSourceChange,
    compareMode = false,
    previousSources
}: DetailedIncomeBreakdownProps) {
    const [selectedSource, setSelectedSource] = useState<string | null>(null)
    const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null)
    const [activeTab, setActiveTab] = useState<'chart' | 'transactions'>('chart')

    // Sync from external props
    useEffect(() => {
        if (externalSourceId !== undefined && externalSourceId !== null && externalSourceId !== selectedSource) {
            setSelectedSource(externalSourceId)
            setSelectedMonthIndex(null)
        }
    }, [externalSourceId])

    const toggleSource = (sourceName: string, e?: React.MouseEvent) => {
        e?.stopPropagation()
        const newSource = selectedSource === sourceName ? null : sourceName
        setSelectedSource(newSource)
        onSourceChange?.(newSource)
        setSelectedMonthIndex(null) // Reset month filter on toggle
        // Reset tab to chart when opening
        if (newSource) {
            setActiveTab('chart')
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-xl"
        >
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                    <span>💰</span>
                    <span>Szczegółowa Analiza Przychodów</span>
                </h2>
            </div>
            <p className="text-sm text-zinc-400 mb-6">
                Wybierz źródło przychodu, aby przeanalizować trendy i historię transakcji.
            </p>

            <div className="space-y-4">
                {sources.length === 0 ? (
                    <div className="p-8 text-center bg-zinc-800/20 rounded-2xl border border-zinc-700/50">
                        <p className="text-zinc-500">Brak danych o przychodach w tym okresie</p>
                    </div>
                ) : (
                    [...sources].sort((a, b) => (b.total || 0) - (a.total || 0)).map((source, index) => {
                        const isSelected = selectedSource === source.source

                        // Chart Data Preparation - filter out months with 0 income
                        const chartData = source.monthlyTrend || []

                        // Find previous trend for this source
                        const previousSourceTrend = previousSources?.find(s => s.source === source.source)?.monthlyTrend || []

                        // Only include months with data
                        const formattedChartData = chartData
                            .map((d, i) => ({
                                ...d,
                                previousAmount: previousSourceTrend[i]?.amount || 0
                            }))
                            .filter(d => d.amount > 0 || d.previousAmount > 0)

                        return (
                            <div
                                key={source.source || `source-${index}`}
                                className={`rounded-lg border transition-all duration-300 overflow-hidden ${isSelected ? 'border-emerald-500/30 bg-emerald-500/5 shadow-lg' : 'border-zinc-700/30 bg-zinc-800/40 hover:bg-zinc-700/30'}`}
                            >
                                <button
                                    onClick={(e) => toggleSource(source.source, e)}
                                    className="w-full p-4 flex items-center justify-between transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl transition-colors ${isSelected ? 'bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-400'}`}>
                                            <WalletCards size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className={`font-semibold text-lg transition-colors ${isSelected ? 'text-emerald-200' : 'text-zinc-200'}`}>
                                                {source.source}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                <span>{source.count} transakcji</span>
                                                <span>•</span>
                                                <span className="text-zinc-400">{(source.percentage || 0).toFixed(1)}% całości</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-bold text-zinc-200 text-lg">{(source.total || 0).toFixed(2)} zł</p>
                                            <div className="flex items-center justify-end gap-1.5">
                                            </div>
                                        </div>
                                        {isSelected ? (
                                            <ChevronUp className="text-zinc-500" size={20} />
                                        ) : (
                                            <ChevronDown className="text-zinc-500" size={20} />
                                        )}
                                    </div>
                                </button>

                                {/* Expanded Details Area */}
                                <AnimatePresence>
                                    {isSelected && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-4 border-t border-emerald-500/20">
                                                <div className="bg-zinc-900/40 rounded-xl p-5 border border-zinc-700/50 flex flex-col min-h-[400px]">
                                                    {/* Header with Tabs */}
                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-4 border-b border-zinc-700/50">
                                                        <div className="flex-1">
                                                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Analizowany zakres</p>
                                                            <h4 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                                                                {source.source}
                                                            </h4>
                                                        </div>

                                                        <div className="flex bg-zinc-800/80 p-1 rounded-lg border border-zinc-700/50 self-start sm:self-auto">
                                                            <button
                                                                onClick={() => setActiveTab('chart')}
                                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'chart' ? 'bg-emerald-500 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}`}
                                                            >
                                                                <BarChart3 size={14} />
                                                                Trend
                                                            </button>
                                                            <button
                                                                onClick={() => setActiveTab('transactions')}
                                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'transactions' ? 'bg-emerald-500 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}`}
                                                            >
                                                                <List size={14} />
                                                                Transakcje
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Content Area */}
                                                    <div className="flex-1 relative">
                                                        {activeTab === 'chart' ? (
                                                            <div className="h-[300px] w-full">
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                    <ComposedChart data={formattedChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                                                                        <XAxis
                                                                            dataKey="month"
                                                                            axisLine={false}
                                                                            tickLine={false}
                                                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                                            tickMargin={10}
                                                                            tickFormatter={(val) => val.slice(0, 3)}
                                                                        />
                                                                        <YAxis
                                                                            axisLine={false}
                                                                            tickLine={false}
                                                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                                            tickFormatter={(val) => `${val / 1000}k`}
                                                                        />
                                                                        <Tooltip
                                                                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(51, 65, 85, 0.5)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                                            itemStyle={{ color: '#e2e8f0' }}
                                                                            formatter={(value: number, name: string) => [
                                                                                `${value.toFixed(2)} zł`,
                                                                                name === 'amount' ? 'Przychód' : (name === 'previousAmount' ? 'Poprzedni okres' : name)
                                                                            ]}
                                                                        />
                                                                        <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                                                            {formattedChartData.map((entry, index) => (
                                                                                <Cell key={`cell-${index}`} fill="url(#colorIncomeGradient)" />
                                                                            ))}
                                                                        </Bar>
                                                                        <defs>
                                                                            <linearGradient id="colorIncomeGradient" x1="0" y1="0" x2="0" y2="1">
                                                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.3} />
                                                                            </linearGradient>
                                                                        </defs>
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
                                                        ) : (
                                                            <motion.div
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                className="space-y-2 h-[300px] overflow-y-auto pr-2 custom-scrollbar"
                                                            >
                                                                {source.transactions.length > 0 ? (
                                                                    source.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((trx, tIndex) => (
                                                                        <div key={trx.id || `trx-${index}-${tIndex}`} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30 hover:bg-zinc-800/60 transition-colors">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-400">
                                                                                    <WalletCards size={16} />
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-sm font-medium text-zinc-200">{trx.description || 'Przychód'}</p>
                                                                                    <p className="text-xs text-zinc-500">{new Date(trx.date).toLocaleDateString()}</p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="font-bold text-emerald-400">
                                                                                +{Number(trx.amount).toFixed(2)} zł
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                                                                        <List size={48} className="mb-2 opacity-20" />
                                                                        <p>Brak transakcji do wyświetlenia</p>
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )
                    })
                )}
            </div>
        </motion.div>
    )
}
