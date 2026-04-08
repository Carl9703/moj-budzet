'use client'

import { motion } from 'framer-motion'
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area } from 'recharts'
import { MonthlySummary } from '@/lib/api/annual-report'
import { ArrowUpRight } from 'lucide-react'

interface IncomeExpenseChartProps {
    data: MonthlySummary[]
    year: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-zinc-900/90 border border-zinc-700/50 p-4 rounded-xl shadow-2xl backdrop-blur-md">
                <p className="text-zinc-400 text-xs font-semibold uppercase mb-2 tracking-wider">{label}</p>
                <div className="space-y-2">
                    {payload.map((entry: any) => (
                        <div key={entry.name} className="flex items-center gap-3 min-w-[140px]">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-zinc-300 text-sm flex-1">{entry.name}</span>
                            <span className="text-white font-bold font-mono">
                                {entry.name === 'Stopa Oszczędności'
                                    ? `${entry.value.toFixed(1)}%`
                                    : `${(entry.value / 1).toFixed(0)} zł`}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
    return null
}

export function IncomeExpenseChart({ data, year }: IncomeExpenseChartProps) {
    const chartData = data.map(d => ({
        month: d.month.slice(0, 3), // Skróć nazwy miesięcy
        Dochody: d.income,
        Wydatki: d.expenses,
        // Oszczędności: d.savings, // savings removed from bar to clutter less? Or keep? Let's keep but maybe as line or area? Let's keep as bar for now but nicer.
        'Stopa Oszczędności': d.savingsRate
    }))

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full relative"
        >
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                        Przepływy Finansowe
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1">
                        Zestawienie dochodów i wydatków w roku {year}
                    </p>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 text-zinc-400">
                    <ArrowUpRight size={24} />
                </div>
            </div>

            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />

                        <XAxis
                            dataKey="month"
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                            interval="preserveStartEnd"
                            minTickGap={10}
                        />
                        <YAxis
                            yAxisId="left"
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#8b5cf6"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}%`}
                        />

                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />

                        <Legend
                            wrapperStyle={{ paddingTop: '20px' }}
                            iconType="circle"
                            formatter={(value) => <span className="text-zinc-300 font-medium ml-2">{value}</span>}
                        />

                        <Bar
                            yAxisId="left"
                            dataKey="Dochody"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={32}
                            animationDuration={1000}
                        />
                        <Bar
                            yAxisId="left"
                            dataKey="Wydatki"
                            fill="#ef4444"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={32}
                            animationDuration={1000}
                        />

                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="Stopa Oszczędności"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#8b5cf6' }}
                            animationDuration={1500}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    )
}
