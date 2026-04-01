'use client'

import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { MonthlySummary } from '@/lib/api/annual-report'

interface YearComparisonChartProps {
    currentYearData: MonthlySummary[]
    previousYearData?: MonthlySummary[]
    currentYear: number
    previousYear: number
}

export function YearComparisonChart({
    currentYearData,
    previousYearData,
    currentYear,
    previousYear
}: YearComparisonChartProps) {
    const chartData = currentYearData.map((current, index) => ({
        month: current.month.slice(0, 3),
        [currentYear]: current.expenses,
        [previousYear]: previousYearData?.[index]?.expenses || 0
    }))

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full relative"
        >
            <h2 className="text-xl font-bold text-slate-100 mb-2 flex items-center gap-2">
                <span>📊</span>
                <span>Porównanie Wydatków: {previousYear} vs {currentYear}</span>
            </h2>
            <p className="text-sm text-slate-400 mb-6">
                Miesięczne wydatki w porównaniu rok do roku
            </p>

            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis
                        dataKey="month"
                        stroke="#94a3b8"
                        style={{ fontSize: '12px' }}
                        interval="preserveStartEnd"
                        minTickGap={10}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #475569',
                            borderRadius: '8px',
                            color: '#f1f5f9'
                        }}
                        formatter={(value: number) => `${value.toFixed(2)} zł`}
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
