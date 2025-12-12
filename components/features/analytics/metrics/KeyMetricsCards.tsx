'use client'

import { TrendingUp, TrendingDown, Minus, DollarSign, CreditCard, Target, PiggyBank } from 'lucide-react'

interface MetricData {
  income: number
  expense: number
  balance: number
  savingsRate: number
}

interface KeyMetricsCardsProps {
  currentPeriod: MetricData
  previousPeriod?: MetricData
  compareMode: boolean
  loading?: boolean
}

export function KeyMetricsCards({ currentPeriod, previousPeriod, compareMode, loading = false }: KeyMetricsCardsProps) {
  const formatMoney = (amount: number | undefined) => (!amount || isNaN(amount)) ? '0 zł' : amount.toLocaleString('pl-PL') + ' zł'
  const formatPercentage = (value: number) => `${value >= 0 ? '+' : ''}${Math.abs(value) > 999 ? '999%+' : value.toFixed(1) + '%'}`
  const calculateChange = (current: number, previous: number) => previous === 0 ? 0 : ((current - previous) / previous) * 100
  const getChangeColor = (change: number, isExpense = true) => change === 0 ? 'text-slate-400' : (isExpense ? (change < 0 ? 'text-emerald-400' : 'text-rose-400') : (change > 0 ? 'text-emerald-400' : 'text-rose-400'))
  const getChangeIcon = (change: number) => change > 0 ? <TrendingUp size={16} /> : change < 0 ? <TrendingDown size={16} /> : <Minus size={16} />

  const metrics = [
    { title: 'Całkowity Przychód', value: currentPeriod.income, icon: DollarSign, colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', borderClass: 'border-t-emerald-400', change: compareMode && previousPeriod ? calculateChange(currentPeriod.income, previousPeriod.income) : undefined, isExpense: false },
    { title: 'Całkowity Wydatek', value: currentPeriod.expense, icon: CreditCard, colorClass: 'text-rose-400', bgClass: 'bg-rose-500/10', borderClass: 'border-t-rose-400', change: compareMode && previousPeriod ? calculateChange(currentPeriod.expense, previousPeriod.expense) : undefined, isExpense: true },
    { title: 'Bilans', value: currentPeriod.balance, icon: Target, colorClass: currentPeriod.balance >= 0 ? 'text-emerald-400' : 'text-rose-400', bgClass: currentPeriod.balance >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10', borderClass: currentPeriod.balance >= 0 ? 'border-t-emerald-400' : 'border-t-rose-400', change: compareMode && previousPeriod ? calculateChange(currentPeriod.balance, previousPeriod.balance) : undefined },
    { title: 'Stopa Oszczędności', value: currentPeriod.savingsRate, icon: PiggyBank, colorClass: currentPeriod.savingsRate >= 0 ? 'text-emerald-400' : 'text-rose-400', bgClass: currentPeriod.savingsRate >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10', borderClass: currentPeriod.savingsRate >= 0 ? 'border-t-emerald-400' : 'border-t-rose-400', change: compareMode && previousPeriod ? calculateChange(currentPeriod.savingsRate, previousPeriod.savingsRate) : undefined, isPercentage: true }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex flex-col items-center justify-center min-h-[140px]">
            <div className="w-10 h-10 bg-slate-700 rounded-full mb-3 animate-pulse" />
            <div className="w-4/5 h-4 bg-slate-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      {metrics.map(metric => {
        const Icon = metric.icon
        return (
          <div key={metric.title} className={`bg-slate-800 p-6 rounded-xl border border-slate-700 border-t-4 ${metric.borderClass} shadow-lg flex flex-col items-center justify-center min-h-[140px]`}>
            <div className={`w-12 h-12 rounded-full ${metric.bgClass} flex items-center justify-center mb-4 ${metric.colorClass}`}><Icon size={24} /></div>
            <h3 className="text-sm font-semibold text-slate-400 mb-2 text-center">{metric.title}</h3>
            <div className={`text-2xl font-bold ${metric.colorClass} mb-3 text-center`}>
              {metric.isPercentage ? `${(metric.value * 100).toFixed(1)}%` : formatMoney(metric.value)}
            </div>
            {compareMode && previousPeriod && metric.change !== undefined && (
              <div className="flex flex-col items-center gap-1 p-2 bg-slate-700 rounded-lg border border-slate-600">
                <div className={`flex items-center gap-1 text-xs font-semibold ${getChangeColor(metric.change, metric.isExpense)}`}>
                  {getChangeIcon(metric.change)} {formatPercentage(metric.change)}
                </div>
                <div className="text-slate-400 text-xs text-center">
                  Poprzednio: {metric.isPercentage ? `${((previousPeriod?.savingsRate || 0) * 100).toFixed(1)}%` : formatMoney(metric.title === 'Całkowity Przychód' ? previousPeriod?.income : metric.title === 'Całkowity Wydatek' ? previousPeriod?.expense : previousPeriod?.balance)}
                </div>
              </div>
            )}
            {metric.title === 'Stopa Oszczędności' && (
              <div className="w-full h-1.5 bg-slate-700 rounded-full mt-3 overflow-hidden">
                <div className={`h-full ${metric.colorClass.replace('text-', 'bg-')} rounded-full transition-all`} style={{ width: `${Math.max(0, Math.min(100, metric.value * 100))}%` }} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
