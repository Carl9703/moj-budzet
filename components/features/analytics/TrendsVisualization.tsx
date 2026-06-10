'use client'

import { useMemo } from 'react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { ANALYTICS_COLORS } from '@/lib/constants/colors'
import { motion } from 'framer-motion'
import { EXPENSE_COLOR, TOOLTIP_STYLE } from '@/lib/constants/chart-colors'
import { formatMoneyWithSeparators } from '@/lib/utils/money'

interface TrendData {
  period: string
  value: number
}

interface TrendsVisualizationProps {
  data: TrendData[]
  selectedItem?: string
  onPeriodClick?: (period: string) => void
  loading?: boolean
  year?: string
}

const formatPeriod = (period: string): string => {
  const [yearPart, month] = period.split('-')
  const monthNames = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']
  const mIndex = parseInt(month) - 1
  if (mIndex >= 0 && mIndex < 12) return `${monthNames[mIndex]} ${yearPart.slice(-2)}`
  return period
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null
  const value = payload[0]?.value ?? 0
  return (
    <div style={TOOLTIP_STYLE} className="min-w-[160px]">
      <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">{label}</p>
      <p className="text-white font-bold text-sm tabular-nums">{formatMoneyWithSeparators(value)} zł</p>
    </div>
  )
}

export function TrendsVisualization({
  data,
  selectedItem,
  onPeriodClick,
  loading = false,
  year
}: TrendsVisualizationProps) {
  const chartData = useMemo(() =>
    data
      .map(item => ({
        period: formatPeriod(item.period),
        originalPeriod: item.period,
        wydatki: item.value
      }))
      .sort((a, b) => a.originalPeriod.localeCompare(b.originalPeriod)),
    [data]
  )

  const average = useMemo(() => {
    if (!chartData.length) return 0
    let divisor = 12
    const [yearStr] = chartData[0].originalPeriod.split('-')
    if (parseInt(yearStr) === new Date().getFullYear()) {
      divisor = Math.max(1, new Date().getMonth() + 1)
    }
    return chartData.reduce((acc, curr) => acc + curr.wydatki, 0) / divisor
  }, [chartData])

  const areaColor = selectedItem ? '#fbbf24' : EXPENSE_COLOR.solid

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[360px] rounded-2xl border border-zinc-800/50 bg-zinc-900/30">
        <div className="w-10 h-10 border-4 border-zinc-700 border-t-rose-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] text-center p-8 rounded-2xl border border-zinc-800/50 bg-zinc-900/30">
        <div className="text-5xl mb-4 opacity-40">📈</div>
        <h3 className="text-lg font-bold text-white mb-1">Brak danych trendów</h3>
        <p className="text-zinc-400 text-sm max-w-sm mx-auto">
          Dodaj transakcje z różnych okresów, aby zobaczyć wizualizację trendów w czasie.
        </p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="relative overflow-hidden p-5 sm:p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl"
    >
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-0 w-56 h-56 rounded-full blur-[80px] -translate-y-1/2 -translate-x-1/2 pointer-events-none"
        style={{ backgroundColor: areaColor, opacity: 0.06 }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-end justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 flex items-center gap-2">
            Trend Wydatków
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {selectedItem
              ? <span style={{ color: areaColor }}>Trend dla: {selectedItem}</span>
              : 'Całkowite wydatki w czasie'
            }
          </p>
        </div>

        {chartData.length > 0 && (
          <div className="text-right">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-0.5">Średnia</p>
            <p className="text-base font-bold tabular-nums" style={{ color: areaColor }}>
              {formatMoneyWithSeparators(average)} zł
            </p>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="w-full relative z-10 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 4, left: -16, bottom: 0 }}
            onClick={(e) => {
              if (onPeriodClick && e?.activePayload?.[0]) {
                const original = (e.activePayload[0].payload as any).originalPeriod
                if (original) onPeriodClick(original)
              }
            }}
          >
            <defs>
              <linearGradient id="trendsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={areaColor} stopOpacity={0.28} />
                <stop offset="95%" stopColor={areaColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="1 5"
              stroke="rgba(82, 82, 91, 0.35)"
              vertical={false}
            />
            <XAxis
              dataKey="period"
              tick={{ fill: '#71717a', fontSize: 11, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              dy={8}
              interval="preserveStartEnd"
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

            {/* Average reference line */}
            {average > 0 && (
              <ReferenceLine
                y={average}
                stroke={areaColor}
                strokeOpacity={0.5}
                strokeDasharray="4 4"
                label={{
                  value: `Śr: ${(average / 1000).toFixed(1)}k`,
                  fill: areaColor,
                  fontSize: 10,
                  fontWeight: 600,
                  position: 'insideTopRight',
                  dy: -6,
                  dx: -4,
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="wydatki"
              stroke={areaColor}
              strokeWidth={2.5}
              fill="url(#trendsGrad)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: areaColor }}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
