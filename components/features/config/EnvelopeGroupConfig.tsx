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
            border: '1px solid #334155', // slate-700
            backgroundColor: color
        }}>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '12px',
                padding: '8px 12px',
                backgroundColor: '#0f172a', // slate-900
                borderRadius: '8px',
                border: '1px solid #334155' // slate-700
            }}>
                <span style={{ fontSize: '18px' }}>{icon}</span>
                <h2 className="section-header" style={{ 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    margin: 0, 
                    color: '#f1f5f9' // slate-100
                }}>
                    {title}
                </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {envelopes.map((e) => (
                    <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '12px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18 }}>{e.icon || '📦'}</span>
                            <span style={{ fontWeight: 500, color: '#f1f5f9' }}>{e.name}</span> {/* slate-100 */}
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
                                border: '1px solid #334155', // slate-700
                                borderRadius: 6, 
                                backgroundColor: '#0f172a', // slate-900
                                color: '#f1f5f9' // slate-100
                            }} 
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
