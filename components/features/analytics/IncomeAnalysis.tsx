'use client'
import { useState } from 'react'
import { DonutChart, BarChart } from '@tremor/react'
import { formatMoneyWithSeparators } from '@/lib/utils/money'
import { ANALYTICS_COLORS } from '@/lib/constants/colors'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, ArrowRight } from 'lucide-react'

interface IncomeSource {
  source: string
  total: number
  count: number
  avgAmount: number
  percentage: number
  transactions: {
    id: string
    amount: number
    description: string
    date: string
  }[]
}

interface IncomeTrendData {
  period: string
  value: number
}

interface IncomeAnalyticsData {
  sources: IncomeSource[]
  trends: IncomeTrendData[]
  totalIncome: number
  period: string
  summary: {
    totalSources: number
    totalTransactions: number
    avgTransactionAmount: number
  }
}

interface IncomeAnalysisProps {
  data: IncomeAnalyticsData | null
  loading: boolean
}

export function IncomeAnalysis({ data, loading }: IncomeAnalysisProps) {
  const [selectedSource, setSelectedSource] = useState<string | null>(null)

  const chartData = data?.sources.map((source, index) => ({
    name: source.source,
    value: source.total,
    color: ANALYTICS_COLORS[index % ANALYTICS_COLORS.length]
  })) || []

  // Simplify trends formatting
  const trendFormatter = (number: number) =>
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(number)

  const trendsData = data?.trends || []

  const handleSegmentClick = (segmentName: string) => {
    setSelectedSource(prev => prev === segmentName ? null : segmentName)
  }

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

  // Pre-format trends data
  const formattedTrends = [...trendsData]
    .sort((a, b) => a.period.localeCompare(b.period))
    .map(t => ({
      ...t,
      displayPeriod: formatPeriod(t.period),
      income: t.value
    }))

  let trendDivisor = 12
  if (formattedTrends.length > 0) {
    const [yearStr] = formattedTrends[0].period.split('-')
    if (parseInt(yearStr) === new Date().getFullYear()) {
      trendDivisor = Math.max(1, new Date().getMonth() + 1)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[400px] rounded-2xl bg-zinc-800/40 animate-pulse border border-zinc-700/30" />
          <div className="h-[400px] rounded-2xl bg-zinc-800/40 animate-pulse border border-zinc-700/30" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div
        className="text-center p-12 rounded-2xl border border-zinc-700/30"
        style={{
          background: 'rgba(30, 41, 59, 0.4)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="text-5xl mb-4 opacity-50 grayscale">📊</div>
        <h3 className="text-xl font-bold text-white mb-2">Brak danych przychodów</h3>
        <p className="text-zinc-400">Nie znaleziono transakcji przychodów w wybranym okresie.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-2xl border border-zinc-700/30 relative overflow-hidden flex flex-col"
          style={{
            background: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="mb-6 relative z-10">
            <h3 className="text-xl font-bold text-white mb-1">Źródła Przychodów</h3>
            <p className="text-sm text-zinc-400">Skąd pochodzą Twoje pieniądze?</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative z-10 min-h-[300px]">
            <div className="w-full max-w-[260px] flex justify-center mx-auto">
              <DonutChart
                className="h-64 w-full"
                data={chartData}
                category="value"
                index="name"
                colors={chartData.map(item => item.color)}
                valueFormatter={(number: number) => formatMoneyWithSeparators(number)}
                onValueChange={(value) => {
                  if (value) handleSegmentClick(value.name)
                }}
                showLabel={false}
                variant="donut"
              />
              <div className="mt-6 text-center">
                <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Całkowity Przychód</div>
                <div className="text-3xl font-bold text-emerald-400">{formatMoneyWithSeparators(data.totalIncome)}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-8 rounded-2xl border border-zinc-700/30 relative overflow-hidden flex flex-col"
          style={{
            background: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="mb-6 flex items-end justify-between relative z-10">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">📊 Trend Przychodów</h3>
              <p className="text-sm text-zinc-400">Jak zmieniały się Twoje zarobki?</p>
            </div>

            {formattedTrends.length > 0 && (
              <div className="text-right">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-0.5">Średnia</p>
                <p className="text-lg font-bold text-emerald-400">
                  {trendFormatter(formattedTrends.reduce((acc, curr) => acc + curr.income, 0) / trendDivisor)}
                </p>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-[300px] w-full relative z-10">
            <BarChart
              data={formattedTrends}
              index="displayPeriod"
              categories={['income']}
              colors={['emerald']}
              valueFormatter={trendFormatter}
              className="h-full w-full"
              yAxisWidth={60}
              showLegend={false}
              showGridLines={false}
              showAnimation={true}
              showTooltip={true}
            />

            {/* Average Line Overlay */}
            {formattedTrends.length > 0 && (
              <div
                className="absolute left-[60px] right-0 border-t-2 border-emerald-400/40 z-20 pointer-events-none transition-all duration-500"
                style={{
                  bottom: `${Math.min(280, Math.max(40, ((formattedTrends.reduce((acc, curr) => acc + curr.income, 0) / trendDivisor) / Math.max(...formattedTrends.map(d => d.income), 1) * 250) + 40))}px`
                }}
              >
                <div className="flex justify-start items-center -mt-3.5">
                  <span className="text-xs font-bold text-emerald-400 bg-zinc-900 border border-emerald-400/20 px-1.5 py-0.5 rounded shadow-lg backdrop-blur-md">
                    ŚREDNIA: {trendFormatter(formattedTrends.reduce((acc, curr) => acc + curr.income, 0) / trendDivisor)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Details List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-8 rounded-2xl border border-zinc-700/30"
        style={{
          background: 'rgba(30, 41, 59, 0.4)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Szczegóły Źródeł</h3>
          <div className="text-sm text-zinc-400">
            {data.summary.totalTransactions} transakcji | Średnio {formatMoneyWithSeparators(data.summary.avgTransactionAmount)}
          </div>
        </div>

        <div className="space-y-4">
          {data.sources.map((source, index) => (
            <div key={source.source} className="group">
              <div
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${selectedSource === source.source
                  ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                  : 'bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-700/40 hover:border-zinc-600/50'
                  }`}
                onClick={() => handleSegmentClick(source.source)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full ring-4 ring-white/5" style={{ backgroundColor: ANALYTICS_COLORS[index % ANALYTICS_COLORS.length] }}></div>
                  <div>
                    <div className="font-bold text-white text-lg">{source.source}</div>
                    <div className="text-sm text-zinc-400">
                      {source.count} wpłat • Średnio {formatMoneyWithSeparators(source.avgAmount)}
                    </div>
                  </div>
                </div>

                <div className="flex items-end flex-col">
                  <div className="font-bold text-emerald-400 text-xl">
                    +{formatMoneyWithSeparators(source.total)}
                  </div>
                  <div className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {source.percentage}% całości
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {selectedSource === source.source && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 ml-4 md:ml-12 p-4 bg-zinc-900/50 rounded-xl border border-zinc-700/50">
                      <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Historia Transakcji</h4>
                      <div className="space-y-2">
                        {source.transactions.map((t) => (
                          <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors border border-zinc-700/30">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-400">
                                <TrendingUp size={14} />
                              </div>
                              <div>
                                <div className="font-medium text-zinc-200">{t.description}</div>
                                <div className="text-xs text-zinc-500">{t.date}</div>
                              </div>
                            </div>
                            <div className="font-bold text-emerald-400">
                              +{formatMoneyWithSeparators(t.amount)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
