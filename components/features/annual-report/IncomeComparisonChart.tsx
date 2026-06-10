'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts'
import { MonthlySummary } from '@/lib/api/annual-report'
import { formatMoneyWithSeparators } from '@/lib/utils/money'
import { INCOME_COLOR, TOOLTIP_STYLE } from '@/lib/constants/chart-colors'

interface IncomeComparisonChartProps {
    currentYearData: MonthlySummary[]
    previousYearData?: MonthlySummary[]
    currentYear: number
    previousYear: number
}

const MONTHS_PL = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']

const PREV_COLOR = '#2dd4bf'   // teal-400 — poprzedni rok
const CURR_COLOR = '#34d399'   // emerald-400 — bieżący rok

const CustomTooltip = ({ active, payload, label, currentYear, previousYear }: any) => {
    if (!active || !payload || !payload.length) return null

    const prev = payload.find((p: any) => p.dataKey === 'prev')
    const curr = payload.find((p: any) => p.dataKey === 'curr')
    const delta = curr && prev ? curr.value - prev.value : null

    return (
        <div style={TOOLTIP_STYLE} className="min-w-[200px]">
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-3">{label}</p>
            <div className="space-y-2">
                {prev && (
                    <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PREV_COLOR }} />
                            <span className="text-zinc-400 text-xs">{previousYear}</span>
                        </div>
                        <span className="text-white font-bold text-sm tabular-nums">
                            {formatMoneyWithSeparators(prev.value)} zł
                        </span>
                    </div>
                )}
                {curr && (
                    <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CURR_COLOR }} />
                            <span className="text-zinc-300 text-xs font-semibold">{currentYear}</span>
                        </div>
                        <span className="text-white font-bold text-sm tabular-nums">
                            {formatMoneyWithSeparators(curr.value)} zł
                        </span>
                    </div>
                )}
                {delta !== null && (
                    <div className="pt-2 mt-2 border-t border-zinc-700/50 flex items-center justify-between gap-6">
                        <span className="text-zinc-400 text-xs">Zmiana</span>
                        <span className={`font-bold text-sm tabular-nums ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {delta > 0 ? '+' : ''}{formatMoneyWithSeparators(delta)} zł
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

export function IncomeComparisonChart({
    currentYearData,
    previousYearData,
    currentYear,
    previousYear
}: IncomeComparisonChartProps) {
    const chartData = useMemo(() =>
        currentYearData.map((current, index) => ({
            month: MONTHS_PL[index] ?? current.month.slice(0, 3),
            curr: current.income,
            prev: previousYearData?.[index]?.income ?? 0,
        })),
        [currentYearData, previousYearData]
    )

    const totalCurr = useMemo(() => currentYearData.reduce((s, d) => s + d.income, 0), [currentYearData])
    const totalPrev = useMemo(() => previousYearData?.reduce((s, d) => s + d.income, 0) ?? 0, [previousYearData])
    const totalDelta = totalCurr - totalPrev

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full relative"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
                <div>
                    <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                        Porównanie Dochodów
                    </h2>
                    <p className="text-zinc-500 text-xs mt-0.5 font-medium">{previousYear} vs {currentYear}</p>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border self-start
                    ${totalDelta >= 0
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}>
                    {totalDelta > 0 ? '+' : ''}{formatMoneyWithSeparators(totalDelta)} zł
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PREV_COLOR }} />
                    <span className="text-xs text-zinc-400">{previousYear}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: CURR_COLOR }} />
                    <span className="text-xs text-zinc-400">{currentYear}</span>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[300px] sm:h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                        barGap={2}
                        barCategoryGap="30%"
                    >
                        <CartesianGrid
                            strokeDasharray="1 5"
                            stroke="rgba(82, 82, 91, 0.35)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="month"
                            tick={{ fill: '#71717a', fontSize: 11, fontWeight: 500 }}
                            tickLine={false}
                            axisLine={false}
                            dy={8}
                        />
                        <YAxis
                            tick={{ fill: '#71717a', fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                            width={40}
                        />
                        <Tooltip
                            content={<CustomTooltip currentYear={currentYear} previousYear={previousYear} />}
                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                        />
                        <Bar dataKey="prev" radius={[4, 4, 0, 0]} maxBarSize={24} fill={PREV_COLOR} opacity={0.7} animationDuration={1000} />
                        <Bar dataKey="curr" radius={[4, 4, 0, 0]} maxBarSize={24} fill={CURR_COLOR} animationDuration={1000} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    )
}
