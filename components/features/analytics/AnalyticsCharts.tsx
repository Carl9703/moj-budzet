'use client'

import { DonutChart } from '@tremor/react'
import { formatMoneyWithSeparators } from '@/lib/utils/money'
import { ANALYTICS_COLORS } from '@/lib/constants/colors'
import { motion } from 'framer-motion'

interface ChartData {
  name: string
  value: number
}

interface Props {
  data: ChartData[]
  total: number
  onSegmentClick?: (segmentName: string, segmentValue: number) => void
}

export function AnalyticsCharts({ data, total, onSegmentClick }: Props) {
  if (!data || data.length === 0) {
    return (
      <div
        className="text-center p-8 rounded-2xl border border-slate-700/30"
        style={{
          background: 'rgba(30, 41, 59, 0.4)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <h3 className="text-xl font-bold text-white mb-2">Podsumowanie wydatków</h3>
        <p className="text-slate-400">Brak danych do wyświetlenia wykresu.</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden p-8 rounded-2xl border border-slate-700/30 group hover:border-slate-600/50 transition-colors"
      style={{
        background: 'rgba(30, 41, 59, 0.4)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Decorative ambient gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
            📊 Podsumowanie Wydatków
          </h2>
          <p className="text-xs text-slate-400">
            Kliknij na segment, aby zobaczyć szczegóły
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Suma wydatków</div>
          <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 drop-shadow-sm">
            {formatMoneyWithSeparators(total)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex justify-center relative z-10">
        <DonutChart
          className="h-80 w-80"
          data={data}
          category="value"
          index="name"
          valueFormatter={(number: number) => formatMoneyWithSeparators(number)}
          colors={ANALYTICS_COLORS}
          showAnimation={true}
          showTooltip={true}
          showLabel={true}
          onValueChange={(value) => {
            if (value && onSegmentClick) {
              onSegmentClick(value.name, value.value)
            }
          }}
          variant="pie" // Using pie variant or donut if available, usually donut is default
        // Tremor customization via className if needed, but standard is fine
        />
      </div>
    </motion.div>
  )
}
