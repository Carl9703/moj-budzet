'use client'

import { useState } from 'react'
import { Calendar, ChevronDown, Check, ArrowLeftRight } from 'lucide-react'
import type { DateRange } from '@/lib/types'

interface GlobalFiltersProps {
  dateRange: DateRange
  compareMode: boolean
  period?: string
  onDateRangeChange: (range: DateRange, period?: string) => void
  onCompareModeChange: (enabled: boolean) => void
  loading?: boolean
}

const PREDEFINED_PERIODS = [
  { key: 'currentMonth', label: 'Ten miesiąc', shortLabel: 'Miesiąc', getDates: () => ({ from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), to: new Date() }) },
  { key: 'previousMonth', label: 'Poprzedni miesiąc', shortLabel: 'Poprz. mies.', getDates: () => ({ from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), to: new Date(new Date().getFullYear(), new Date().getMonth(), 0) }) },
  { key: 'last3Months', label: 'Ostatnie 3 mies.', shortLabel: '3 mies.', getDates: () => ({ from: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1), to: new Date() }) },
  { key: 'last6Months', label: 'Ostatnie 6 mies.', shortLabel: '6 mies.', getDates: () => ({ from: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1), to: new Date() }) },
  { key: 'currentYear', label: 'Ten rok', shortLabel: 'Rok', getDates: () => ({ from: new Date(new Date().getFullYear(), 0, 1), to: new Date() }) },
  { key: 'previousYear', label: 'Ubiegły rok', shortLabel: 'Ub. rok', getDates: () => ({ from: new Date(new Date().getFullYear() - 1, 0, 1), to: new Date(new Date().getFullYear() - 1, 11, 31) }) },
]

export function GlobalFilters({ dateRange, compareMode, period, onDateRangeChange, onCompareModeChange, loading = false }: GlobalFiltersProps) {
  const [showCustomRange, setShowCustomRange] = useState(false)
  const selectedPeriod = period || 'currentMonth'
  const isCustomRange = selectedPeriod === 'custom'

  const handlePeriodSelect = (periodKey: string) => {
    const periodData = PREDEFINED_PERIODS.find(p => p.key === periodKey)
    if (periodData) {
      onDateRangeChange(periodData.getDates(), periodKey)
      setShowCustomRange(false)
    }
  }

  const formatDateRange = () => {
    if (!dateRange.from || !dateRange.to) return 'Wybierz okres'
    const from = dateRange.from.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
    const to = dateRange.to.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${from} – ${to}`
  }

  const getActiveLabel = () => {
    if (isCustomRange) return 'Własny zakres'
    const found = PREDEFINED_PERIODS.find(p => p.key === selectedPeriod)
    return found?.label || 'Wybierz'
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-3">
        {/* Period Pills - Stretch to fill */}
        <div className="flex-1 flex flex-wrap items-center gap-2">
          {PREDEFINED_PERIODS.map(p => {
            const isSelected = selectedPeriod === p.key && !isCustomRange
            return (
              <button
                key={p.key}
                onClick={() => handlePeriodSelect(p.key)}
                disabled={loading}
                className={`flex-1 min-w-[80px] px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 text-center ${isSelected
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                  : 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/60 hover:text-zinc-200'
                  } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {p.shortLabel}
              </button>
            )
          })}

          {/* Custom Range Toggle */}
          <button
            onClick={() => {
              if (!isCustomRange) {
                onDateRangeChange(dateRange, 'custom')
              }
              setShowCustomRange(!showCustomRange)
            }}
            disabled={loading}
            className={`flex-1 min-w-[80px] px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 ${isCustomRange
              ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
              : 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/60 hover:text-zinc-200'
              } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <Calendar size={12} />
            Własny
            <ChevronDown size={12} className={`transition-transform ${showCustomRange ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Right side: Date Range + Compare */}
        <div className="flex items-center gap-3">
          {/* Date Range Display */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 font-medium">Okres:</span>
            <span className="text-zinc-200 font-bold font-mono">{formatDateRange()}</span>
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-zinc-700/50 hidden sm:block" />

          {/* Compare Toggle */}
          <button
            onClick={() => onCompareModeChange(!compareMode)}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${compareMode
              ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
              : 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/60 hover:text-zinc-200'
              } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <ArrowLeftRight size={12} />
            Porównaj
            {compareMode && <Check size={12} />}
          </button>
        </div>
      </div>

      {/* Custom Range Inputs - Collapsible */}
      {showCustomRange && isCustomRange && (
        <div className="mt-3 pt-3 border-t border-zinc-800/50 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500">Od</label>
            <input
              type="date"
              value={dateRange.from?.toISOString().split('T')[0] || ''}
              onChange={(e) => onDateRangeChange({ ...dateRange, from: e.target.value ? new Date(e.target.value) : undefined }, 'custom')}
              disabled={loading}
              className="bg-zinc-900/50 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500">Do</label>
            <input
              type="date"
              value={dateRange.to?.toISOString().split('T')[0] || ''}
              onChange={(e) => onDateRangeChange({ ...dateRange, to: e.target.value ? new Date(e.target.value) : undefined }, 'custom')}
              disabled={loading}
              className="bg-zinc-900/50 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  )
}
