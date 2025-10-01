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
        <div className="bg-white rounded-lg p-6" style={{
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)',
            border: '1px solid #f3f4f6'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    📊 Status miesiąca
                </h2>
                <button
                    onClick={onCloseMonth}
                    disabled={previousMonthStatus.isClosed}
                    style={{
                        padding: '6px 12px',
                        backgroundColor: previousMonthStatus.isClosed ? '#9ca3af' : '#6366f1',
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
                    <div style={{ color: '#6b7280' }}>Przychody</div>
                    <div style={{ fontWeight: 'bold', color: '#059669' }}>+{totalIncome.toLocaleString()} zł</div>
                </div>
                <div>
                    <div style={{ color: '#6b7280' }}>Wydatki</div>
                    <div style={{ fontWeight: 'bold', color: '#dc2626' }}>-{totalExpenses.toLocaleString()} zł</div>
                </div>
                <div>
                    <div style={{ color: '#6b7280' }}>Bilans</div>
                    <div style={{ fontWeight: 'bold', color: balance >= 0 ? '#059669' : '#dc2626' }}>
                        {balance >= 0 ? '+' : ''}{balance.toLocaleString()} zł
                    </div>
                </div>
                <div>
                    <div style={{ color: '#6b7280' }}>Oszczędności</div>
                    <div style={{ fontWeight: 'bold', color: '#6366f1' }}>{savingsRate}%</div>
                </div>
            </div>

            <div style={{
                marginTop: '12px',
                padding: '8px',
                backgroundColor: '#fef3c7',
                borderRadius: '4px',
                fontSize: '12px'
            }}>
                📅 Do końca miesiąca: <strong>{daysLeft} dni</strong> • Dzienny budżet: <strong>{Math.round(balance / daysLeft)} zł</strong>
            </div>
        </div>
    )
}