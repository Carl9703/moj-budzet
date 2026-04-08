'use client'

import { motion } from 'framer-motion'
import { Edit2, RotateCcw } from 'lucide-react'
import { formatMoney } from '@/lib/utils/money'

interface Envelope {
    id: string
    name: string
    icon: string | null
    plannedAmount: number
    currentAmount: number
    group?: string
    type: 'monthly' | 'yearly'
    currencyCode?: string
    fxPocket?: { currency: string; available: number; rateAvg: number } | null
}

interface EnvelopeCardProps {
    envelope: Envelope
    onClick: (envelope: Envelope) => void
    onRestore?: (envelope: Envelope) => void
}

export function EnvelopeCard({ envelope, onClick, onRestore }: EnvelopeCardProps) {
    const percentage = envelope.plannedAmount > 0
        ? Math.min((envelope.currentAmount / envelope.plannedAmount) * 100, 100)
        : 0

    return (
        <motion.div
            layoutId={`envelope-${envelope.id}`}
            onClick={() => onClick(envelope)}
            className="group relative p-5 rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-xl cursor-pointer transition-all duration-300 hover:bg-zinc-800/80 hover:border-white/10 shadow-xl overflow-hidden"
            whileHover={{ y: -4, scale: 1.02 }}
        >
            {/* Background Glow */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20 pointer-events-none ${envelope.type === 'yearly' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />

            <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900/80 border border-white/5 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                        {envelope.icon || '📦'}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-white truncate text-base tracking-tight">{envelope.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border ${envelope.type === 'yearly' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}>
                                {envelope.type === 'yearly' ? 'Roczna' : 'Miesięczna'}
                            </span>
                            {envelope.currencyCode && envelope.currencyCode !== 'PLN' && (
                                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border bg-sky-500/10 text-sky-400 border-sky-500/20">
                                    {envelope.currencyCode}
                                </span>
                            )}
                            {envelope.fxPocket && (
                                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border bg-amber-500/10 text-amber-400 border-amber-500/20">
                                    {envelope.fxPocket.available.toFixed(2)} {envelope.fxPocket.currency}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0">
                    {onRestore ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onRestore(envelope)
                            }}
                            className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all active:scale-90"
                            title="Przywróć kopertę"
                        >
                            <RotateCcw size={18} />
                        </button>
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-white/5 text-zinc-500 flex items-center justify-center group-hover:bg-amber-500/20 group-hover:text-amber-400 transition-all">
                            <Edit2 size={16} />
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 mt-4 pt-3 border-t border-white/5">
                {/* Just the amount - no label needed */}
                <div className="text-right mb-2">
                    <span className="text-xl font-black text-white tracking-tighter tabular-nums">
                        {envelope.plannedAmount.toLocaleString('pl-PL')} <span className="text-xs text-zinc-500 ml-0.5">zł</span>
                    </span>
                </div>
            </div>
        </motion.div>
    )
}
