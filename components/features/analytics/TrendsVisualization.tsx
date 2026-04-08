'use client'

import { BarChart } from '@tremor/react'
import { ANALYTICS_COLORS } from '@/lib/constants/colors'
import { motion } from 'framer-motion'

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

export function TrendsVisualization({
  data,
  selectedItem,
  onPeriodClick,
  loading = false,
  year
}: TrendsVisualizationProps) {
  const valueFormatter = (number: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0, // Simplified for trends visuals
      maximumFractionDigits: 0
    }).format(number)
  }

  // Formatowanie okresu na czytelny format
  const formatPeriod = (period: string) => {
    const [yearPart, month] = period.split('-')
    const monthNames = [
      'Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze',
      'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'
    ]
    const mIndex = parseInt(month) - 1
    if (mIndex >= 0 && mIndex < 12) {
      return `${monthNames[mIndex]} ${yearPart.slice(-2)}`
    }
    return period
  }

  // Przygotowanie danych dla wykresu
  // Jeśli podano rok, filtrujemy po nim. W przeciwnym razie pokazujemy bieżący rok lub wszystkie dane (zależnie od kontekstu, tu przyjmijmy strategię: rok z propsów > bieżący rok)
  const chartData = data
    .map(item => ({
      period: formatPeriod(item.period),
      originalPeriod: item.period,
      wydatki: item.value
    }))
    .sort((a, b) => a.originalPeriod.localeCompare(b.originalPeriod))

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-[400px] rounded-2xl border border-zinc-700/30"
        style={{ background: 'rgba(30, 41, 59, 0.4)' }}
      >
        <div className="w-12 h-12 border-4 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 rounded-2xl border border-zinc-700/30"
        style={{ background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(12px)' }}
      >
        <div className="text-5xl mb-4 opacity-50 grayscale transition-all hover:grayscale-0">📈</div>
        <h3 className="text-xl font-bold text-white mb-2">Brak danych trendów</h3>
        <p className="text-zinc-400 max-w-sm mx-auto">
          Dodaj transakcje z różnych okresów, aby zobaczyć wizualizację trendów w czasie.
        </p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="relative overflow-hidden p-4 sm:p-8 rounded-2xl border border-zinc-700/30 group hover:border-zinc-600/50 transition-colors"
      style={{
        background: 'rgba(30, 41, 59, 0.4)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Decorative ambient gradient */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
            📊 Trend Wydatków
          </h2>
          <p className="text-sm text-zinc-400">
            {selectedItem
              ? <span className="text-emerald-300">Trend dla: {selectedItem}</span>
              : 'Całkowite wydatki w czasie'
            }
          </p>
        </div>

        {chartData.length > 0 && (
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-0.5">Średnia</p>
            <p className="text-lg font-bold text-amber-400">
              {valueFormatter(chartData.reduce((acc, curr) => acc + curr.wydatki, 0) / chartData.length)}
            </p>
          </div>
        )}
      </div>

      {/* Chart - fixed height */}
      <div className="w-full relative z-10" style={{ height: '300px' }}>
        {(() => {
          const avg = chartData.length > 0 ? chartData.reduce((acc, curr) => acc + curr.wydatki, 0) / chartData.length : 0;
          return (
            <BarChart
              data={chartData}
              index="period"
              categories={['wydatki']}
              colors={[selectedItem ? 'amber' : 'emerald']}
              valueFormatter={valueFormatter}
              className="h-full w-full"
              showAnimation={true}
              showTooltip={true}
              showGridLines={false}
              yAxisWidth={60}
              showLegend={false}
              onValueChange={(value) => {
                if (onPeriodClick && value) {
                  const original = chartData.find(d => d.period === value.period)?.originalPeriod
                  if (original) onPeriodClick(original)
                }
              }}
            />
          );
        })()}

        {/* Custom Average Line Overlay - Heuristic position with label */}
        {chartData.length > 0 && (
          <div
            className="absolute left-[60px] right-0 border-t-2 border-amber-500/40 z-20 pointer-events-none transition-all duration-500"
            style={{
              bottom: `${Math.min(280, Math.max(40, ((chartData.reduce((acc, curr) => acc + curr.wydatki, 0) / chartData.length) / Math.max(...chartData.map(d => d.wydatki), 1) * 250) + 40))}px`
            }}
          >
            <div className="flex justify-start items-center -mt-3.5">
              <span className="text-[9px] font-bold text-amber-400 bg-zinc-900 border border-amber-500/20 px-1.5 py-0.5 rounded shadow-lg backdrop-blur-md">
                ŚREDNIA: {valueFormatter(chartData.reduce((acc, curr) => acc + curr.wydatki, 0) / chartData.length)}
              </span>
            </div>
          </div>
        )}
      </div>

    </motion.div>
  )
}
