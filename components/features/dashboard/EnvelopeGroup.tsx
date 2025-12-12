'use client'

import { EnvelopeCard } from '@/components/ui/EnvelopeCard'
import { motion } from 'framer-motion'

interface Envelope {
    id: string
    name: string
    icon: string
    spent: number
    planned: number
    current: number
    activityCount?: number
    group?: string
    envelopeType?: 'monthly' | 'yearly'
}

interface Props {
    title: string
    icon: string
    color: string
    envelopes: Envelope[]
    type: 'monthly' | 'yearly'
    onEnvelopeClick?: (envelopeId: string, envelopeName: string, envelopeIcon: string) => void
}

export function EnvelopeGroup({ title, icon, color, envelopes, type, onEnvelopeClick }: Props) {
    if (envelopes.length === 0) return null

    const monthlyEnvelopes = envelopes.filter(e => (e.envelopeType || type) === 'monthly')
    const yearlyEnvelopes = envelopes.filter(e => (e.envelopeType || type) === 'yearly')

    const totalAvailable = yearlyEnvelopes.reduce((sum, envelope) => sum + envelope.current, 0)
    const totalPlanned = envelopes.reduce((sum, envelope) => sum + envelope.planned, 0)
    const totalSpent = monthlyEnvelopes.reduce((sum, envelope) => sum + envelope.spent, 0)

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount)
    }

    const displayAmount = monthlyEnvelopes.length > 0 && yearlyEnvelopes.length > 0
        ? formatMoney(totalSpent + totalAvailable)
        : type === 'monthly' ? formatMoney(totalSpent) : formatMoney(totalAvailable)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            className="group"
        >
            {/* Header */}
            <div
                className="flex items-center justify-between mb-4 px-5 py-3.5 rounded-2xl relative overflow-hidden transition-all duration-300 group-hover:translate-y-px"
                style={{
                    background: 'var(--glass-bg-light)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid var(--glass-border)',
                    boxShadow: 'var(--shadow-sm)',
                }}
            >
                {/* Header Hover Gradient */}
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                        background: `linear-gradient(90deg, ${color} 0%, transparent 100%)`,
                    }}
                />

                <div className="flex items-center gap-3 relative z-10">
                    <div
                        className="flex items-center justify-center w-10 h-10 rounded-xl text-xl backdrop-blur-md shadow-inner"
                        style={{
                            background: color,
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                    >
                        {icon}
                    </div>
                    <h2 className="text-lg font-bold text-white tracking-tight">
                        {title}
                    </h2>
                </div>

                <div
                    className="text-sm font-bold px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/5 shadow-sm relative z-10"
                    style={{ background: 'rgba(0, 0, 0, 0.2)' }}
                >
                    <span className="text-slate-400 font-medium mr-2 text-xs uppercase tracking-wider">Suma</span>
                    <span className="text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                        {displayAmount}
                    </span>
                </div>
            </div>

            {/* Grid */}
            <div className="grid gap-3">
                {envelopes.map((envelope, index) => (
                    <motion.div
                        key={envelope.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <EnvelopeCard
                            {...envelope}
                            type={envelope.envelopeType || type}
                            onTransactionClick={onEnvelopeClick}
                        />
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}
