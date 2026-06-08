'use client'
import React, { useState, useMemo } from 'react'
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts'
import { formatMoneyWithSeparators } from '@/lib/utils/money'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronRight, PieChart as PieChartIcon } from 'lucide-react'
import { SpendingTreeNode } from '@/lib/types'
import { EmptyState } from '@/components/shared/ui/EmptyState'
import { CHART_PALETTE, CHART_PALETTE_GLOW, TOOLTIP_STYLE } from '@/lib/constants/chart-colors'

interface ChartData {
  name: string
  value: number
  color: string
}

interface AnalyticsChartsProps {
  data: ChartData[]
  chartTotal: number
  onSegmentClick?: (segmentName: string, segmentValue: number) => void
  drillDownPath?: SpendingTreeNode[]
  onBack?: () => void
  onPathClick?: (node: SpendingTreeNode | null) => void
  selectedItem?: string
}

const RADIAN = Math.PI / 180

const CustomTooltip = ({ active, payload, total }: any) => {
  if (!active || !payload || !payload.length) return null
  const entry = payload[0]
  const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0'
  const firstName = entry.name.indexOf(' ')
  const cleanName = firstName !== -1 ? entry.name.substring(firstName + 1) : entry.name
  return (
    <div style={TOOLTIP_STYLE} className="min-w-[180px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.payload.fill }} />
        <p className="text-zinc-300 text-xs font-semibold">{cleanName}</p>
      </div>
      <p className="text-white font-bold text-sm tabular-nums">{formatMoneyWithSeparators(entry.value)} zł</p>
      <p className="text-zinc-500 text-[11px] tabular-nums mt-0.5">{pct}% całości</p>
    </div>
  )
}

export function AnalyticsCharts({ data, selectedItem, onSegmentClick, drillDownPath = [], onBack, onPathClick, chartTotal }: AnalyticsChartsProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const chartData = useMemo(() =>
    data
      .filter(item => item.value > 0)
      .map((item, i) => ({
        ...item,
        fill: CHART_PALETTE[i % CHART_PALETTE.length]
      })),
    [data]
  )

  const isDrilledDown = drillDownPath.length > 0
  const currentTitle = isDrilledDown
    ? `Wydatki: ${drillDownPath[drillDownPath.length - 1].name}`
    : 'Podsumowanie Wydatków'

  if (chartData.length === 0) {
    return (
      <EmptyState
        title="Brak wydatków"
        description="Brak danych do wyświetlenia dla tej sekcji w wybranym okresie."
        icon={PieChartIcon}
      />
    )
  }

  const top3 = chartData.slice(0, 3)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden p-5 sm:p-8 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl"
    >
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 mb-1">
              {currentTitle}
            </h2>
            <p className="text-[11px] text-zinc-500">
              {isDrilledDown ? 'Podgląd szczegółów wybranego elementu' : 'Kliknij segment aby sprawdzić szczegóły'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-medium">Suma</div>
            <div className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 tabular-nums tracking-tight">
              {formatMoneyWithSeparators(chartTotal)} zł
            </div>
          </div>
        </div>

        {/* Breadcrumbs */}
        <AnimatePresence>
          {isDrilledDown && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-1.5 text-xs bg-zinc-800/40 px-3 py-2 rounded-xl border border-zinc-700/30 w-fit max-w-full overflow-x-auto"
            >
              <button onClick={() => onPathClick?.(null)} className="hover:text-blue-400 transition-colors font-medium text-zinc-400 whitespace-nowrap">
                Główne
              </button>
              {drillDownPath.map((node, i) => (
                <React.Fragment key={node.id}>
                  <ChevronRight size={11} className="text-zinc-600 shrink-0" />
                  <button
                    onClick={() => i < drillDownPath.length - 1 ? onPathClick?.(node) : null}
                    className={`transition-colors whitespace-nowrap ${i < drillDownPath.length - 1 ? 'hover:text-blue-400 text-zinc-400' : 'text-zinc-200 font-semibold cursor-default'}`}
                  >
                    {node.name}
                  </button>
                </React.Fragment>
              ))}
              <button
                onClick={onBack}
                className="ml-2 flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors font-medium px-2 py-0.5 rounded-lg hover:bg-blue-400/10 whitespace-nowrap"
              >
                <ArrowLeft size={12} /> Wróć
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chart + Legend */}
      <div className="flex flex-col md:flex-row gap-6 relative z-10">
        {/* Donut with center label */}
        <div className="flex justify-center items-center relative w-full md:w-auto md:shrink-0">
          <div className="h-56 sm:h-64 w-56 sm:w-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius="58%"
                  outerRadius="78%"
                  paddingAngle={2.5}
                  dataKey="value"
                  label={false}
                  labelLine={false}
                  onClick={(entry: any) => {
                    if (entry && onSegmentClick) onSegmentClick(entry.name, entry.value)
                  }}
                  style={{ cursor: 'pointer', outline: 'none' }}
                  isAnimationActive={true}
                  animationDuration={900}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, index) => {
                    const isActive = activeIndex === index
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill}
                        stroke={isActive ? 'rgba(255,255,255,0.3)' : 'transparent'}
                        strokeWidth={isActive ? 2 : 0}
                        opacity={activeIndex === null || isActive ? 1 : 0.55}
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                        style={{
                          filter: isActive ? `brightness(1.2) drop-shadow(0 0 10px ${entry.fill}60)` : 'none',
                          transition: 'all 0.25s ease',
                        }}
                      />
                    )
                  })}
                </Pie>
                <Tooltip
                  content={<CustomTooltip total={chartTotal} />}
                  trigger="hover"
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Razem</div>
              <div className="text-lg font-bold text-white tabular-nums leading-tight">
                {formatMoneyWithSeparators(chartTotal)}
              </div>
              <div className="text-xs text-zinc-500">zł</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 grid grid-cols-1 xs:grid-cols-2 gap-2">
          {chartData.map((entry, index) => {
            const percentage = ((entry.value / chartTotal) * 100).toFixed(1)
            const isActive = activeIndex === index
            const color = entry.fill
            const glow = CHART_PALETTE_GLOW[index % CHART_PALETTE_GLOW.length]

            return (
              <button
                key={entry.name}
                onClick={() => onSegmentClick?.(entry.name, entry.value)}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`relative flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-200 overflow-hidden
                  ${isActive ? 'border-white/10 bg-zinc-800/60' : 'border-white/5 bg-zinc-900/30 hover:bg-zinc-800/40'}`}
                style={isActive ? { boxShadow: `0 0 0 1px ${color}25, 0 4px 16px ${glow}` } : {}}
              >
                {/* Progress bg */}
                <div
                  className="absolute inset-y-0 left-0 pointer-events-none rounded-l-xl transition-all duration-700"
                  style={{ width: `${percentage}%`, backgroundColor: color, opacity: isActive ? 0.12 : 0.07 }}
                />

                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 relative z-10 transition-all"
                  style={{ backgroundColor: color, boxShadow: isActive ? `0 0 8px ${color}` : 'none' }}
                />

                <div className="flex-1 min-w-0 relative z-10">
                  <div className="text-xs font-medium text-zinc-200 truncate leading-tight">{entry.name}</div>
                  <div className="text-[10px] text-zinc-500 tabular-nums mt-0.5">{formatMoneyWithSeparators(entry.value)} zł</div>
                </div>

                <div className="text-sm font-bold text-zinc-300 tabular-nums shrink-0 relative z-10">
                  {percentage}%
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
