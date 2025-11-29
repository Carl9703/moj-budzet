import { Card } from '@/components/ui/layout/Card'
import { Button } from '@/components/ui/buttons/Button'

interface Props {
    onAddIncome: () => void
    onAddExpense: () => void
}

export function QuickActions({ onAddIncome, onAddExpense }: Props) {
    return (
        <Card style={{
                backgroundColor: '#1e293b', // slate-800
                border: '1px solid #334155', // slate-700
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
        }}>
            <div style={{ 
                fontSize: '11px', 
                fontWeight: '600', 
                    color: '#64748b', // slate-500
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
            }}>
                Szybkie akcje
            </div>
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px'
            }}>
                <button
                    onClick={onAddIncome}
                    style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        backgroundColor: '#059669', // emerald-600
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'left',
                        boxShadow: '0 0 15px rgba(5, 150, 105, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#047857' // emerald-700
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#059669' // emerald-600
                    }}
                >
                    + Przychód
                </button>

                <button
                    onClick={onAddExpense}
                    style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        backgroundColor: '#4f46e5', // indigo-600
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'left',
                        boxShadow: '0 0 15px rgba(79, 70, 229, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#4338ca' // indigo-700
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#4f46e5' // indigo-600
                    }}
                >
                    - Wydatek
                </button>
            </div>
        </Card>
    )
}