import { formatMoney } from '@/lib/utils/money'

interface Props {
    balance: number
}

export function MainBalance({ balance }: Props) {
    return (
        <div className="main-balance-card rounded-lg shadow-lg p-4" style={{
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4f46e5 100%)',
            color: '#ffffff',
            boxShadow: 'var(--shadow-lg)'
        }}>
            <div className="flex items-center justify-between">
                <div>
                    <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px', fontWeight: '500' }}>Konto główne</p>
                    <p style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '4px', textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)' }}>
                        {formatMoney(balance)}
                    </p>
                </div>
                <div style={{ fontSize: '32px', opacity: 0.7 }}>💳</div>
            </div>
        </div>
    )
}