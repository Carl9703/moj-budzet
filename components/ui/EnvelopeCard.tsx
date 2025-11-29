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

    const handleClick = () => {
        if (id && onTransactionClick) {
            onTransactionClick(id, name, icon)
        }
    }

    // Quantum style colors
    const getProgressColor = () => {
        if (type === 'monthly') {
            if (percentage > 100) return '#f43f5e' // rose-500
            if (percentage > 85) return '#f59e0b' // amber-500
            return '#34d399' // emerald-400
        } else {
            if (isFreedomFunds) return '#818cf8' // indigo-400
            if (percentage >= 100) return '#34d399' // emerald-400
            if (percentage >= 75) return '#4f46e5' // indigo-600
            if (percentage >= 50) return '#f59e0b' // amber-500
            return '#f43f5e' // rose-500
        }
    }

    const progressColor = getProgressColor()
    const textColor = percentage > 100 ? '#fb7185' : (percentage > 85 ? '#fbbf24' : '#cbd5e1') // rose-400 : amber-400 : slate-300

    return (
        <Card 
            onClick={handleClick}
            hover={!!(id && onTransactionClick)}
            className="envelope-card"
            style={{
                border: isOverBudget 
                    ? '1px solid #f43f5e' // rose-500
                    : '1px solid #334155', // slate-700
                cursor: id && onTransactionClick ? 'pointer' : 'default',
                padding: '12px',
                backgroundColor: '#0f172a', // slate-900
                borderRadius: '8px',
                transition: 'all 0.2s ease'
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px'
            }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    flex: 1,
                    minWidth: 0
                }}>
                    <span style={{ fontSize: '16px' }}>{icon}</span>
                    <span style={{ 
                        fontWeight: '500', 
                        fontSize: '13px', 
                        color: '#cbd5e1', // slate-300
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {name}
                    </span>
                </div>
                <div style={{ 
                    textAlign: 'right',
                    flexShrink: 0
                }}>
                    <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '700',
                        color: isOverBudget ? '#fb7185' : '#f1f5f9', // rose-400 : slate-100
                        whiteSpace: 'nowrap'
                    }}>
                        {type === 'monthly' ?
                            formatMoney(spent, false) :
                            isFreedomFunds ?
                                formatMoney(current) :
                                formatMoney(current, false)
                        }
                    </div>
                    {!isFreedomFunds && (
                        <div style={{
                            fontSize: '10px',
                            color: '#64748b' // slate-500
                        }}>
                            / {formatMoney(planned, false)}
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Bar - Quantum Style */}
            {!isFreedomFunds && (
                <div style={{ marginBottom: '8px' }}>
                    <div style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: '#0f172a', // slate-900
                        borderRadius: '3px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${Math.min(percentage, 100)}%`,
                            height: '100%',
                            backgroundColor: progressColor,
                            transition: 'width 0.5s ease'
                        }} />
                    </div>
                </div>
            )}

            {/* Status - Quantum Style */}
            <div style={{
                fontSize: '10px',
                color: textColor,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span>
                    {isFreedomFunds ? (
                        'Dostępne środki'
                    ) : type === 'monthly' ? (
                        isOverBudget ?
                            `Przekroczono o ${formatMoney(Math.round((spent - planned) * 100) / 100, false)}` :
                            (name === 'Fundusz Awaryjny' || name === 'Budowanie Przyszłości' ?
                                `Brakuje ${formatMoney(Math.abs(remaining), false)}` :
                                `Zostało ${formatMoney(remaining, false)}`)
                    ) : (
                        percentage >= 100 ?
                            `Zebrano! +${formatMoney(Math.abs(remaining), false)}` :
                            `Brakuje ${formatMoney(Math.abs(remaining), false)}`
                    )}
                </span>
                {!isFreedomFunds && (
                    <span style={{ fontWeight: '600' }}>
                        {percentage.toFixed(0)}%
                    </span>
                )}
            </div>
        </Card>
    )
})