import { formatMoney } from '@/lib/utils/money'
import { memo } from 'react'
import { motion } from 'framer-motion'

interface EnvelopeProps {
    name: string
    icon: string
    spent: number
    planned: number
    current: number
    type: 'monthly' | 'yearly'
    id?: string
    onTransactionClick?: (envelopeId: string, envelopeName: string, envelopeIcon: string) => void
    variant?: 'card' | 'list'
    isAccumulating?: boolean
    envelopeType?: string  // 'savings', 'goal', 'emergency', 'budget'
}

export const EnvelopeCard = memo(function EnvelopeCard({
    name, icon, spent, planned, current, type, id, onTransactionClick, variant = 'card', isAccumulating = false, envelopeType
}: EnvelopeProps) {
    const isFreedomFunds = name.toLowerCase().includes('wolne środki')
    // Tylko koperty typu 'savings' (jak IKE) pokazują spent (wpłaty na oszczędności)
    // Pozostałe yearly (goal, emergency) pokazują current (stan koperty)
    const isSavingsType = envelopeType === 'savings'
    const displayValue = type === 'monthly' ? spent : (isSavingsType ? spent : current)
    const percentage = isFreedomFunds
        ? 0
        : type === 'monthly'
            ? (planned > 0 ? Math.round((spent / planned) * 100) : 0)
            : (planned > 0 ? Math.round((displayValue / planned) * 100) : 0)
    const remaining = isFreedomFunds
        ? 0
        : Math.round(((planned - displayValue) * 100)) / 100
    const isOverBudget = type === 'monthly' && spent > planned && !isFreedomFunds

    const getProgressGradient = () => {
        if (type === 'monthly') {
            if (percentage > 100) return 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)'
            if (percentage > 85) return 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)'
            return 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
        } else {
            if (isFreedomFunds) return 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)'
            if (percentage >= 100) return 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
            if (percentage >= 75) return 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)'
            if (percentage >= 50) return 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)'
            return 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)'
        }
    }

    const getGlowColor = () => {
        if (type === 'monthly') {
            if (percentage > 100) return 'rgba(239, 68, 68, 0.4)'
            if (percentage > 85) return 'rgba(245, 158, 11, 0.4)'
            return 'rgba(16, 185, 129, 0.4)'
        } else {
            if (percentage >= 100) return 'rgba(16, 185, 129, 0.4)'
            return 'rgba(99, 102, 241, 0.4)'
        }
    }

    const handleClick = () => {
        if (id && onTransactionClick) onTransactionClick(id, name, icon)
    }

    if (variant === 'list') {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={id && onTransactionClick ? { scale: 1.01, backgroundColor: 'rgba(30, 41, 59, 0.8)' } : {}}
                onClick={handleClick}
                className={`flex items-center gap-4 p-3 rounded-xl mb-2 relative overflow-hidden transition-colors ${id && onTransactionClick ? 'cursor-pointer' : ''}`}
                style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}
            >
                {/* Progress Background */}
                {!isFreedomFunds && percentage > 0 && (
                    <div
                        className="absolute bottom-0 left-0 h-[2px] transition-all duration-1000"
                        style={{
                            width: `${Math.min(percentage, 100)}%`,
                            background: getProgressGradient(),
                            opacity: 0.7
                        }}
                    />
                )}

                {/* Icon & Name */}
                <div className="flex items-center gap-3 w-[25%] min-w-[140px]">
                    <span className="text-xl flex-shrink-0">{icon}</span>
                    <span className="font-medium text-slate-200 truncate">{name}</span>
                </div>

                {/* Amounts (Central) */}
                <div className="flex flex-col items-center justify-center w-[35%]">
                    <div className={`${isOverBudget ? 'text-rose-400' : 'text-white'} font-bold`}>
                        {formatMoney(displayValue, false)}
                    </div>
                    {!isFreedomFunds && (
                        <div className="text-xs text-slate-500">
                            / {formatMoney(planned, false)}
                        </div>
                    )}
                </div>

                {/* Status & Percentage (Right) */}
                <div className="flex flex-col items-end w-[40%] gap-0.5">
                    <div className="text-xs text-slate-400 text-right">
                        {isFreedomFunds
                            ? 'Dostępne'
                            : isOverBudget
                                ? 'Przekroczono'
                                : type === 'monthly' ? 'Zostało' : 'Brakuje'}
                        <span className={`ml-1 font-medium ${isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {isFreedomFunds
                                ? ''
                                : formatMoney(Math.abs(remaining), false)}
                        </span>
                    </div>
                    {!isFreedomFunds && (
                        <div className={`text-xs font-bold ${percentage > 100 ? 'text-rose-500' :
                            percentage > 85 ? 'text-amber-500' : 'text-emerald-500'
                            }`}>
                            {percentage}%
                        </div>
                    )}
                </div>
            </motion.div >
        )
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={id && onTransactionClick ? {
                scale: 1.02,
                y: -4,
                transition: { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }
            } : {}}
            whileTap={id && onTransactionClick ? { scale: 0.98 } : {}}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            onClick={handleClick}
            className={`
                relative p-4 rounded-xl overflow-hidden
                ${id && onTransactionClick ? 'cursor-pointer' : ''}
            `}
            style={{
                background: 'rgba(30, 41, 59, 0.6)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: isOverBudget
                    ? '1px solid rgba(239, 68, 68, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isOverBudget
                    ? '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 20px rgba(239, 68, 68, 0.2)'
                    : '0 4px 16px rgba(0, 0, 0, 0.4)',
            }}
        >
            {/* Hover glow overlay */}
            <motion.div
                className="absolute inset-0 opacity-0 pointer-events-none"
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{
                    background: `radial-gradient(circle at 50% 50%, ${getGlowColor()} 0%, transparent 70%)`,
                }}
            />

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <motion.span
                            className="text-2xl"
                            whileHover={{ scale: 1.2, rotate: 10 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                            {icon}
                        </motion.span>
                        <span className="font-medium text-sm text-slate-200 truncate">
                            {name}
                        </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <div className={`text-base font-bold whitespace-nowrap ${isOverBudget ? 'text-rose-400' : 'text-white'
                            }`}>
                            {isFreedomFunds ? formatMoney(current) : formatMoney(displayValue, false)}
                        </div>
                        {!isFreedomFunds && (
                            <div className="text-xs text-slate-400">
                                / {formatMoney(planned, false)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                {!isFreedomFunds && (
                    <div className="mb-3">
                        <div
                            className="w-full h-2 rounded-full overflow-hidden"
                            style={{ background: 'rgba(51, 65, 85, 0.5)' }}
                        >
                            <motion.div
                                className="h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(percentage, 100)}%` }}
                                transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
                                style={{
                                    background: getProgressGradient(),
                                    boxShadow: `0 0 12px ${getGlowColor()}`,
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className={`text-xs flex justify-between items-center ${percentage > 100
                    ? 'text-rose-400'
                    : percentage > 85
                        ? 'text-amber-400'
                        : 'text-slate-400'
                    }`}>
                    <span>
                        {isFreedomFunds
                            ? '✨ Dostępne środki'
                            : type === 'monthly'
                                ? (isOverBudget
                                    ? `⚠️ Przekroczono o ${formatMoney(Math.round((spent - planned) * 100) / 100, false)}`
                                    : (name === 'Fundusz Awaryjny' || name === 'Budowanie Przyszłości'
                                        ? `📊 Brakuje ${formatMoney(Math.abs(remaining), false)}`
                                        : `💰 Zostało ${formatMoney(remaining, false)}`
                                    )
                                )
                                : (percentage >= 100
                                    ? `🎉 Zebrano! +${formatMoney(Math.abs(remaining), false)}`
                                    : `📈 Brakuje ${formatMoney(Math.abs(remaining), false)}`
                                )
                        }
                    </span>
                    {!isFreedomFunds && (
                        <motion.span
                            className="font-bold text-sm"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                            style={{
                                background: percentage >= 100
                                    ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                                    : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            {percentage.toFixed(0)}%
                        </motion.span>
                    )}
                </div>
            </div>
        </motion.div>
    )
})