import { memo } from 'react'

interface Props {
    totalIncome: number
    totalExpenses: number
    daysLeft: number
    onCloseMonth: () => void
    onUndoCloseMonth?: () => void
    previousMonthStatus: {
        isClosed: boolean
        monthName: string
        monthStr: string
    }
    currentDay: number
    totalDays: number
}

export const MonthStatus = memo(function MonthStatus({ totalIncome, totalExpenses, daysLeft, onCloseMonth, onUndoCloseMonth, previousMonthStatus, currentDay, totalDays }: Props) {
    const balance = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0
    
    // Inteligentna logika dla przycisku zamknij miesiąc
    const canCloseMonth = () => {
        // Jeśli poprzedni miesiąc już zamknięty, nie można zamykać
        if (previousMonthStatus.isClosed) {
            return false
        }
        
        // Można zamykać w ostatnich 3 dniach miesiąca lub pierwszych 3 dniach nowego miesiąca
        const isLastDaysOfMonth = daysLeft <= 3
        const isFirstDaysOfNewMonth = currentDay <= 3
        
        return isLastDaysOfMonth || isFirstDaysOfNewMonth
    }
    
    const shouldShowCloseButton = canCloseMonth()

    return (
        <div className="bg-theme-secondary card rounded-lg p-6" style={{
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border-primary)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 className="section-header" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    📊 Status miesiąca
                </h2>
                {shouldShowCloseButton ? (
                    <button
                        onClick={onCloseMonth}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: 'var(--accent-info)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer'
                        }}
                    >
                        🔒 Zamknij {previousMonthStatus.monthName}
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {previousMonthStatus.isClosed && onUndoCloseMonth ? (
                            <button
                                onClick={onUndoCloseMonth}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: 'var(--accent-error)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                ↶ Cofnij zamknięcie {previousMonthStatus.monthName}
                            </button>
                        ) : (
                            <div style={{
                                padding: '6px 12px',
                                backgroundColor: 'var(--text-tertiary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500',
                                opacity: 0.6
                            }}>
                                {previousMonthStatus.isClosed 
                                    ? `✅ ${previousMonthStatus.monthName} zamknięty`
                                    : daysLeft > 3 
                                        ? `⏰ Dostępne za ${daysLeft - 3} dni`
                                        : `⏰ Dostępne w ostatnich 3 dniach miesiąca`
                                }
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                <div>
                    <div className="text-theme-secondary">Przychody</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--accent-success)' }}>+{totalIncome.toLocaleString()} zł</div>
                </div>
                <div>
                    <div className="text-theme-secondary">Wydatki</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--accent-error)' }}>-{totalExpenses.toLocaleString()} zł</div>
                </div>
                <div>
                    <div className="text-theme-secondary">Bilans</div>
                    <div style={{ fontWeight: 'bold', color: balance >= 0 ? 'var(--accent-success)' : 'var(--accent-error)' }}>
                        {balance >= 0 ? '+' : ''}{balance.toLocaleString()} zł
                    </div>
                </div>
                <div>
                    <div className="text-theme-secondary">Oszczędności</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--accent-info)' }}>{savingsRate}%</div>
                </div>
            </div>

            <div style={{
                marginTop: '12px',
                padding: '8px',
                backgroundColor: 'var(--bg-warning)',
                borderRadius: '4px',
                fontSize: '12px',
                color: 'var(--text-primary)',
                border: '1px solid var(--accent-warning)'
            }}>
                📅 Do końca miesiąca: <strong>{daysLeft} dni</strong> • Dzienny budżet: <strong>{Math.round(balance / daysLeft)} zł</strong>
            </div>

            {/* Pasek postępu miesiąca */}
            <div style={{ marginTop: '12px' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                    fontSize: '12px'
                }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Postęp miesiąca</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {currentDay}/{totalDays} dni ({Math.round((currentDay / totalDays) * 100)}%)
                    </span>
                </div>
                <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${Math.round((currentDay / totalDays) * 100)}%`,
                        height: '100%',
                        backgroundColor: '#3b82f6',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                    }} />
                </div>
            </div>
        </div>
    )
})