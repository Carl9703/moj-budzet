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
}

export function EnvelopeGroup({ title, icon, color, envelopes, type }: Props) {
    if (envelopes.length === 0) return null

    return (
        <div className="slide-in-left">
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '12px',
                padding: '8px 12px',
                backgroundColor: color,
                borderRadius: '8px',
                border: '1px solid var(--border-primary)'
            }}>
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
            <div className="stagger-children" style={{ display: 'grid', gap: '10px' }}>
                {envelopes.map((envelope, index) => (
                    <div key={`${envelope.id}-${envelope.current}`} className="smooth-all hover-lift" style={{ animationDelay: `${index * 0.1}s` }}>
                        <EnvelopeCard {...envelope} type={type} />
                    </div>
                ))}
            </div>
        </div>
    )
}
