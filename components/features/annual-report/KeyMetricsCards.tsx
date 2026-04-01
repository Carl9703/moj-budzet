'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Wallet, CreditCard, PiggyBank, Percent } from 'lucide-react'
import { YearSummary } from '@/lib/api/annual-report'

interface KeyMetricsCardsProps {
    summary: YearSummary
    previousYearSummary?: YearSummary
    activeTab?: 'expenses' | 'income'
    onTabChange?: (tab: 'expenses' | 'income') => void
}

interface MetricCardProps {
    title: string
    value: number
    suffix: string
    monthlyAverage?: number
    previousValue?: number
    isPercentage?: boolean
    icon: React.ElementType
    color: string
    showSign?: boolean
    isClickable?: boolean
    isActive?: boolean
    onClick?: () => void
}

function MetricCard({ title, value, suffix, monthlyAverage, previousValue, isPercentage, icon: Icon, color, showSign = false, isClickable = false, isActive = false, onClick }: MetricCardProps) {
    // For percentage values: if value is already in % form (e.g., -67.3 meaning -67.3%), don't multiply
    // If it's a ratio (e.g., 0.08 meaning 8%), multiply by 100
    const isAlreadyPercentage = isPercentage && (Math.abs(value) > 1 || (previousValue !== undefined && Math.abs(previousValue) > 1))
    const displayValue = isPercentage ? (isAlreadyPercentage ? value : value * 100) : value
    const displayPrevious = isPercentage && previousValue !== undefined
        ? (isAlreadyPercentage ? previousValue : previousValue * 100)
        : previousValue
    const effectiveCurrent = displayValue
    const effectivePrevious = displayPrevious

    const change = effectivePrevious !== undefined ? effectiveCurrent - effectivePrevious : 0
    const changePercent = effectivePrevious && effectivePrevious !== 0 ? (change / Math.abs(effectivePrevious)) * 100 : 0

    const hasIncrease = change > 0
    const hasDecrease = change < 0
    const isNeutral = change === 0

    const formatNumber = (num: number) =>
        num.toLocaleString('pl-PL', { minimumFractionDigits: isPercentage ? 1 : 2, maximumFractionDigits: isPercentage ? 1 : 2 })

    const CardWrapper = isClickable ? 'button' : 'div'

    // For active state, use neutral accent (indigo) instead of semantic colors
    const activeAccent = 'border-indigo-500 shadow-indigo-500/20 bg-slate-800/80'
    const inactiveClickable = 'border-white/5 opacity-70 hover:opacity-100 hover:bg-slate-900/80'
    const inactiveNonClickable = 'border-white/5 hover:bg-slate-900/80'

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full"
        >
            <CardWrapper
                onClick={onClick}
                className={`group relative overflow-hidden p-5 rounded-3xl border bg-slate-900/50 backdrop-blur-xl transition-all duration-300 w-full h-full text-left flex flex-col ${isClickable ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''
                    } ${isActive
                        ? `border-2 ${activeAccent} shadow-lg`
                        : isClickable ? inactiveClickable : inactiveNonClickable
                    }`}
            >
                {/* Glow effect */}
                <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[60px] transition-opacity ${color} ${isActive ? 'opacity-25' : 'opacity-10 group-hover:opacity-15'}`} />

                {/* Active indicator - subtle dot, not aggressive badge */}
                {isActive && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                )}

                <div className="flex items-start justify-between mb-4 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-white' : 'text-slate-400'}`}>{title}</h3>
                            {/* Removed aggressive colored badge - just show clickable hint on hover */}
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                                {showSign && value > 0 ? '+' : ''}
                                {formatNumber(displayValue)}
                            </span>
                            <span className="text-base text-slate-500 font-medium">{suffix}</span>
                        </div>
                    </div>
                    <div className={`p-2.5 rounded-xl ${color.replace('bg-', 'bg-').replace('500', '500/10')} border border-white/5`}>
                        <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
                    </div>
                </div>

                <div className="relative z-10 space-y-2">
                    {monthlyAverage !== undefined && (
                        <div className="flex items-center justify-between text-xs py-1.5 border-t border-slate-700/30">
                            <span className="text-slate-500">Śr. mies.</span>
                            <span className="text-slate-300 font-medium tabular-nums">
                                {showSign && monthlyAverage > 0 ? '+' : ''}
                                {monthlyAverage.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {suffix}
                            </span>
                        </div>
                    )}

                    {effectivePrevious !== undefined && (
                        <div className="flex items-center gap-2 pt-0.5">
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${displayValue > 0 ? (
                                hasIncrease
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            ) : (
                                hasDecrease
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            )
                                }`}>
                                {hasIncrease && <TrendingUp size={10} />}
                                {hasDecrease && <TrendingDown size={10} />}
                                {isNeutral && <Minus size={10} />}
                                <span className="tabular-nums">
                                    {hasIncrease && '+'}{formatNumber(change)} {suffix}
                                </span>
                            </div>

                            {!isNeutral && changePercent !== 0 && (
                                <span className={`text-[10px] font-semibold tabular-nums ${displayValue > 0
                                    ? (hasIncrease ? 'text-emerald-500/80' : 'text-rose-500/80')
                                    : (hasDecrease ? 'text-rose-500/80' : 'text-emerald-500/80')
                                    }`}>
                                    {hasIncrease && '+'}{changePercent.toFixed(1)}%
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </CardWrapper>
        </motion.div>
    )
}

export function KeyMetricsCards({ summary, previousYearSummary, activeTab, onTabChange }: KeyMetricsCardsProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
                title="Przychody"
                value={summary.income}
                suffix="zł"
                monthlyAverage={summary.monthlyAverage.income}
                previousValue={previousYearSummary?.income}
                icon={Wallet}
                color="bg-emerald-500"
                showSign={true}
                isClickable={!!onTabChange}
                isActive={activeTab === 'income'}
                onClick={() => onTabChange?.('income')}
            />

            <MetricCard
                title="Wydatki"
                value={-summary.expenses}
                suffix="zł"
                monthlyAverage={-summary.monthlyAverage.expenses}
                previousValue={previousYearSummary?.expenses ? -previousYearSummary.expenses : undefined}
                icon={CreditCard}
                color="bg-rose-500"
                showSign={false}
                isClickable={!!onTabChange}
                isActive={activeTab === 'expenses'}
                onClick={() => onTabChange?.('expenses')}
            />

            <MetricCard
                title="Oszczędności"
                value={summary.savings}
                suffix="zł"
                monthlyAverage={summary.monthlyAverage.savings}
                previousValue={previousYearSummary?.savings}
                icon={PiggyBank}
                color="bg-indigo-500"
                showSign={true}
            />

            <MetricCard
                title="Stopa Oszcz."
                value={summary.savingsRate}
                suffix="%"
                previousValue={previousYearSummary?.savingsRate}
                isPercentage
                icon={Percent}
                color="bg-violet-500"
                showSign={false}
            />
        </div>
    )
}
