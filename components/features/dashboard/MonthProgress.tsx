'use client'

import { useMemo } from 'react'

interface MonthProgressProps {
  totalIncome: number
  totalExpenses: number
  daysLeft: number
  currentDay: number
  totalDays: number
}

export function MonthProgress({
  totalIncome,
  totalExpenses,
  currentDay,
  totalDays
}: MonthProgressProps) {
  const progressData = useMemo(() => {
    const monthProgress = Math.round((currentDay / totalDays) * 100)
    const expenseProgress = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0
    const avgDailyExpenses = currentDay > 0 ? totalExpenses / currentDay : 0
    const projectedExpenses = avgDailyExpenses * totalDays
    const budgetStatus = expenseProgress > 100 ? 'over' :
      expenseProgress > 80 ? 'warning' : 'good'

    return {
      monthProgress,
      expenseProgress,
      avgDailyExpenses,
      projectedExpenses,
      budgetStatus
    }
  }, [totalIncome, totalExpenses, currentDay, totalDays])

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          📅 Postęp Miesiąca
        </h3>
        <span className="text-sm font-semibold text-slate-100">
          {currentDay}/{totalDays} dni ({progressData.monthProgress}%)
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 bg-slate-700 rounded-xl overflow-hidden relative">
        <div
          className="h-full bg-blue-500 rounded-xl transition-all duration-300 relative"
          style={{ width: `${progressData.monthProgress}%` }}
        >
          <div className="absolute inset-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-xl" />
        </div>
      </div>
    </div>
  )
}
