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

    // Oblicz środki do dyspozycji w grupie
    const totalAvailable = envelopes.reduce((sum, envelope) => sum + envelope.current, 0)
    const totalPlanned = envelopes.reduce((sum, envelope) => sum + envelope.planned, 0)
    const totalSpent = envelopes.reduce((sum, envelope) => sum + envelope.spent, 0)

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    return (
        <div className="slide-in-left">
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                gap: '8px', 
                marginBottom: '12px',
                padding: '12px 16px',
                backgroundColor: color,
                borderRadius: '8px',
                border: '1px solid var(--border-primary)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{icon}</span>
                    <h2 className="section-header" style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        margin: 0, 
                        color: 'var(--text-primary)' 
                    }}>
                        {title}
                    </h2>
                </div>
                
                {/* Wskaźnik środków do dyspozycji */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '2px'
                }}>
                    <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--text-primary)'
                    }}>
                        {formatMoney(totalAvailable)}
                    </div>
                    <div style={{
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        fontWeight: '500'
                    }}>
                        {type === 'monthly' ? 
                            `Wydano: ${formatMoney(totalSpent)}` :
                            `Zebrano: ${formatMoney(totalAvailable)}`
                        }
                    </div>
                </div>
            </div>
            <div className="stagger-children" style={{ display: 'grid', gap: '10px' }}>
                {envelopes.map((envelope, index) => (
                    <div key={`${envelope.id}-${envelope.current}`} className="smooth-all hover-lift" style={{ animationDelay: `${index * 0.1}s` }}>
                        <EnvelopeCard 
                            {...envelope} 
                            type={type} 
                            onTransactionClick={onEnvelopeClick}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
