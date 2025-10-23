import { formatMoney } from '@/lib/utils/money'
import { memo } from 'react'
import { Card } from './layout/Card'
import { ProgressBar } from './ProgressBar'

interface EnvelopeProps {
    name: string
    icon: string
    spent: number
    planned: number
    current: number
    type: 'monthly' | 'yearly'
    id?: string
    onTransactionClick?: (envelopeId: string, envelopeName: string, envelopeIcon: string) => void
}

export const EnvelopeCard = memo(function EnvelopeCard({ name, icon, spent, planned, current, type, id, onTransactionClick }: EnvelopeProps) {
    const isFreedomFunds = name.toLowerCase().includes('wolne środki')

    // Dla "Wolne środki" nie liczymy procentów ani przekroczenia
    const percentage = isFreedomFunds 
        ? 0  // Nie pokazujemy procentów dla wolnych środków
        : type === 'monthly'
            ? (planned > 0 ? Math.round((spent / planned) * 100) : 0)
            : (planned > 0 ? Math.round((current / planned) * 100) : 0)

    const remaining = isFreedomFunds 
        ? 0  // Nie liczymy "pozostało" dla wolnych środków
        : Math.round(((type === 'monthly' ? planned - spent : planned - current) * 100)) / 100

    const isOverBudget = type === 'monthly' && spent > planned && !isFreedomFunds

    const getEnvelopeStatus = () => {
        if (type === 'monthly') {
            if (isOverBudget) return 'over'
            if (percentage >= 80) return 'warning'
            return 'good'
        } else {
            if (percentage >= 100) return 'completed'
            return 'progress'
        }
    }

    const status = getEnvelopeStatus()

    const getStatusIcon = () => {
        switch (status) {
            case 'over': return '⚠️'
            case 'warning': return '⚡'
            case 'good': return '✅'
            case 'completed': return '🎉'
            case 'progress': return '📈'
            default: return ''
        }
    }

    const getProgressColor = () => {
        if (type === 'monthly') {
            if (percentage > 100) return '#991b1b'
            if (percentage >= 90) return '#ef4444'
            if (percentage >= 75) return '#f59e0b'
            if (percentage >= 50) return '#3b82f6'
            return '#10b981'
        } else {
            if (isFreedomFunds) return '#6366f1'
            if (percentage >= 100) return '#10b981'
            if (percentage >= 75) return '#3b82f6'
            if (percentage >= 50) return '#f59e0b'
            return '#ef4444'
        }
    }

    const handleClick = () => {
        if (id && onTransactionClick) {
            onTransactionClick(id, name, icon)
        }
    }

    return (
        <Card 
            onClick={handleClick}
            hover={!!(id && onTransactionClick)}
            style={{
                border: isOverBudget ? '2px solid var(--color-error)' : undefined,
                boxShadow: isOverBudget 
                    ? '0 4px 12px rgba(231, 76, 60, 0.15), 0 2px 4px rgba(231, 76, 60, 0.1)' 
                    : undefined,
                cursor: id && onTransactionClick ? 'pointer' : 'default'
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-s)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)' }}>
                    <span style={{ fontSize: '20px' }}>{icon}</span>
                    <span style={{ 
                        fontWeight: 'var(--font-weight-medium)', 
                        fontSize: 'var(--font-size-s)', 
                        color: 'var(--text-primary)' 
                    }}>
                        {name}
                    </span>
                </div>
                <span style={{ 
                    fontSize: 'var(--font-size-xs)', 
                    color: isOverBudget ? 'var(--color-error)' : 'var(--text-secondary)', 
                    whiteSpace: 'nowrap' 
                }}>
                    {type === 'monthly' ?
                        `${formatMoney(spent, false)}/${formatMoney(planned, false)} zł` :
                        isFreedomFunds ?
                            formatMoney(current) :
                            `${formatMoney(current, false)}/${formatMoney(planned, false)} zł`
                    }
                </span>
            </div>

            {/* Progress Bar - tylko dla kopert z budżetem */}
            {!isFreedomFunds && (
                <div style={{ marginBottom: 'var(--space-s)' }}>
                    <ProgressBar
                        value={type === 'monthly' ? spent : current}
                        max={planned}
                        showLabel={false}
                        size="small"
                    />
                </div>
            )}

            {/* Footer - tylko status, bez procentów */}
            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                fontSize: 'var(--font-size-xs)'
            }}>
                {/* Status - różny dla wolnych środków */}
                <span style={{
                    fontWeight: 'var(--font-weight-medium)',
                    color: isFreedomFunds 
                        ? 'var(--brand-primary)'  // Wolne środki - niebieski
                        : type === 'monthly' ?
                            (isOverBudget ? 'var(--color-error)' : (remaining > 0 ? 'var(--color-success)' : 'var(--text-secondary)')) :
                            (percentage >= 100 ? 'var(--color-success)' : 'var(--text-secondary)')
                }}>
                    {isFreedomFunds ? (
                        `💰 Dostępne środki`
                    ) : type === 'monthly' ? (
                        isOverBudget ?
                            `⚠️ Przekroczono o ${formatMoney(Math.round((spent - planned) * 100) / 100, false)} zł` :
                            (name === 'Fundusz Awaryjny' || name === 'Budowanie Przyszłości' ?
                                `Brakuje: ${formatMoney(Math.abs(remaining), false)} zł` :
                                `Zostało: ${formatMoney(remaining, false)} zł`)
                    ) : (
                        percentage >= 100 ?
                            `Zebrano! +${formatMoney(Math.abs(remaining), false)} zł` :
                            `Brakuje: ${formatMoney(Math.abs(remaining), false)} zł`
                    )}
                </span>
            </div>
        </Card>
    )
})