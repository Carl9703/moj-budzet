'use client'

import { EnvelopeCard } from '@/components/ui/EnvelopeCard'
import { motion } from 'framer-motion'

interface FxPocket {
    currency: string
    available: number
    rateAvg?: number
}

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
    isAccumulating?: boolean
    envelopeKind?: string  // 'savings', 'goal', 'emergency', 'budget'
    fxPocket?: FxPocket[] | null
    currencyCode?: string
}

interface Props {
    title: string
    icon: string
    color: string
    envelopes: Envelope[]
    type: 'monthly' | 'yearly'
    onEnvelopeClick?: (envelopeId: string, envelopeName: string, envelopeIcon: string) => void
    onExchangeClick?: (envelopeId: string, envelopeName: string, balance: number) => void
}

export function EnvelopeGroup({ title, icon, color, envelopes, type, onEnvelopeClick, onExchangeClick }: Props) {
    if (envelopes.length === 0) return null

    const monthlyEnvelopes = envelopes.filter(e => (e.envelopeType || type) === 'monthly')
    const yearlyEnvelopes = envelopes.filter(e => (e.envelopeType || type) === 'yearly')

    // Suma wydatków - Math.max(0, spent) ignoruje wpłaty (ujemne wartości jak -600 w kopertach oszczędnościowych)
    const totalSpent = envelopes.reduce((sum, envelope) => sum + Math.max(0, envelope.spent), 0)
    const totalPlanned = envelopes.reduce((sum, envelope) => sum + envelope.planned, 0)

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount)
    }

    // Suma wydatków ze wszystkich kopert w grupie (bez kopert oszczędnościowych)
    const displayAmount = formatMoney(totalSpent)

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col gap-4 h-full"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded-full bg-zinc-900/50 border border-white/5 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full animate-pulse"
                            style={{
                                backgroundColor: color || '#64748b',
                                boxShadow: `0 0 8px ${color || '#64748b'}80`
                            }}
                        />
                        <h2 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em]">
                            {title}
                        </h2>
                    </div>
                </div>

                <div className="flex items-baseline gap-2 bg-zinc-900/30 px-3 py-1 rounded-xl border border-white/5">
                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Wydano Łącznie:</span>
                    <span className="text-sm font-black text-white tracking-tight">
                        {displayAmount}
                    </span>
                </div>
            </div>

            {/* Grid of Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {envelopes
                    .sort((a, b) => {
                        // Custom sort: Paid monthly envelopes go to the end
                        const isAPaid = (a.envelopeType || type) === 'monthly' && a.planned > 0 && Math.round((a.spent / a.planned) * 100) === 100
                        const isBPaid = (b.envelopeType || type) === 'monthly' && b.planned > 0 && Math.round((b.spent / b.planned) * 100) === 100

                        if (isAPaid && !isBPaid) return 1
                        if (!isAPaid && isBPaid) return -1
                        return 0
                    })
                    .map((envelope, index) => (
                        <motion.div
                            key={envelope.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <EnvelopeCard
                                {...envelope}
                                type={envelope.envelopeType || type}
                                envelopeType={envelope.envelopeKind}
                                onTransactionClick={onEnvelopeClick}
                                onExchangeClick={onExchangeClick}
                                group={envelope.group}
                                fxPocket={envelope.fxPocket}
                                currencyCode={envelope.currencyCode}
                            />
                        </motion.div>
                    ))}
            </div>
        </motion.div>
    )
}
