'use client'

import { EnvelopeCard } from '@/components/ui/EnvelopeCard'

interface Envelope {
    id: string
    name: string
    icon: string
    spent: number
    planned: number
    current: number
    activityCount?: number
    group?: string
    envelopeType?: 'monthly' | 'yearly' // Optional type per envelope
}

interface Props {
    title: string
    icon: string
    color: string
    envelopes: Envelope[]
    type: 'monthly' | 'yearly' // Default type for envelopes without envelopeType
    onEnvelopeClick?: (envelopeId: string, envelopeName: string, envelopeIcon: string) => void
}

export function EnvelopeGroup({ title, icon, color, envelopes, type, onEnvelopeClick }: Props) {
    if (envelopes.length === 0) return null

    // Oblicz środki do dyspozycji w grupie - uwzględnij mieszane typy
    const monthlyEnvelopes = envelopes.filter(e => (e.envelopeType || type) === 'monthly')
    const yearlyEnvelopes = envelopes.filter(e => (e.envelopeType || type) === 'yearly')
    
    const totalAvailable = yearlyEnvelopes.reduce((sum, envelope) => sum + envelope.current, 0)
    const totalPlanned = envelopes.reduce((sum, envelope) => sum + envelope.planned, 0)
    const totalSpent = monthlyEnvelopes.reduce((sum, envelope) => sum + envelope.spent, 0)
    const totalRemaining = totalPlanned - totalSpent

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount)
    }
    
    // Dla mieszanych typów pokazuj sumę dostępnych (yearly) i wydanych (monthly)
    const displayAmount = monthlyEnvelopes.length > 0 && yearlyEnvelopes.length > 0
        ? formatMoney(totalSpent + totalAvailable)
        : type === 'monthly' ? formatMoney(totalSpent) : formatMoney(totalAvailable)

    return (
        <div>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '16px',
                padding: '12px 16px',
                backgroundColor: '#0f172a', // slate-900
                borderRadius: '10px',
                border: '1px solid #334155', // slate-700
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        fontSize: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        backgroundColor: 'rgba(79, 70, 229, 0.2)', // indigo z przezroczystością
                        borderRadius: '8px',
                        border: '1px solid rgba(79, 70, 229, 0.3)'
                    }}>
                        {icon}
                    </div>
                    <h2 style={{ 
                        fontSize: '16px', 
                        fontWeight: '700', 
                        margin: 0, 
                        color: '#f1f5f9', // slate-100
                        letterSpacing: '-0.01em'
                    }}>
                        {title}
                    </h2>
                </div>
                
                <div style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#f1f5f9' // slate-100
                }}>
                    {displayAmount}
                </div>
            </div>
            <div style={{ display: 'grid', gap: '10px' }}>
                {envelopes.map((envelope) => (
                    <EnvelopeCard 
                        key={envelope.id}
                        {...envelope} 
                        type={envelope.envelopeType || type} 
                        onTransactionClick={onEnvelopeClick}
                    />
                ))}
            </div>
        </div>
    )
}
