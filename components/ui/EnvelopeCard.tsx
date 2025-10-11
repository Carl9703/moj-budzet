import { formatMoney } from '@/lib/utils/money'
import { memo } from 'react'

interface EnvelopeProps {
    name: string
    icon: string
    spent: number
    planned: number
    current: number
    type: 'monthly' | 'yearly'
}

export const EnvelopeCard = memo(function EnvelopeCard({ name, icon, spent, planned, current, type }: EnvelopeProps) {
    const isFreedomFunds = name.toLowerCase().includes('wolne środki')

    const percentage = type === 'monthly'
        ? (planned > 0 ? Math.round((spent / planned) * 100) : 0)
        : isFreedomFunds
            ? 100
            : (planned > 0 ? Math.round((current / planned) * 100) : 0)

    const remaining = Math.round(((type === 'monthly' ? planned - spent : planned - current) * 100)) / 100

    const isOverBudget = type === 'monthly' && spent > planned

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

    return (
        <div className="envelope-card smooth-all bg-theme-secondary" style={{
            border: isOverBudget ? '2px solid var(--accent-error)' : '1px solid var(--border-primary)',
            borderRadius: '12px',
            padding: '16px',
            transition: 'all 0.3s ease',
            boxShadow: isOverBudget 
                ? '0 4px 12px rgba(239, 68, 68, 0.15), 0 2px 4px rgba(239, 68, 68, 0.1)' 
                : 'var(--shadow-md)',
            cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = isOverBudget 
                ? '0 6px 16px rgba(239, 68, 68, 0.2), 0 4px 8px rgba(239, 68, 68, 0.15)'
                : '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.15)'
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = isOverBudget 
                ? '0 4px 12px rgba(239, 68, 68, 0.15), 0 2px 4px rgba(239, 68, 68, 0.1)' 
                : '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{icon}</span>
                    <span className="text-theme-primary" style={{ fontWeight: '500', fontSize: '14px', transition: 'color 0.3s ease' }}>{name}</span>
                    <span style={{ fontSize: '16px', marginLeft: '4px' }}>{getStatusIcon()}</span>
                </div>
                <span className="text-theme-secondary" style={{ fontSize: '13px', color: isOverBudget ? 'var(--accent-error)' : 'var(--text-secondary)', transition: 'color 0.3s ease' }}>
                    {type === 'monthly' ?
                        `${formatMoney(current, false)}/${formatMoney(planned, false)} zł` :
                        isFreedomFunds ?
                            formatMoney(current) :
                            `${formatMoney(current, false)}/${formatMoney(planned, false)} zł`
                    }
                </span>
            </div>

            <div className="progress-bar-bg" style={{
                width: '100%',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '6px',
                height: '6px',
                marginBottom: '8px',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: getProgressColor(),
                    height: '100%',
                    borderRadius: '6px',
                    transition: 'width 0.3s ease, background-color 0.3s ease',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '50%',
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)',
                        borderRadius: '6px 6px 0 0'
                    }} />
                </div>
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px'
            }}>
                {!isFreedomFunds && (
                    <span style={{
                        color: isOverBudget ? '#dc2626' : '#6b7280',
                        fontWeight: isOverBudget ? '600' : '400'
                    }}>
                        {percentage}%
                    </span>
                )}

                <span style={{
                    fontWeight: '500',
                    color: type === 'monthly' ?
                        (isOverBudget ? '#dc2626' : (remaining > 0 ? '#059669' : '#6b7280')) :
                        isFreedomFunds ?
                            '#6366f1' :
                            (percentage >= 100 ? '#059669' : '#6b7280'),
                    marginLeft: isFreedomFunds ? 'auto' : '0'
                }}>
                    {type === 'monthly' ?
                        (isOverBudget ?
                            `⚠️ Przekroczono o ${formatMoney(Math.round((spent - planned) * 100) / 100)}` :
                            `Zostało: ${formatMoney(remaining)}`) :
                        isFreedomFunds ?
                            `💰 Dostępne środki` :
                            (percentage >= 100 ?
                                `Zebrano! +${formatMoney(Math.abs(remaining))}` :
                                `Brakuje: ${formatMoney(Math.abs(remaining))}`)
                    }
                </span>
            </div>
        </div>
    )
})