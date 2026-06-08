'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { MonthlySummary } from '@/lib/api/annual-report'
import { formatMoneyWithSeparators } from '@/lib/utils/money'
import { INCOME_COLOR, EXPENSE_COLOR, SAVINGS_RATE_COLOR, TOOLTIP_STYLE } from '@/lib/constants/chart-colors'

interface IncomeExpenseChartProps {
    data: MonthlySummary[]
    year: number
}

const MONTHS_PL = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null

    const income = payload.find((p: any) => p.dataKey === 'Dochody')
    const expenses = payload.find((p: any) => p.dataKey === 'Wydatki')
    const balance = income && expenses ? income.value - expenses.value : null

    return (
        <div style={TOOLTIP_STYLE} className="min-w-[200px]">
            <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-3">{label}</p>
            <div className="space-y-2">
                {income && (
                    <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: INCOME_COLOR.solid }} />
                            <span className="text-zinc-300 text-xs">Dochody</span>
                        </div>
                        <span className="text-white font-bold text-sm tabular-nums">
                            {formatMoneyWithSeparators(income.value)} zł
                        </span>
                    </div>
                )}
                {expenses && (
                    <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: EXPENSE_COLOR.solid }} />
                            <span className="text-zinc-300 text-xs">Wydatki</span>
                        </div>
                        <span className="text-white font-bold text-sm tabular-nums">
                            {formatMoneyWithSeparators(expenses.value)} zł
                        </span>
                    </div>
                )}
                {balance !== null && (
                    <div className="pt-2 mt-2 border-t border-zinc-700/50 flex items-center justify-between gap-6">
                        <span className="text-zinc-400 text-xs">Bilans</span>
                        <span className={`font-bold text-sm tabular-nums ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {balance >= 0 ? '+' : ''}{formatMoneyWithSeparators(balance)} zł
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

export function IncomeExpenseChart({ data, year }: IncomeExpenseChartProps) {
    const chartData = useMemo(() =>
        data.map((d, i) => ({
            month: MONTHS_PL[i] ?? d.month.slice(0, 3),
            Dochody: d.income,
            Wydatki: d.expenses,
            savingsRate: d.savingsRate,
        })),
        [data]
    )

    const avgSavingsRate = useMemo(() => {
        const validMonths = chartData.filter(d => d.savingsRate > 0)
        if (!validMonths.length) return null
        return validMonths.reduce((sum, d) => sum + d.savingsRate, 0) / validMonths.length
    }, [chartData])

    const totalIncome = useMemo(() => data.reduce((sum, d) => sum + d.income, 0), [data])
    const totalExpenses = useMemo(() => data.reduce((sum, d) => sum + d.expenses, 0), [data])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full relative"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                        Przepływy Finansowe
                    </h2>
                    <p className="text-zinc-500 text-xs mt-1 font-medium">
                        Zestawienie dochodów i wydatków w roku {year}
                    </p>
                </div>

                {/* Summary chips */}
                <div className="flex gap-3 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: INCOME_COLOR.solid }} />
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Dochody</span>
                        <span className="text-xs text-emerald-300 font-bold tabular-nums">{formatMoneyWithSeparators(totalIncome)} zł</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/8 border border-rose-500/15">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: EXPENSE_COLOR.solid }} />
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Wydatki</span>
                        <span className="text-xs text-rose-300 font-bold tabular-nums">{formatMoneyWithSeparators(totalExpenses)} zł</span>
                    </div>
                    {avgSavingsRate !== null && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-500/8 border border-violet-500/15">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SAVINGS_RATE_COLOR.solid }} />
                            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Śr. oszcz.</span>
                            <span className="text-xs text-violet-300 font-bold tabular-nums">{avgSavingsRate.toFixed(1)}%</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Chart */}
            <div className="h-[340px] sm:h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 4, left: -16, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={INCOME_COLOR.from} stopOpacity={0.25} />
                                <stop offset="95%" stopColor={INCOME_COLOR.to} stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={EXPENSE_COLOR.from} stopOpacity={0.25} />
                                <stop offset="95%" stopColor={EXPENSE_COLOR.to} stopOpacity={0.02} />
                            </linearGradient>
                        </defs>

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
                            content={<CustomTooltip />}
                            cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />

                        <Area
                            type="monotone"
                            dataKey="Dochody"
                            stroke={INCOME_COLOR.solid}
                            strokeWidth={2}
                            fill="url(#incomeGrad)"
                            dot={false}
                            activeDot={{ r: 5, strokeWidth: 0, fill: INCOME_COLOR.solid }}
                            animationDuration={1200}
                            animationEasing="ease-out"
                        />
                        <Area
                            type="monotone"
                            dataKey="Wydatki"
                            stroke={EXPENSE_COLOR.solid}
                            strokeWidth={2}
                            fill="url(#expenseGrad)"
                            dot={false}
                            activeDot={{ r: 5, strokeWidth: 0, fill: EXPENSE_COLOR.solid }}
                            animationDuration={1200}
                            animationEasing="ease-out"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    )
}
