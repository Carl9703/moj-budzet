'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Calendar } from 'lucide-react'

// Mock data generator that respects creation dates
const generateHistoryFromPositions = (positions: any[]) => {
    const days = 30
    const history = []

    // 1. Generate price curves for each position
    const positionCurves = positions.map((pos: any) => {
        // Volatility based on type (increased for visual effect)
        const vol = pos.type === 'CRYPTO' ? 0.08 : (pos.type === 'STOCK' ? 0.03 : 0.005)

        // Defensively parse market value to ensure it's a number
        let currentValue = Number(pos.marketValue) || 0
        const curve = []

        // Generate daily values backwards
        for (let i = 0; i < days; i++) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            date.setHours(0, 0, 0, 0)

            // Ensure we have a valid date comparison
            const createdDate = new Date(pos.createdAt)
            createdDate.setHours(0, 0, 0, 0)

            // If this day is before the position existed, value is 0
            const isActive = date >= createdDate

            curve.unshift({
                date: date,
                val: isActive ? currentValue : 0
            })

            // Reverse random walk for next iteration (going back in time)
            const change = (Math.random() * vol * 2) - vol
            currentValue = currentValue / (1 + change)
        }
        return { type: pos.type, curve }
    })

    // 2. Aggregate by date
    for (let i = 0; i < days; i++) {
        const date = new Date()
        date.setDate(date.getDate() - (days - 1 - i)) // Going forward now matching the curve array order

        const dayStats: any = {
            date: date.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' }),
            stocks: 0,
            crypto: 0,
            ppk: 0
        }

        // Sum up all positions for this specific array index (i)
        positionCurves.forEach((p: any) => {
            const val = p.curve[i].val
            if (p.type === 'STOCK') dayStats.stocks += val
            else if (p.type === 'CRYPTO') dayStats.crypto += val
            else if (p.type === 'PPK' || p.type === 'PRIVATE_EQUITY') dayStats.ppk += val
        })

        history.push(dayStats)
    }

    return history
}

export function PortfolioHistoryChart({ positions }: { positions: any[] }) {
    // Flatten positions to get all individual lots for granular history
    const allLots = positions.flatMap(p => p.subPositions || [p])
    const data = generateHistoryFromPositions(allLots)

    // Colors
    const colors = {
        crypto: '#f59e0b', // Amber 500
        stocks: '#f59e0b', // Indigo 500
        ppk: '#10b981'     // Emerald 500
    }

    const labels = {
        crypto: 'Kryptowaluty',
        stocks: 'Akcje',
        ppk: 'PPK / Private'
    }

    return (
        <div className="h-full w-full bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col relative overflow-hidden group">
            <div className="flex justify-between items-center mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">Wartość Portfela</h3>
                        <p className="text-xs text-zinc-500 font-medium">Ostatnie 30 dni</p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-zinc-800/50 rounded-xl border border-zinc-700/50 flex items-center gap-2">
                    <Calendar size={12} className="text-zinc-500" />
                    <span className="text-xs font-bold text-zinc-300">1M</span>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorStocks" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colors.stocks} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={colors.stocks} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorCrypto" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colors.crypto} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={colors.crypto} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorPpk" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colors.ppk} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={colors.ppk} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            minTickGap={30}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            width={35}
                            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '16px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                            }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px' }}
                            formatter={(value: number, name: string) => [
                                `${value.toLocaleString('pl-PL', { maximumFractionDigits: 0 })} PLN`,
                                labels[name as keyof typeof labels] || name
                            ]}
                        />
                        <Area
                            type="monotone"
                            dataKey="stocks"
                            stroke={colors.stocks}
                            fill="url(#colorStocks)"
                            strokeWidth={2}
                            name="stocks"
                        />
                        <Area
                            type="monotone"
                            dataKey="crypto"
                            stroke={colors.crypto}
                            fill="url(#colorCrypto)"
                            strokeWidth={2}
                            name="crypto"
                        />
                        <Area
                            type="monotone"
                            dataKey="ppk"
                            stroke={colors.ppk}
                            fill="url(#colorPpk)"
                            strokeWidth={2}
                            name="ppk"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span className="text-xs text-zinc-400">Akcje</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span className="text-xs text-zinc-400">Krypto</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-xs text-zinc-400">PPK</span>
                </div>
            </div>
        </div>
    )
}
