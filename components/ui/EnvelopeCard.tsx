import { formatMoney } from '@/lib/utils/money'

interface EnvelopeProps {
    name: string
    icon: string
    spent: number
    planned: number
    current: number
    type: 'monthly' | 'yearly'
}

export function EnvelopeCard({ name, icon, spent, planned, current, type }: EnvelopeProps) {
    // Sprawdź czy to "Wolne środki" - dla nich nie pokazujemy celu
    const isFreedomFunds = name.toLowerCase().includes('wolne środki')

    // Dla miesięcznych: procent wydatków, dla rocznych: procent zebrany
    const percentage = type === 'monthly'
        ? (planned > 0 ? Math.round((spent / planned) * 100) : 0)
        : isFreedomFunds
            ? 100 // Wolne środki zawsze 100% (bez celu)
            : (planned > 0 ? Math.round((current / planned) * 100) : 0)

    // Dla miesięcznych: planned - spent, dla rocznych: planned - current (lub brak dla wolnych środków)
    const remaining = Math.round(((type === 'monthly' ? planned - spent : planned - current) * 100)) / 100

    // Sprawdź czy przekroczono budżet (tylko dla miesięcznych)
    const isOverBudget = type === 'monthly' && spent > planned

    // Status koperty dla ikon i dodatkowych informacji
    const getEnvelopeStatus = () => {
        if (type === 'monthly') {
            if (isOverBudget) return 'over' // przekroczono
            if (percentage >= 80) return 'warning' // ostrzeżenie
            return 'good' // OK
        } else {
            if (percentage >= 100) return 'completed' // cel osiągnięty
            return 'progress' // w trakcie
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
            if (percentage > 100) return '#991b1b' // ciemnoczerwony
            if (percentage >= 90) return '#ef4444' // czerwony
            if (percentage >= 75) return '#f59e0b' // żółty
            if (percentage >= 50) return '#3b82f6' // niebieski
            return '#10b981' // zielony
        } else {
            if (isFreedomFunds) return '#6366f1' // fioletowy dla wolnych środków
            if (percentage >= 100) return '#10b981' // zielony
            if (percentage >= 75) return '#3b82f6' // niebieski
            if (percentage >= 50) return '#f59e0b' // żółty
            return '#ef4444' // czerwony
        }
    }

    return (
        <div className="envelope-card smooth-all" style={{
            backgroundColor: 'white',
            border: isOverBudget ? '2px solid #ef4444' : '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '16px',
            transition: 'all 0.3s ease',
            boxShadow: isOverBudget 
                ? '0 4px 12px rgba(239, 68, 68, 0.15), 0 2px 4px rgba(239, 68, 68, 0.1)' 
                : '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1)',
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
                    <span style={{ fontWeight: '500', fontSize: '14px' }}>{name}</span>
                    <span style={{ fontSize: '16px', marginLeft: '4px' }}>{getStatusIcon()}</span>
                </div>
                <span style={{ fontSize: '13px', color: isOverBudget ? '#dc2626' : '#6b7280' }}>
                    {type === 'monthly' ?
                        `${formatMoney(spent, false)}/${formatMoney(planned, false)} zł` :
                        isFreedomFunds ?
                            formatMoney(current) : // Tylko aktualna kwota dla wolnych środków
                            `${formatMoney(current, false)}/${formatMoney(planned, false)} zł`
                    }
                </span>
            </div>

            {/* PASEK POSTĘPU - zawsze pokazuj */}
            <div style={{
                width: '100%',
                backgroundColor: '#f3f4f6',
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
                    {/* Efekt świecenia dla lepszego wyglądu */}
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
                            '#6366f1' : // Fioletowy dla wolnych środków
                            (percentage >= 100 ? '#059669' : '#6b7280'),
                    marginLeft: isFreedomFunds ? 'auto' : '0' // Wyśrodkuj tekst dla wolnych środków
                }}>
                    {type === 'monthly' ?
                        (isOverBudget ?
                            `⚠️ Przekroczono o ${formatMoney(Math.round((spent - planned) * 100) / 100)}` :
                            `Zostało: ${formatMoney(remaining)}`) :
                        isFreedomFunds ?
                            `💰 Dostępne środki` : // Specjalny tekst dla wolnych środków
                            (percentage >= 100 ?
                                `Zebrano! +${formatMoney(Math.abs(remaining))}` :
                                `Brakuje: ${formatMoney(Math.abs(remaining))}`)
                    }
                </span>
            </div>
        </div>
    )
}