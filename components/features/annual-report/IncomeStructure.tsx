'use client'

import { motion } from 'framer-motion'
import { DonutChart } from '@tremor/react'
import { WalletCards } from 'lucide-react'
import { formatMoneyWithSeparators } from '@/lib/utils/money'

interface IncomeBreakdownItem {
    categoryId: string
    categoryName: string
    categoryIcon: string
    amount: number
    percentage: number
}

interface IncomeStructureChartProps {
    data: IncomeBreakdownItem[]
    totalIncome: number
    onSelectSource?: (sourceId: string | null) => void
}

// Distinct palette for income (Greens/Blues/Teals) with Premium feel mapped to Tremor
const TREMOR_COLORS = [
    'emerald', 'blue', 'cyan', 'violet',
    'teal', 'indigo', 'green', 'sky'
]

const CSS_COLORS = [
    '#10b981', '#3b82f6', '#06b6d4', '#8b5cf6',
    '#14b8a6', '#6366f1', '#22c55e', '#0ea5e9',
]

export function IncomeStructureChart({ data, totalIncome, onSelectSource }: IncomeStructureChartProps) {
    const chartData = data
        .filter(item => item.amount > 0)
        .sort((a, b) => b.amount - a.amount)
        .map(item => ({
            name: item.categoryName,
            value: item.amount,
            percentage: item.percentage,
            icon: item.categoryIcon
        }))

    const handleTremorChartClick = (v: any) => {
        if (v && v.name) {
            onSelectSource?.(v.name)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full relative"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <WalletCards size={18} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            Źródła Dochodów
                        </h2>
                        <p className="text-xs text-slate-500">Kliknij segment aby zobaczyć szczegóły</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Suma z grupy</div>
                    <div className="text-xl font-bold text-white">{formatMoneyWithSeparators(totalIncome)}</div>
                </div>
            </div>

            {/* Chart + custom BarList Side by Side (same layout as expenses) */}
            {chartData.length > 0 ? (
                <div className="flex flex-col lg:flex-row items-center gap-8">
                    {/* Chart */}
                    <div className="w-full lg:w-1/2 flex justify-center items-center">
                        <DonutChart
                            data={chartData}
                            category="value"
                            index="name"
                            valueFormatter={(number: number) => formatMoneyWithSeparators(number)}
                            colors={TREMOR_COLORS}
                            variant="donut"
                            className="h-64 sm:h-72 w-full font-medium"
                            showAnimation={true}
                            animationDuration={800}
                            onValueChange={onSelectSource ? handleTremorChartClick : undefined}
                        />
                    </div>

                    {/* Custom BarList Legend */}
                    <div className="w-full lg:w-1/2 flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {chartData.map((entry, index) => {
                            const percentage = totalIncome > 0 ? ((entry.value / totalIncome) * 100) : 0
                            return (
                                <button
                                    key={entry.name}
                                    onClick={() => onSelectSource?.(entry.name)}
                                    disabled={!onSelectSource}
                                    className={`group relative flex items-center justify-between p-3 rounded-xl border border-white/5 bg-slate-900/40 overflow-hidden text-left transition-all ${onSelectSource ? 'hover:bg-slate-800 hover:border-white/10 cursor-pointer active:scale-[0.98]' : 'cursor-default'}`}
                                >
                                    {/* Background Progress Bar */}
                                    <div
                                        className="absolute inset-y-0 left-0 opacity-20 pointer-events-none transition-all duration-1000 ease-out"
                                        style={{
                                            width: `${percentage}%`,
                                            backgroundColor: CSS_COLORS[index % CSS_COLORS.length]
                                        }}
                                    />

                                    {/* Content */}
                                    <div className="flex items-center gap-3 relative z-10 w-full">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                                            style={{ backgroundColor: CSS_COLORS[index % CSS_COLORS.length] }}
                                        />
                                        <div className="flex justify-between w-full items-center gap-4">
                                            <span className="text-sm font-medium text-slate-200 truncate pr-4">
                                                {entry.name}
                                            </span>
                                            <div className="flex gap-4 items-center shrink-0">
                                                <span className="text-sm font-bold text-white tabular-nums tracking-tight">
                                                    {formatMoneyWithSeparators(entry.value)}
                                                </span>
                                                <span className="text-xs text-slate-400 font-medium tabular-nums min-w-[40px] text-right">
                                                    {percentage.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            ) : (
                <div className="text-center py-16 text-slate-400">
                    <WalletCards size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-medium">Brak danych do wyświetlenia dla wybranej grupy</p>
                </div>
            )}
        </motion.div>
    )
}
