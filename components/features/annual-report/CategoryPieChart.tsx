'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts'
import { CategoryBreakdown } from '@/lib/api/annual-report'
import { PieChart as PieChartIcon } from 'lucide-react'

interface CategoryPieChartProps {
    data: CategoryBreakdown[]
    totalExpenses: number
}

// Vibrant but premium color palette
const COLORS = [
    '#6366f1', // Indigo
    '#ec4899', // Pink
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
    '#f43f5e', // Rose
    '#3b82f6', // Blue
    '#d946ef', // Fuchsia
    '#84cc16', // Lime
]

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

    return (
        <g>
            <text x={cx} y={cy} dy={-10} textAnchor="middle" fill="#94a3b8" fontSize={12} fontWeight={500}>
                {payload.name}
            </text>
            <text x={cx} y={cy} dy={15} textAnchor="middle" fill="#f1f5f9" fontSize={18} fontWeight="bold">
                {(percent * 100).toFixed(0)}%
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 8}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={innerRadius - 6}
                outerRadius={innerRadius - 2}
                fill={fill}
            />
        </g>
    );
};

export function CategoryPieChart({ data, totalExpenses }: CategoryPieChartProps) {
    const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)

    // Prepare data
    const topCategories = data.slice(0, 20)
    const otherCategories = data.slice(20)
    const otherTotal = otherCategories.reduce((sum, cat) => sum + cat.totalAmount, 0)

    const chartData = [
        ...topCategories.map(cat => ({
            name: cat.categoryName,
            value: cat.totalAmount,
            percentage: cat.percentage,
            icon: cat.categoryIcon
        })),
        ...(otherTotal > 0 ? [{
            name: 'Inne',
            value: otherTotal,
            percentage: (otherTotal / totalExpenses) * 100,
            icon: '📦'
        }] : [])
    ]

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-3xl border border-white/5 bg-slate-900/50 backdrop-blur-xl mb-12 shadow-xl"
        >
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shadow-inner border border-white/5">
                        <PieChartIcon size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-widest">
                            Podział Kategorii
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">Procentowa dystrybucja wg wydatków</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-center items-center">
                <div className="relative w-full h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <defs>
                                <filter id="glow-shadow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={200}
                                paddingAngle={2}
                                dataKey="value"
                                onMouseEnter={(_, index) => setActiveIndex(index)}
                                onMouseLeave={() => setActiveIndex(undefined)}
                                stroke="none"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                                isAnimationActive={false}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                        style={{
                                            filter: activeIndex === index ? 'url(#glow-shadow)' : 'none',
                                            opacity: activeIndex === undefined || activeIndex === index ? 1 : 0.6,
                                            transition: 'opacity 0.3s ease',
                                            outline: 'none'
                                        }}
                                        stroke="rgba(0,0,0,0)"
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    border: '1px solid rgba(51, 65, 85, 0.5)',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                                }}
                                itemStyle={{ color: '#f8fafc', fontWeight: 500 }}
                                formatter={(value: number) => [`${value.toFixed(2)} zł`, 'Kwota']}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </motion.div>
    )
}
