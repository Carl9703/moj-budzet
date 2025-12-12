'use client'

import { useState } from 'react'
import { Calendar, CalendarDays, TrendingUp, CalendarRange } from 'lucide-react'
import type { DateRange } from '@/lib/types'

interface GlobalFiltersProps {
  dateRange: DateRange
  compareMode: boolean
  onDateRangeChange: (range: DateRange) => void
  onCompareModeChange: (enabled: boolean) => void
  loading?: boolean
}

const PREDEFINED_PERIODS = [
  { key: 'currentMonth', label: 'Obecny miesiąc', icon: Calendar, getDates: () => ({ from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), to: new Date() }) },
  { key: 'previousMonth', label: 'Poprzedni miesiąc', icon: CalendarDays, getDates: () => ({ from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), to: new Date(new Date().getFullYear(), new Date().getMonth(), 0) }) },
  { key: 'last3Months', label: 'Ostatnie 3 miesiące', icon: TrendingUp, getDates: () => ({ from: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1), to: new Date() }) },
  { key: 'last6Months', label: 'Ostatnie 6 miesięcy', icon: TrendingUp, getDates: () => ({ from: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1), to: new Date() }) },
  { key: 'currentYear', label: 'Ten rok', icon: CalendarRange, getDates: () => ({ from: new Date(new Date().getFullYear(), 0, 1), to: new Date() }) },
  { key: 'previousYear', label: 'Ubiegły rok', icon: CalendarRange, getDates: () => ({ from: new Date(new Date().getFullYear() - 1, 0, 1), to: new Date(new Date().getFullYear() - 1, 11, 31) }) }
]

export function GlobalFilters({ dateRange, compareMode, onDateRangeChange, onCompareModeChange, loading = false }: GlobalFiltersProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('currentMonth')
  const [isCustomRange, setIsCustomRange] = useState(false)

  const handlePeriodSelect = (periodKey: string) => {
    setSelectedPeriod(periodKey)
    setIsCustomRange(false)
    const period = PREDEFINED_PERIODS.find(p => p.key === periodKey)
    if (period) onDateRangeChange(period.getDates())
  }

  const formatDate = (date: Date | undefined) => date?.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }) || ''

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg mb-6">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">📅 Globalne Filtry</h2>
        <label className="text-sm font-medium text-slate-400 cursor-pointer flex items-center gap-2">
          <input type="checkbox" checked={compareMode} onChange={(e) => onCompareModeChange(e.target.checked)} disabled={loading} className="w-4 h-4 accent-indigo-500 cursor-pointer" />
          Porównaj z poprzednim okresem
        </label>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100 mb-3">Szybki wybór okresu</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {PREDEFINED_PERIODS.map(period => {
              const Icon = period.icon
              const isSelected = selectedPeriod === period.key && !isCustomRange
              return (
                <button key={period.key} onClick={() => handlePeriodSelect(period.key)} disabled={loading}
                  className={`p-3 rounded-lg border-2 flex items-center gap-2 text-sm font-medium transition-all ${isSelected ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-slate-600 bg-slate-700 text-slate-400 hover:border-slate-500'} ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <Icon size={16} /> {period.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <button onClick={() => { setIsCustomRange(!isCustomRange); if (!isCustomRange) setSelectedPeriod('custom') }} disabled={loading}
            className={`px-4 py-2 rounded-md border text-sm font-medium ${isCustomRange ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-slate-600 text-slate-400'} ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
            Niestandardowy zakres
          </button>
          {isCustomRange && (
            <div className="flex gap-3 items-center flex-wrap mt-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-400">Od</label>
                <input type="date" value={dateRange.from?.toISOString().split('T')[0] || ''} onChange={(e) => onDateRangeChange({ ...dateRange, from: e.target.value ? new Date(e.target.value) : undefined })} disabled={loading}
                  className="px-3 py-2 rounded-md border border-slate-600 bg-slate-900 text-slate-100 text-sm disabled:opacity-60" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-400">Do</label>
                <input type="date" value={dateRange.to?.toISOString().split('T')[0] || ''} onChange={(e) => onDateRangeChange({ ...dateRange, to: e.target.value ? new Date(e.target.value) : undefined })} disabled={loading}
                  className="px-3 py-2 rounded-md border border-slate-600 bg-slate-900 text-slate-100 text-sm disabled:opacity-60" />
              </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-700 rounded-lg border border-slate-600">
          <div className="text-sm text-slate-400 mb-1">Wybrany okres:</div>
          <div className="text-base font-semibold text-slate-100">
            {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
            {compareMode && <span className="ml-3 text-sm text-indigo-400 font-medium">+ Porównanie</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
