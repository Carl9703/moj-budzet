'use client'

import { TrendingUp, TrendingDown, DollarSign, Calendar, ArrowRight } from 'lucide-react'
import { formatMoney } from '@/lib/utils/money'
import { motion } from 'framer-motion'

interface MonthData {
  month: string
  year: number
  income: number
  expenses: number
  balance: number
  envelopes: Array<{
    name: string
    icon: string
    totalSpent: number
    percentage: number
  }>
  transfers: Array<{
    name: string
    icon: string
    amount: number
    percentage: number
  }>
}

interface ArchivedMonthCardProps {
  monthData: MonthData
  onClick: () => void
}

export function ArchivedMonthCard({ monthData, onClick }: ArchivedMonthCardProps) {
  const savingsRate = monthData.income > 0 ? Math.round((monthData.balance / monthData.income) * 100) : 0
  const isPositiveBalance = monthData.balance >= 0
  const isGoodSavings = savingsRate >= 20
  const isWarningSavings = savingsRate >= 10 && savingsRate < 20

  const getStatusColor = () => {
    if (isGoodSavings) return 'text-emerald-400'
    if (isWarningSavings) return 'text-amber-400'
    return 'text-rose-400'
  }

  const getStatusBgColor = () => {
    if (isGoodSavings) return 'bg-emerald-500/10 border-emerald-500/20'
    if (isWarningSavings) return 'bg-amber-500/10 border-amber-500/20'
    return 'bg-rose-500/10 border-rose-500/20'
  }

  const getStatusIcon = () => {
    if (isGoodSavings) return '🎉'
    if (isWarningSavings) return '⚡'
    return '⚠️'
  }

  const getStatusText = () => {
    if (isGoodSavings) return 'Świetny miesiąc'
    if (isWarningSavings) return 'Dobry miesiąc'
    return 'Wymaga uwagi'
  }

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="glass-card p-0 cursor-pointer overflow-hidden group relative"
    >
      {/* Background glow effect based on status */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-20 -mr-10 -mt-10 ${isGoodSavings ? 'bg-emerald-500' : isWarningSavings ? 'bg-amber-500' : 'bg-rose-500'
        }`} />

      <div className="p-6 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Calendar size={20} className="text-indigo-400" />
              {monthData.month} <span className="text-slate-500">{monthData.year}</span>
            </h3>
            <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full border ${getStatusBgColor()} ${getStatusColor()}`}>
              <span>{getStatusIcon()}</span>
              {getStatusText()}
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 transform group-hover:rotate-45">
            <ArrowRight size={16} />
          </div>
        </div>

        {/* Main metrics */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Income */}
          <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5 text-center group-hover:border-emerald-500/20 transition-colors">
            <div className="flex items-center justify-center gap-1.5 mb-1 text-emerald-400">
              <TrendingUp size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Przychody</span>
            </div>
            <div className="text-base font-bold text-white">
              +{formatMoney(monthData.income)}
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5 text-center group-hover:border-rose-500/20 transition-colors">
            <div className="flex items-center justify-center gap-1.5 mb-1 text-rose-400">
              <TrendingDown size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Wydatki</span>
            </div>
            <div className="text-base font-bold text-white">
              -{formatMoney(monthData.expenses)}
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="glass-card-static p-4 mb-4 border-white/5 bg-gradient-to-br from-slate-800/50 to-slate-900/50">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
              <DollarSign size={14} />
              Bilans
            </div>
            <div className={`text-xl font-bold ${isPositiveBalance ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositiveBalance ? '+' : ''}{formatMoney(monthData.balance)}
            </div>
          </div>

          <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden flex">
            {/* Simple savings bar visualization */}
            <div
              className={`h-full ${isGoodSavings ? 'bg-emerald-500' : isWarningSavings ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-[10px] text-slate-500 font-medium">Stopa oszczędności</span>
            <div className="flex items-center gap-1">
              <span className={`text-sm font-bold ${getStatusColor()}`}>{savingsRate}%</span>
              {savingsRate >= 20 && <span className="text-xs">🚀</span>}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-between text-xs text-slate-500 pt-3 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <span className="text-base">📦</span>
            <span className="font-medium text-slate-400">{monthData.envelopes.length}</span> kopert
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base">🔄</span>
            <span className="font-medium text-slate-400">{monthData.transfers.length}</span> transferów
          </div>
        </div>
      </div>
    </motion.div>
  )
}
