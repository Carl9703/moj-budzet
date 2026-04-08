import { formatMoney } from '@/lib/utils/money'
import { memo } from 'react'
import React from 'react'
import { motion } from 'framer-motion'

interface FxPocket {
    currency: string
    available: number
    rateAvg?: number
}

type FxPockets = FxPocket[] | null

interface EnvelopeProps {
    name: string
    icon: string
    spent: number
    planned: number
    current: number
    type: 'monthly' | 'yearly'
    id?: string
    onTransactionClick?: (envelopeId: string, envelopeName: string, envelopeIcon: string) => void
    onExchangeClick?: (envelopeId: string, envelopeName: string, balance: number) => void
    variant?: 'card' | 'list'
    isAccumulating?: boolean
    envelopeType?: string  // 'savings', 'goal', 'emergency', 'budget'
    group?: string
    fxPocket?: FxPockets
    currencyCode?: string
}

export const EnvelopeCard = memo(function EnvelopeCard({
    name, icon, spent, planned, current, type, id, onTransactionClick, onExchangeClick, variant = 'card', isAccumulating = false, envelopeType, group, fxPocket, currencyCode
}: EnvelopeProps) {
    const isFreedomFunds = name.toLowerCase().includes('wolne środki')
    // Tylko koperty typu 'savings' (jak IKE) pokazują spent (wpłaty na oszczędności)
    // Pozostałe yearly (goal, emergency) pokazują current (stan koperty)
    const isSavingsType = envelopeType === 'savings'
    const displayValue = type === 'monthly' ? spent : (isSavingsType ? spent : current)

    // Wolne PLN = current minus ekwiwalent PLN wszystkich lotów FX
    const fxPlnEquivalent = fxPocket
        ? fxPocket.reduce((s, p) => s + p.available * (p.rateAvg ?? 0), 0)
        : 0
    const freePLN = Math.max(0, Math.round((current - fxPlnEquivalent) * 100) / 100)
    const hasFxPockets = !!fxPocket && fxPocket.length > 0

    // --- PROGRESS BAR LOGIC ---
    // Monthly: bar GROWS as you spend (0% = nothing spent, 100% = all spent)
    // Yearly/Goals: bar GROWS as you save (0% = nothing saved, 100% = goal reached)
    const spentPercentage = isFreedomFunds
        ? 0
        : (planned > 0 ? Math.round((spent / planned) * 100) : 0)

    const progressPercentage = type === 'monthly'
        ? (isFreedomFunds ? 0 : (planned > 0 ? (spent / planned) * 100 : 0))
        : (planned > 0 ? (displayValue / planned) * 100 : 0)

    const remaining = isFreedomFunds
        ? 0
        : Math.round(((planned - displayValue) * 100)) / 100

    // Logic for "Paid" state: we hit the target exactly.
    const isPaid = spentPercentage === 100 && type === 'monthly'

    // --- COLOR THRESHOLDS ---
    // Monthly: green (safe) → amber (warning) → red (danger) → pulsing red (overspent)
    // Yearly/Goals: blue-purple gradient → gold when completed
    const getProgressStyle = () => {
        if (type === 'monthly') {
            if (progressPercentage > 100) return {
                background: 'linear-gradient(90deg, #ef4444, #f87171)',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
            }
            if (progressPercentage >= 90) return {
                background: 'linear-gradient(90deg, #f87171, #ef4444)',
                boxShadow: '0 0 12px rgba(239, 68, 68, 0.3)',
            }
            if (progressPercentage >= 70) return {
                background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                boxShadow: '0 0 8px rgba(245, 158, 11, 0.2)',
            }
            return {
                background: 'linear-gradient(90deg, #10b981, #059669)',
                boxShadow: 'none',
            }
        } else {
            // Yearly/Goals: Growing gradients
            if (progressPercentage >= 100) {
                return {
                    background: 'linear-gradient(90deg, #FCD34D 0%, #F59E0B 100%)',
                    boxShadow: '0 0 15px rgba(245, 158, 11, 0.5)',
                }
            }
            return {
                background: 'linear-gradient(90deg, #92400e 0%, #d97706 50%, #f59e0b 100%)',
                boxShadow: 'none',
            }
        }
    }

    // Text color for percentage
    const getPercentageColor = () => {
        if (type === 'monthly') {
            if (progressPercentage > 100) return 'text-red-400'
            if (progressPercentage >= 90) return 'text-red-400'
            if (progressPercentage >= 70) return 'text-amber-400'
            return 'text-emerald-400'
        }
        return progressPercentage >= 100 ? 'text-amber-400' : 'text-zinc-300'
    }

    // Status dot color
    const getStatusDotColor = () => {
        if (type !== 'monthly') return ''
        if (progressPercentage > 100) return 'bg-red-500 shadow-[0_0_8px] shadow-red-500/50'
        if (progressPercentage >= 90) return 'bg-red-500 shadow-[0_0_8px] shadow-red-500/50'
        if (progressPercentage >= 70) return 'bg-amber-500 shadow-[0_0_8px] shadow-amber-500/50'
        return 'bg-emerald-500 shadow-[0_0_8px] shadow-emerald-500/50'
    }

    const progressStyle = getProgressStyle()
    const visualWidth = Math.max(0, Math.min(100, progressPercentage))
    const displayPercentage = Math.round(progressPercentage)

    const handleClick = () => {
        if (id && onTransactionClick) onTransactionClick(id, name, icon)
    }

    const handleExchangeClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (id && onExchangeClick) onExchangeClick(id, name, current)
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={id && onTransactionClick ? {
                scale: 1.02,
                y: -2,
                transition: { duration: 0.2 }
            } : {}}
            whileTap={id && onTransactionClick ? { scale: 0.98 } : {}}
            onClick={handleClick}
            className={`
                relative pt-4 px-4 pb-0 rounded-3xl overflow-hidden flex flex-col justify-between h-[175px]
                ${id && onTransactionClick ? 'cursor-pointer' : ''}
                bg-zinc-900/50 backdrop-blur-xl border border-white/5 transition-all
                ${isPaid ? 'bg-zinc-950/80 border-white/10' : 'shadow-lg shadow-black/30'}
                ${progressPercentage > 100 && type === 'monthly' ? 'border-red-500/20' : ''}
            `}
        >
            {/* Header: Icon + Name */}
            <div className={`flex items-start justify-between mb-1 relative z-10 ${isPaid ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl shrink-0">{icon}</span>
                    <div className="min-w-0">
                        <span className="font-bold text-[11px] text-zinc-500 uppercase tracking-widest truncate max-w-[140px] block">
                            {name}
                        </span>
                        {fxPocket && fxPocket.length > 0 && (
                            <span className="text-[9px] font-black text-amber-400 tracking-widest">
                                {fxPocket.map(p => `${p.available.toFixed(2)} ${p.currency}`).join(' · ')}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {/* Wymień walutę button — tylko dla PLN-kopert z saldem */}
                    {onExchangeClick && id && currencyCode === 'PLN' && current > 0 && (
                        <button
                            onClick={handleExchangeClick}
                            className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center hover:bg-amber-500/30 transition-all text-[10px]"
                            title="Wymień walutę"
                        >
                            💱
                        </button>
                    )}
                    {/* Status Indicator */}
                    {isPaid ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <div className="text-emerald-500 text-[10px]">✓</div>
                        </div>
                    ) : (
                        spentPercentage < 100 && type === 'monthly' && (
                            <div className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor()}`} />
                        )
                    )}
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 flex flex-col justify-center relative z-10 mb-3">
                {isPaid ? (
                    /* PAID STATE - Centered */
                    <div className="flex flex-col items-center justify-center -mt-1">
                        <div className="mb-1 p-2 rounded-full border-2 border-emerald-500/30 text-emerald-500/60">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                            OPŁACONE
                        </span>
                    </div>
                ) : (
                    /* NORMAL STATE */
                    <div className="flex flex-col w-full">
                        {type === 'monthly' ? (
                            /* MONTHLY LAYOUT - Centered */
                            <div className="flex flex-col items-center w-full">
                                <div className="flex items-center gap-1.5">
                                    <div className="money text-3xl font-black tracking-tighter text-white flex items-center">
                                        {remaining < 0 && <span className="text-red-400 mr-1">-</span>}
                                        {formatMoney(Math.abs(remaining), false)}
                                    </div>
                                    <span className="text-lg font-bold text-zinc-500 self-end mb-1">zł</span>
                                    {remaining < 0 && (
                                        <div className="w-5 h-5 rounded-full bg-red-400/20 flex items-center justify-center ml-1 animate-pulse">
                                            <span className="text-red-400 text-[10px] font-bold">!</span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">
                                    DOSTĘPNE
                                </div>
                            </div>
                        ) : isFreedomFunds ? (
                            /* WOLNE ŚRODKI - Clean balance display */
                            <div className="w-full flex flex-col items-center">
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-1.5">
                                        <div className="money text-3xl font-black tracking-tighter text-amber-400">
                                            {formatMoney(current, false)}
                                        </div>
                                        <span className="text-lg font-bold text-zinc-500 self-end mb-1">zł</span>
                                    </div>
                                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">
                                        Saldo
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* GOAL/YEARLY LAYOUT - Centered */
                            <div className="w-full flex flex-col items-center">
                                {/* "Cel Osiągnięty" Banner */}
                                {progressPercentage >= 100 && (
                                    <div className="flex items-center gap-1 mb-0.5 text-amber-400">
                                        <span className="text-sm">🎉</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">
                                            Cel Osiągnięty!
                                        </span>
                                    </div>
                                )}

                                {hasFxPockets ? (
                                    <div className="flex flex-col items-center gap-0.5">
                                        {/* Środek: wolne PLN */}
                                        <div className="flex items-baseline gap-1">
                                            <span className="money text-3xl font-black tracking-tighter text-white">{formatMoney(freePLN, false)}</span>
                                            <span className="text-lg font-bold text-zinc-500">zł</span>
                                        </div>
                                        <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Wolne PLN</div>
                                        {/* Dół: łączna wartość po kursie zakupu */}
                                        <div className="text-[9px] font-bold text-zinc-500 mt-0.5">
                                            Łącznie: <span className="text-zinc-400">{formatMoney(current, false)} zł</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`money text-3xl font-black tracking-tighter ${progressPercentage >= 100 ? 'text-amber-400' : 'text-white'}`}>
                                                {formatMoney(displayValue, false)}
                                            </div>
                                            <span className="text-lg font-bold text-zinc-500 self-end mb-1">zł</span>
                                        </div>
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">
                                            Uzbierano
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer: Progress Bar & Stats — hidden for Wolne Środki */}
            {!isFreedomFunds && (
                <div className={`mt-auto relative z-10 ${isPaid ? 'opacity-40 grayscale' : ''}`}>
                    <div className="flex justify-between items-end text-[12px] font-bold text-zinc-400 mb-4 uppercase tracking-wider px-1">
                        {/* Left text: Monthly = Spent/Limit, Yearly = Goal: X */}
                        <span>
                            {type === 'monthly' ? (
                                <>
                                    <span className="text-zinc-600">Wydano: </span>
                                    <span className={progressPercentage >= 90 ? 'text-red-400' : progressPercentage >= 70 ? 'text-amber-400' : ''}>
                                        {formatMoney(displayValue, false)}
                                    </span>
                                    <span className="text-zinc-600"> / {formatMoney(planned, false)} zł</span>
                                </>
                            ) : (
                                <span className="text-zinc-500">
                                    Cel: <span className="text-zinc-400">{formatMoney(planned, false)} zł</span>
                                </span>
                            )}
                        </span>

                        {/* Right text: Percentage */}
                        <span className={getPercentageColor()}>
                            {displayPercentage}%
                        </span>
                    </div>

                    {/* Progress Bar Container - Full Width Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-2.5 bg-zinc-800/80 rounded-b-3xl overflow-hidden">
                        <motion.div
                            className={`h-full ${progressPercentage > 100 && type === 'monthly' ? 'animate-pulse' : ''}`}
                            style={{
                                width: `${visualWidth}%`,
                                ...progressStyle,
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${visualWidth}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        />
                    </div>
                </div>
            )}
        </motion.div >
    )
})