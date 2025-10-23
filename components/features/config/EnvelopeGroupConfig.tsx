'use client'

interface Envelope {
    id: string
    name: string
    icon: string | null
    plannedAmount: number
    currentAmount: number
    group?: string
}

interface Props {
    title: string
    icon: string
    color: string
    envelopes: Envelope[]
    onEnvelopeChange: (envelopeId: string, plannedAmount: number) => void
}

export function EnvelopeGroupConfig({ title, icon, color, envelopes, onEnvelopeChange }: Props) {
    if (envelopes.length === 0) return null

    return (
        <div className="bg-theme-secondary card rounded-lg p-4" style={{ 
            marginBottom: '16px', 
            border: '1px solid var(--border-primary)',
            backgroundColor: color
        }}>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '12px',
                padding: '8px 12px',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '8px',
                border: '1px solid var(--border-primary)'
            }}>
                <span style={{ fontSize: '18px' }}>{icon}</span>
                <h2 className="section-header" style={{ 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    margin: 0, 
                    color: 'var(--text-primary)' 
                }}>
                    {title}
                </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {envelopes.map((e) => (
                    <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '12px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18 }}>{e.icon || '📦'}</span>
                            <span className="text-theme-primary" style={{ fontWeight: 500 }}>{e.name}</span>
                        </div>
                        <input 
                            type="number" 
                            inputMode="numeric"
                            value={e.plannedAmount} 
                            onChange={(ev) => {
                                const v = Number((ev.target as HTMLInputElement).value || 0)
                                onEnvelopeChange(e.id, v)
                            }} 
                            style={{ 
                                width: 120, 
                                textAlign: 'right', 
                                padding: 8, 
                                border: '1px solid var(--border-primary)', 
                                borderRadius: 6, 
                                backgroundColor: 'var(--bg-primary)', 
                                color: 'var(--text-primary)' 
                            }} 
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
