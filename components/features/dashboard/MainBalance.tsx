import { formatMoney } from '@/lib/utils/money'
import { memo } from 'react'
import { Card } from '@/components/ui/layout/Card'

interface Props {
    balance: number
}

export const MainBalance = memo(function MainBalance({ balance }: Props) {
    return (
        <Card 
            hover 
            style={{
                background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)',
                color: 'var(--text-primary)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                zIndex: 2
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-m)' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-s)'
                    }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.6)',
                            borderRadius: '50%'
                        }} />
                        <p style={{
                            fontSize: 'var(--font-size-s)',
                            fontWeight: 'var(--font-weight-medium)',
                            color: 'rgba(255, 255, 255, 0.9)',
                            margin: 0
                        }}>
                            Konto główne
                        </p>
                    </div>
                    
                    <p style={{
                        fontSize: 'var(--font-size-xl)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'var(--text-primary)',
                        margin: 0,
                        letterSpacing: '-0.02em'
                    }}>
                        {formatMoney(balance)}
                    </p>
                    
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-xs)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'rgba(255, 255, 255, 0.8)'
                    }}>
                        <span>💰</span>
                        <span>Dostępne środki</span>
                    </div>
                </div>
                
                <div style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--border-radius-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)'
                }}>
                    <span style={{ fontSize: '24px' }}>💳</span>
                </div>
            </div>
            
            {/* Decorative elements */}
            <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '80px',
                height: '80px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '50%',
                zIndex: 1
            }} />
            <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '50%',
                zIndex: 1
            }} />
        </Card>
    )
})