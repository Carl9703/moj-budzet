'use client'

import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { MonthlySummary } from '@/lib/api/annual-report'

interface IncomeComparisonChartProps {
    currentYearData: MonthlySummary[]
    previousYearData?: MonthlySummary[]
    currentYear: number
    previousYear: number
}

export function IncomeComparisonChart({
    currentYearData,
    previousYearData,
    currentYear,
    previousYear
}: IncomeComparisonChartProps) {
    const chartData = currentYearData.map((current, index) => ({
        month: current.month.slice(0, 3),
        [currentYear]: current.income,
        [previousYear]: previousYearData?.[index]?.income || 0
    }))

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glassmorphic-premium p-6 rounded-2xl border border-slate-700/50 mb-8"
        >
            <h2 className="text-xl font-bold text-slate-100 mb-2 flex items-center gap-2">
                <span>💰</span>
                <span>Porównanie Dochodów: {previousYear} vs {currentYear}</span>
            </h2>
            <p className="text-sm text-slate-400 mb-6">
                Miesięczne dochody w porównaniu rok do roku
            </p>

            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                    <XAxis
                        dataKey="month"
                        stroke="#94a3b8"
                        style={{ fontSize: '12px' }}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                        interval="preserveStartEnd"
                        minTickGap={10}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        style={{ fontSize: '12px' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '12px',
                            color: '#f1f5f9',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                        }}
                        formatter={(value: number) => `${value.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł`}
                        cursor={{ fill: 'rgba(51, 65, 85, 0.2)' }}
                    />
                    <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="rect"
                    />
                    <Bar
                        dataKey={previousYear}
                        fill="#ef4444"
                        radius={[6, 6, 0, 0]}
                        name={`${previousYear}`}
                        maxBarSize={50}
                        minPointSize={4}
                    />
                    <Bar
                        dataKey={currentYear}
                        fill="#3b82f6"
                        radius={[6, 6, 0, 0]}
                        name={`${currentYear}`}
                        maxBarSize={50}
                        minPointSize={4}
                    />
                </BarChart>
            </ResponsiveContainer>
        </motion.div>
    )
}
