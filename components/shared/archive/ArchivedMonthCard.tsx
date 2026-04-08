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
  // Fix savings rate calculation - cap between -100 and 100
  const rawSavingsRate = monthData.income > 0 ? (monthData.balance / monthData.income) * 100 : 0
  const savingsRate = Math.max(-100, Math.min(100, Math.round(rawSavingsRate)))
  const isPositiveBalance = monthData.balance >= 0
  const isGoodSavings = savingsRate >= 20
  const isWarningSavings = savingsRate >= 10 && savingsRate < 20

  const getStatusColor = () => {
    if (isGoodSavings) return 'text-emerald-400'
    if (isWarningSavings) return 'text-amber-400'
    return 'text-rose-400'
  }

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="p-0 cursor-pointer overflow-hidden group relative rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-xl shadow-xl transition-all duration-300"
    >
      {/* Subtle background glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-10 -mr-10 -mt-10 ${isGoodSavings ? 'bg-emerald-500' : isWarningSavings ? 'bg-amber-500' : 'bg-rose-500'
        }`} />

      <div className="p-6 relative z-10">
        {/* Header - simplified without status badge */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <Calendar size={20} className="text-amber-400" />
              {monthData.month} <span className="text-zinc-500">{monthData.year}</span>
            </h3>
          </div>

          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50 group-hover:bg-amber-600 group-hover:text-white transition-all duration-500 transform group-hover:rotate-45 shadow-inner">
            <ArrowRight size={18} />
          </div>
        </div>

        {/* Main metrics */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Income */}
          <div className="bg-zinc-800/50 p-3 rounded-xl border border-white/5 text-center group-hover:border-emerald-500/20 transition-colors">
            <div className="flex items-center justify-center gap-1.5 mb-1 text-emerald-400">
              <TrendingUp size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Przychody</span>
            </div>
            <div className="text-base font-bold text-white">
              +{formatMoney(monthData.income)}
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-zinc-800/50 p-3 rounded-xl border border-white/5 text-center group-hover:border-rose-500/20 transition-colors">
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
        <div className="p-5 mb-4 rounded-3xl border border-white/5 bg-zinc-950/40 shadow-inner">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
              <DollarSign size={14} className="text-zinc-600" />
              Bilans
            </div>
            <div className={`text-xl font-black tabular-nums tracking-tighter ${isPositiveBalance ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositiveBalance ? '+' : ''}{formatMoney(monthData.balance)}
            </div>
          </div>

          <div className="w-full bg-zinc-900/50 h-2 rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full ${isGoodSavings ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                isWarningSavings ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                  'bg-gradient-to-r from-rose-600 to-rose-400'
                }`}
            />
          </div>
          <div className="flex justify-between items-center mt-3">
            <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Stopa oszczędności</span>
            <div className="flex items-center gap-1">
              <span className={`text-sm font-black ${getStatusColor()}`}>{savingsRate}%</span>
              {savingsRate >= 20 && <span className="text-xs">🚀</span>}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
