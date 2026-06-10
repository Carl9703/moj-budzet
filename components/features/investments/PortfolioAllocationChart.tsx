'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { PieChart as PieChartIcon, TrendingUp, Wallet, Vault } from 'lucide-react'

interface PortfolioAllocationChartProps {
    allocations: {
        stocks: number
        crypto: number
        ppk: number
    }
    totalValue: number
}

const COLORS = {
    'Akcje/ETF': '#f59e0b', // Indigo-400 (brighter)
    'Krypto': '#fbbf24',    // Amber-400
    'PPK': '#34d399'        // Emerald-400
}

const GRADIENTS = {
    'Akcje/ETF': ['#d97706', '#fcd34d'],
    'Krypto': ['#f59e0b', '#fcd34d'],
    'PPK': ['#10b981', '#6ee7b7']
}

const ICONS = {
    'Akcje/ETF': TrendingUp,
    'Krypto': Wallet,
    'PPK': Vault
}

export function PortfolioAllocationChart({ allocations, totalValue }: PortfolioAllocationChartProps) {
    const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)

    const chartData = [
        { name: 'Akcje/ETF' as const, value: allocations.stocks, color: COLORS['Akcje/ETF'], gradient: GRADIENTS['Akcje/ETF'], icon: ICONS['Akcje/ETF'] },
        { name: 'Krypto' as const, value: allocations.crypto, color: COLORS['Krypto'], gradient: GRADIENTS['Krypto'], icon: ICONS['Krypto'] },
        { name: 'PPK' as const, value: allocations.ppk, color: COLORS['PPK'], gradient: GRADIENTS['PPK'], icon: ICONS['PPK'] },
    ].filter(item => item.value > 0)

    const chartDataWithPercentage = chartData.map(item => ({
        ...item,
        percentage: totalValue > 0 ? (item.value / totalValue) * 100 : 0
    }))

    const activeEntry = activeIndex !== undefined ? chartDataWithPercentage[activeIndex] : undefined

    return (
        <div className="h-full relative overflow-hidden rounded-3xl p-6 border border-white/5 bg-zinc-900/60 shadow-2xl backdrop-blur-3xl flex flex-col group">

            {/* Header */}
            <div className="w-full flex justify-between items-center mb-2 relative z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-zinc-200 shadow-inner">
                        <PieChartIcon size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Alokacja Aktywów</h3>
                </div>
            </div>

            {/* Chart + Center Label */}
            <div className="flex-1 w-full min-h-0 flex items-center justify-center relative z-10">
                <div className="relative w-full h-full max-w-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <defs>
                                {chartData.map((entry, index) => (
                                    <linearGradient key={`grad-${index}`} id={`pie-gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor={entry.gradient[0]} />
                                        <stop offset="100%" stopColor={entry.gradient[1]} />
                                    </linearGradient>
                                ))}
                                <filter id="donut-glow" height="160%" width="160%" x="-30%" y="-30%">
                                    <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
                                    <feComponentTransfer in="blur">
                                        <feFuncA type="linear" slope="0.4" />
                                    </feComponentTransfer>
                                    <feMerge>
                                        <feMergeNode />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            <Pie
                                data={chartDataWithPercentage}
                                cx="50%"
                                cy="50%"
                                innerRadius="65%"
                                outerRadius="85%"
                                paddingAngle={4}
                                cornerRadius={8}
                                dataKey="value"
                                onMouseEnter={(_, index) => setActiveIndex(index)}
                                onMouseLeave={() => setActiveIndex(undefined)}
                                stroke="none"
                                animationBegin={0}
                                animationDuration={800}
                            >
                                {chartDataWithPercentage.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={`url(#pie-gradient-${index})`}
                                        style={{
                                            filter: activeIndex === index ? 'url(#donut-glow)' : 'none',
                                            opacity: activeIndex === undefined || activeIndex === index ? 1 : 0.3,
                                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                            cursor: 'pointer',
                                            outline: 'none'
                                        }}
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Center Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        {activeEntry ? (
                            <>
                                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                                    {activeEntry.name}
                                </span>
                                <span className="text-2xl font-black text-white tabular-nums">
                                    {activeEntry.percentage.toFixed(1)}%
                                </span>
                                <span className="text-xs text-zinc-500 font-medium tabular-nums mt-0.5">
                                    {activeEntry.value.toLocaleString('pl-PL', { maximumFractionDigits: 0 })} zł
                                </span>
                            </>
                        ) : (
                            <>
                                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                                    Razem
                                </span>
                                <span className="text-xl font-black text-white tabular-nums">
                                    {totalValue >= 1000
                                        ? `${(totalValue / 1000).toLocaleString('pl-PL', { maximumFractionDigits: 1 })}k`
                                        : totalValue.toLocaleString('pl-PL', { maximumFractionDigits: 0 })
                                    }
                                </span>
                                <span className="text-xs text-zinc-500 font-medium">PLN</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="w-full mt-auto pt-4 flex flex-wrap justify-center gap-2 relative z-10 shrink-0">
                {chartDataWithPercentage.map((entry, index) => {
                    const isActive = activeIndex === index
                    const Icon = entry.icon
                    return (
                        <div
                            key={entry.name}
                            onMouseEnter={() => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(undefined)}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-300 cursor-pointer ${isActive
                                ? 'bg-white/10 border-white/15 shadow-lg scale-[1.03]'
                                : 'bg-white/[0.03] border-white/[0.04] hover:bg-white/[0.06]'
                                }`}
                        >
                            <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{
                                    backgroundColor: entry.color,
                                    boxShadow: isActive ? `0 0 12px ${entry.color}` : `0 0 6px ${entry.color}40`
                                }}
                            />
                            <span className="text-zinc-300 text-xs font-semibold">{entry.name}</span>
                            <span className="text-zinc-500 text-xs font-bold tabular-nums">{entry.percentage.toFixed(1)}%</span>
                        </div>
                    )
                })}

                {chartData.length === 0 && (
                    <div className="text-zinc-500 text-sm italic">
                        Brak danych
                    </div>
                )}
            </div>
        </div>
    )
}
