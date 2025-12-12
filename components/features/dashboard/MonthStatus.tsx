import { memo } from 'react'
import { motion } from 'framer-motion'

interface Props {
    totalIncome: number
    totalExpenses: number
    daysLeft: number
    onCloseMonth: () => void
    previousMonthStatus: {
        isClosed: boolean
        monthName: string
        monthStr: string
    }
    currentDay: number
    totalDays: number
    isMonthClosed?: boolean
}

export const MonthStatus = memo(function MonthStatus({
    totalIncome,
    totalExpenses,
    daysLeft,
    onCloseMonth,
    previousMonthStatus,
    currentDay,
    totalDays,
    isMonthClosed
}: Props) {
    const balance = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0
    const monthProgress = (currentDay / totalDays) * 100

    const canCloseMonth = () => {
        if (isMonthClosed || previousMonthStatus.isClosed) return false
        return daysLeft <= 3 || currentDay <= 3
    }

    const monthName = new Date().toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })

    const formatMoney = (val: number) => val.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-4"
            style={{
                background: 'rgba(30, 41, 59, 0.7)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
        >
            {/* Header row */}
            <div className="flex justify-between items-center mb-3">
                <div>
                    <h2 className="text-lg font-bold text-white capitalize">{monthName}</h2>
                    <p className="text-[10px] text-slate-400">Dzień {currentDay}/{totalDays}</p>
                </div>

                {canCloseMonth() ? (
                    <button
                        onClick={onCloseMonth}
                        className="px-4 py-2 rounded-lg text-xs font-semibold"
                        style={{ background: 'var(--gradient-primary)' }}
                    >
                        Zamknij
                    </button>
                ) : (
                    <span className="text-xs text-slate-500">
                        {isMonthClosed ? '✓ Zamknięty' : `Za ${Math.max(0, daysLeft - 3)} dni`}
                    </span>
                )}
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full mb-4" style={{ background: 'rgba(51, 65, 85, 0.5)' }}>
                <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${monthProgress}%` }}
                    transition={{ duration: 1 }}
                    style={{
                        background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                        boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)',
                    }}
                />
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-2 md:p-0 bg-slate-800/30 md:bg-transparent rounded-lg md:rounded-none">
                    <div className="text-[10px] text-slate-400 uppercase mb-0.5 tracking-wider font-medium">💰 Przychody</div>
                    <div className="text-lg md:text-xl font-bold text-emerald-400">+{formatMoney(totalIncome)}</div>
                </div>
                <div className="p-2 md:p-0 bg-slate-800/30 md:bg-transparent rounded-lg md:rounded-none">
                    <div className="text-[10px] text-slate-400 uppercase mb-0.5 tracking-wider font-medium">💸 Wydatki</div>
                    <div className="text-lg md:text-xl font-bold text-rose-400">-{formatMoney(totalExpenses)}</div>
                </div>
                <div className="p-2 md:p-0 bg-slate-800/30 md:bg-transparent rounded-lg md:rounded-none">
                    <div className="text-[10px] text-slate-400 uppercase mb-0.5 tracking-wider font-medium">📊 Bilans</div>
                    <div className={`text-lg md:text-xl font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {balance >= 0 ? '+' : ''}{formatMoney(balance)}
                    </div>
                </div>
                <div className="p-2 md:p-0 bg-slate-800/30 md:bg-transparent rounded-lg md:rounded-none">
                    <div className="text-[10px] text-slate-400 uppercase mb-0.5 tracking-wider font-medium">💎 Oszcz.</div>
                    <div className={`text-lg md:text-xl font-bold ${savingsRate >= 20 ? 'text-emerald-400' : savingsRate > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {savingsRate}%
                    </div>
                </div>
            </div>
        </motion.div>
    )
})