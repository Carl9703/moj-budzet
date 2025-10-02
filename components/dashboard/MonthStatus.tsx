interface Props {
    totalIncome: number
    totalExpenses: number
    daysLeft: number
    onCloseMonth: () => void
    previousMonthStatus: {
        isClosed: boolean
        monthName: string
        monthStr: string
    }
}

export function MonthStatus({ totalIncome, totalExpenses, daysLeft, onCloseMonth, previousMonthStatus }: Props) {
    const balance = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0

    return (
        <div className="bg-theme-secondary card rounded-lg p-6" style={{
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border-primary)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 className="section-header" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    📊 Status miesiąca
                </h2>
                <button
                    onClick={onCloseMonth}
                    disabled={previousMonthStatus.isClosed}
                    style={{
                        padding: '6px 12px',
                        backgroundColor: previousMonthStatus.isClosed ? 'var(--text-tertiary)' : 'var(--accent-info)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: previousMonthStatus.isClosed ? 'not-allowed' : 'pointer',
                        opacity: previousMonthStatus.isClosed ? 0.6 : 1
                    }}
                >
                    {previousMonthStatus.isClosed 
                        ? `✅ ${previousMonthStatus.monthName} zamknięty`
                        : `🔒 Zamknij ${previousMonthStatus.monthName}`
                    }
                </button>
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
        </div>
    )
}