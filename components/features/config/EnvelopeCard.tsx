'use client'

import { motion } from 'framer-motion'
import { Edit2 } from 'lucide-react'
import { formatMoney } from '@/lib/utils/money'

interface Envelope {
    id: string
    name: string
    icon: string | null
    plannedAmount: number
    currentAmount: number
    group?: string
    type: 'monthly' | 'yearly'
}

interface EnvelopeCardProps {
    envelope: Envelope
    onClick: (envelope: Envelope) => void
}

export function EnvelopeCard({ envelope, onClick }: EnvelopeCardProps) {
    const percentage = envelope.plannedAmount > 0
        ? Math.min((envelope.currentAmount / envelope.plannedAmount) * 100, 100)
        : 0

    return (
        <motion.div
            layoutId={`envelope-${envelope.id}`}
            onClick={() => onClick(envelope)}
            className="glass-card-static group p-4 cursor-pointer relative overflow-hidden border border-white/5 hover:border-indigo-500/30 hover:bg-slate-800/60 transition-all duration-300"
            whileHover={{ y: -2 }}
        >
            {/* Hover Gradient Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-xl shadow-inner border border-white/5 group-hover:border-indigo-500/20 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-all duration-300">
                        {envelope.icon || '📦'}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-200 group-hover:text-white transition-colors">{envelope.name}</h3>
                        <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                            {envelope.type === 'yearly' ? 'Koperta roczna' : 'Koperta miesięczna'}
                        </p>
                    </div>
                </div>

                <button className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-indigo-500 hover:text-white">
                    <Edit2 size={14} />
                </button>
            </div>

            <div className="relative z-10 mt-4">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Limit</span>
                    <span className="text-sm font-bold text-white font-mono">{formatMoney(envelope.plannedAmount)}</span>
                </div>

                {/* Simple progress bar visual */}
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full ${envelope.type === 'yearly' ? 'bg-purple-500' : 'bg-blue-500'}`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        </motion.div>
    )
}
