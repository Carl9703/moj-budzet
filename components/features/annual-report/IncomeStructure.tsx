'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { WalletCards, ChevronRight } from 'lucide-react'
import { formatMoneyWithSeparators } from '@/lib/utils/money'
import { CHART_PALETTE, CHART_PALETTE_GLOW, TOOLTIP_STYLE } from '@/lib/constants/chart-colors'

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

export function IncomeStructureChart({ data, totalIncome, onSelectSource }: IncomeStructureChartProps) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null)

    const chartData = data
        .filter(item => item.amount > 0)
        .sort((a, b) => b.amount - a.amount)
        .map(item => ({
            name: item.categoryName,
            value: item.amount,
            percentage: item.percentage,
            icon: item.categoryIcon
        }))

    const handleTremorClick = (v: any) => {
        if (v?.name) onSelectSource?.(v.name)
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full relative"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 shrink-0">
                        <WalletCards size={16} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                            Źródła Dochodów
                        </h2>
                        <p className="text-[11px] text-zinc-500">
                            {onSelectSource ? 'Kliknij segment aby zobaczyć szczegóły' : 'Podział przychodów'}
                        </p>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Łącznie</div>
                    <div className="text-xl font-bold text-white tabular-nums">{formatMoneyWithSeparators(totalIncome)} zł</div>
                </div>
            </div>

            {chartData.length > 0 ? (
                <div className="flex flex-col lg:flex-row items-start gap-6">
                    {/* Donut */}
                    <div className="flex justify-center items-center relative w-full md:w-auto md:shrink-0">
                        <div className="h-56 sm:h-64 w-56 sm:w-64 relative mx-auto">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="72%"
                                        outerRadius="95%"
                                        paddingAngle={2}
                                        dataKey="value"
                                        onClick={onSelectSource ? (entry: any) => handleTremorClick({ name: entry.name }) : undefined}
                                        style={{ cursor: onSelectSource ? 'pointer' : 'default', outline: 'none' }}
                                        animationDuration={700}
                                        animationEasing="ease-out"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={CHART_PALETTE[index % CHART_PALETTE.length]}
                                                stroke="transparent"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => [formatMoneyWithSeparators(value) + ' zł', '']}
                                        contentStyle={TOOLTIP_STYLE}
                                        itemStyle={{ color: '#e4e4e7' }}
                                        labelStyle={{ color: '#71717a', fontSize: '11px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center label */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Razem</div>
                                <div className="text-base font-bold text-white tabular-nums leading-tight">{formatMoneyWithSeparators(totalIncome)}</div>
                                <div className="text-xs text-zinc-500">zł</div>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 flex flex-col gap-1.5 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar w-full">
                        {chartData.map((entry, index) => {
                            const pct = totalIncome > 0 ? (entry.value / totalIncome) * 100 : 0
                            const color = CHART_PALETTE[index % CHART_PALETTE.length]
                            const glow = CHART_PALETTE_GLOW[index % CHART_PALETTE_GLOW.length]
                            const isActive = activeIndex === index

                            return (
                                <button
                                    key={entry.name}
                                    onClick={() => onSelectSource?.(entry.name)}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onMouseLeave={() => setActiveIndex(null)}
                                    disabled={!onSelectSource}
                                    className={`relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 overflow-hidden
                                        ${onSelectSource ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}
                                        ${isActive
                                            ? 'border-white/10 bg-zinc-800/60'
                                            : 'border-white/5 bg-zinc-900/30 hover:bg-zinc-800/40'
                                        }`}
                                    style={isActive ? { boxShadow: `0 0 0 1px ${color}30, 0 4px 16px ${glow}` } : {}}
                                >
                                    {/* Progress bg */}
                                    <div
                                        className="absolute inset-y-0 left-0 pointer-events-none transition-all duration-700 ease-out rounded-l-xl"
                                        style={{ width: `${pct}%`, backgroundColor: color, opacity: isActive ? 0.12 : 0.07 }}
                                    />

                                    {/* Color dot */}
                                    <div
                                        className="w-2.5 h-2.5 rounded-full shrink-0 relative z-10 transition-all"
                                        style={{
                                            backgroundColor: color,
                                            boxShadow: isActive ? `0 0 8px ${color}` : 'none'
                                        }}
                                    />

                                    <div className="flex-1 min-w-0 relative z-10">
                                        <div className="text-sm font-medium text-zinc-200 truncate leading-tight">{entry.name}</div>
                                    </div>

                                    <div className="text-right shrink-0 relative z-10">
                                        <div className="text-sm font-bold text-white tabular-nums">{formatMoneyWithSeparators(entry.value)} zł</div>
                                        <div className="text-[10px] text-zinc-500 tabular-nums">{pct.toFixed(1)}%</div>
                                    </div>

                                    {onSelectSource && (
                                        <ChevronRight size={14} className={`shrink-0 transition-all relative z-10 ${isActive ? 'text-zinc-300' : 'text-zinc-600'}`} />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            ) : (
                <div className="text-center py-14 text-zinc-400">
                    <WalletCards size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="font-medium text-sm">Brak danych do wyświetlenia</p>
                </div>
            )}
        </motion.div>
    )
}
