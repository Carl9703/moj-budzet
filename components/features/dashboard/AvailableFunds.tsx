import { formatMoney } from '@/lib/utils/money'
import { memo } from 'react'
import { Card } from '@/components/ui/layout/Card'

interface Props {
    availableFunds: number
}

export const AvailableFunds = memo(function AvailableFunds({ availableFunds }: Props) {
    return (
        <Card style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            marginTop: 'var(--space-m)'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)' }}>
                    <span style={{ fontSize: '20px' }}>💰</span>
                    <div>
                        <h3 style={{
                            fontSize: 'var(--font-size-s)',
                            fontWeight: 'var(--font-weight-medium)',
                            color: 'var(--text-primary)',
                            margin: 0
                        }}>
                            Wolne środki
                        </h3>
                        <p style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--text-secondary)',
                            margin: 0
                        }}>
                            Dostępne do wydania
                        </p>
                    </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                    <p style={{
                        fontSize: 'var(--font-size-l)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'var(--brand-primary)',
                        margin: 0
                    }}>
                        {formatMoney(availableFunds)}
                    </p>
                </div>
            </div>
        </Card>
    )
})
