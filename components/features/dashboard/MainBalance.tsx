import { formatMoney } from '@/lib/utils/money'
import { memo } from 'react'
import { Card } from '@/components/ui/layout/Card'

interface Props {
    balance: number
}

export const MainBalance = memo(function MainBalance({ balance }: Props) {
    return (
        <Card 
            style={{
                backgroundColor: '#1e293b', // slate-800
                border: '1px solid #334155', // slate-700
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
            }}
        >
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#64748b', // slate-500
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                }}>
                    Konto główne
                </div>
                
                <div>
                    <p style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: '#f1f5f9', // slate-100
                        margin: 0,
                        letterSpacing: '-0.02em',
                        lineHeight: '1.2'
                    }}>
                        {formatMoney(balance)}
                    </p>
                    <div style={{
                        fontSize: '12px',
                        color: '#94a3b8',
                        marginTop: '4px'
                    }}>
                        Dostępne środki
                    </div>
                </div>
            </div>
        </Card>
    )
})