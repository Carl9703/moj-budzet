import { formatMoney } from '@/lib/utils/money'
import { memo } from 'react'
import { Card } from '@/components/ui/layout/Card'

interface Props {
    availableFunds: number
}

export const AvailableFunds = memo(function AvailableFunds({ availableFunds }: Props) {
    return (
        <Card style={{
                backgroundColor: '#1e293b', // slate-800
                border: '1px solid #334155', // slate-700
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div>
                    <div style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#64748b', // slate-500
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                    }}>
                        Wolne środki
                    </div>
                    <div style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: '#818cf8' // indigo-400
                    }}>
                        {formatMoney(availableFunds)}
                    </div>
                </div>
            </div>
        </Card>
    )
})
