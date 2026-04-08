'use client'
import React, { useState } from 'react'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatMoneyWithSeparators } from '@/lib/utils/money'
// import { ANALYTICS_COLORS } from '@/lib/constants/colors' // Removing unused import
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronRight, PieChart as PieChartIcon } from 'lucide-react'
import { SpendingTreeNode } from '@/lib/types'
import { EmptyState } from '@/components/shared/ui/EmptyState'

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


export function AnalyticsCharts({ data, selectedItem, onSegmentClick, drillDownPath = [], onBack, onPathClick, chartTotal }: AnalyticsChartsProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  // Format data for chart - only only show data items (not TRANSACTION type)
  const chartData = data.filter(item => item.value > 0)

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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden p-4 sm:p-8 rounded-2xl border border-zinc-700/30 group hover:border-zinc-600/50 transition-colors bg-zinc-900/40 backdrop-blur-xl"
    >
      {/* Decorative ambient gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
              📊 {currentTitle}
            </h2>
            <p className="text-xs text-zinc-400">
              {isDrilledDown ? 'Podgląd szczegółów wybranego elementu' : 'Kliknij na segment, aby sprawdzić szczegóły'}
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1 font-medium">Suma w sekcji</div>
            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 drop-shadow-sm tabular-nums tracking-tight">
              {formatMoneyWithSeparators(chartTotal)}
            </div>
          </div>
        </div>

        {/* Breadcrumbs */}
        <AnimatePresence>
          {isDrilledDown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-800/50 p-2 rounded-lg border border-zinc-700/30 w-fit"
            >
              <button
                onClick={() => onPathClick?.(null)}
                className="hover:text-blue-400 transition-colors font-medium hover-lift"
              >
                Główne
              </button>
              {drillDownPath.map((node, i) => (
                <React.Fragment key={node.id}>
                  <ChevronRight size={12} className="text-zinc-600" />
                  <button
                    onClick={() => i < drillDownPath.length - 1 ? onPathClick?.(node) : null}
                    className={`transition-colors ${i < drillDownPath.length - 1 ? 'hover:text-blue-400 hover-lift' : 'text-zinc-300 font-medium cursor-default'}`}
                  >
                    {node.name}
                  </button>
                </React.Fragment>
              ))}

              <button
                onClick={onBack}
                className="ml-4 flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors font-medium px-2 py-0.5 rounded-md hover:bg-blue-400/10"
              >
                <ArrowLeft size={14} /> Wróć
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chart */}
      <div className="flex flex-col sm:block">
        <div className="flex justify-center relative z-10 h-64 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="75%"
                paddingAngle={3}
                dataKey="value"
                // Label removed for mobile clarity, relying on Legend
                label={false}
                labelLine={false}
                onClick={(entry: any) => {
                  if (entry && onSegmentClick) {
                    onSegmentClick(entry.name, entry.value)
                  }
                }}
                style={{ cursor: 'pointer', outline: 'none' }}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => {
                  const isActive = activeIndex === index
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke={isActive ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.15)'}
                      strokeWidth={isActive ? 3 : 1.5}
                      opacity={activeIndex === null || isActive ? 1 : 0.6}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                      style={{
                        filter: isActive ? 'brightness(1.15) drop-shadow(0 0 12px rgba(255,255,255,0.2))' : 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isActive ? 'scale(1.02)' : 'scale(1)',
                        transformOrigin: 'center'
                      }}
                    />
                  )
                })}
              </Pie>
              <Tooltip
                trigger="click"
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  borderColor: 'rgba(51, 65, 85, 0.5)',
                  borderRadius: '12px',
                  color: 'white',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.4)'
                }}
                itemStyle={{ color: '#94a3b8' }}
                formatter={(value: number, name: string) => {
                  // Extract name without icon (format is "Icon Name")
                  const firstSpaceIndex = name.indexOf(' ')
                  const cleanName = firstSpaceIndex !== -1 ? name.substring(firstSpaceIndex + 1) : name
                  return [<span key="val" className="text-white font-bold tabular-nums">{formatMoneyWithSeparators(value)}</span>, cleanName]
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Custom Legend for Mobile/Desktop */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 relative z-10">
          {chartData.map((entry, index) => {
            const percentage = ((entry.value / chartTotal) * 100).toFixed(1)
            return (
              <button
                key={entry.name}
                onClick={() => onSegmentClick?.(entry.name, entry.value)}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`flex flex-wrap items-center justify-between gap-y-1 gap-x-3 p-3 rounded-xl border transition-all ${activeIndex === index
                  ? 'bg-zinc-800/60 border-amber-500/30 shadow-lg scale-[1.02]'
                  : 'bg-zinc-900/20 border-zinc-700/30 hover:bg-zinc-800/40'
                  }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-3 h-3 rounded-full shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                    style={{ backgroundColor: entry.color }}
                  />
                  <div className="text-sm font-medium text-zinc-200 truncate">
                    {entry.name}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-auto">
                  <div className="text-sm font-bold text-zinc-100">
                    {percentage}%
                  </div>
                  <div className="text-[10px] text-zinc-500 tabular-nums">
                    {formatMoneyWithSeparators(entry.value)}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
