import { Card } from '@/components/ui/layout/Card'
import { Button } from '@/components/ui/buttons/Button'

interface Props {
    onAddIncome: () => void
    onAddExpense: () => void
}

export function QuickActions({ onAddIncome, onAddExpense }: Props) {
    return (
        <div className="bg-theme-secondary card rounded-lg p-6" style={{
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border-primary)',
            display: 'flex',
            flexDirection: 'column',
            height: '265px'
        }}>
            <h2 style={{ 
                fontSize: 'var(--font-size-l)', 
                fontWeight: 'var(--font-weight-semibold)', 
                marginBottom: '28px', 
                color: 'var(--text-primary)'
            }}>
                ⚡ Szybkie akcje
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-m)' }}>
                <Button
                    onClick={onAddIncome}
                    variant="success"
                    size="large"
                    fullWidth
                    style={{
                        padding: 'var(--space-l) var(--space-xl)',
                        fontSize: 'var(--font-size-m)',
                        height: '60px',
                        fontWeight: 'var(--font-weight-semibold)'
                    }}
                >
                    💵 Dodaj przychód
                </Button>

                <Button
                    onClick={onAddExpense}
                    variant="error"
                    size="large"
                    fullWidth
                    style={{
                        padding: 'var(--space-l) var(--space-xl)',
                        fontSize: 'var(--font-size-m)',
                        height: '60px',
                        fontWeight: 'var(--font-weight-semibold)'
                    }}
                >
                    💸 Dodaj wydatek
                </Button>
            </div>
        </div>
    )
}