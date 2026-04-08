'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { GroupBreakdown } from '@/lib/api/annual-report'
import { PieChart as PieChartIcon } from 'lucide-react'

interface EnvelopePieChartProps {
    groups: GroupBreakdown[]
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
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#a855f7', // Purple
    '#22c55e', // Green
    '#eab308', // Yellow
]

export function EnvelopePieChart({ groups, totalExpenses }: EnvelopePieChartProps) {
    const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)

    // Flatten all envelopes from all groups
    const allEnvelopes = groups.flatMap(group =>
        group.envelopes.map(env => ({
            name: env.envelopeName,
            value: env.totalAmount,
            percentage: env.percentage,
            icon: env.envelopeIcon,
            group: group.groupName
        }))
    )

    // Sort by value and take top 15
    const sortedEnvelopes = allEnvelopes
        .filter(e => e.value > 0)
        .sort((a, b) => b.value - a.value)

    const topEnvelopes = sortedEnvelopes.slice(0, 15)
    const otherEnvelopes = sortedEnvelopes.slice(15)
    const otherTotal = otherEnvelopes.reduce((sum, env) => sum + env.value, 0)

    const chartData = [
        ...topEnvelopes,
        ...(otherTotal > 0 ? [{
            name: 'Inne',
            value: otherTotal,
            percentage: (otherTotal / totalExpenses) * 100,
            icon: '📦',
            group: 'other'
        }] : [])
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group p-8 rounded-3xl border border-zinc-700/30 bg-gradient-to-br from-zinc-900/40 to-zinc-950/40 backdrop-blur-xl mb-12 relative overflow-hidden"
        >
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                        Podział Wydatków wg Kopert
                    </h2>
                </div>
                <div className="p-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-zinc-400">
                    <PieChartIcon size={20} />
                </div>
            </div>

            <div className="flex justify-center items-center">
                <div className="relative w-full h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <defs>
                                <filter id="glow-shadow-env" x="-50%" y="-50%" width="200%" height="200%">
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
                                            filter: activeIndex === index ? 'url(#glow-shadow-env)' : 'none',
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
