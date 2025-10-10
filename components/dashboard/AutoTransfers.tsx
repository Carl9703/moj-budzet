'use client'

interface Props {
    totalIncome: number
    config?: any
}

export function AutoTransfers({ totalIncome, config }: Props) {
    const hasIncome = totalIncome > 0
    
    const transfers = [
        { id: 'joint', name: 'Wspólne opłaty (Mieszkanie)', amount: config?.defaultToJoint || 1500, icon: '🏠', status: hasIncome ? 'completed' : 'scheduled', description: 'Wydatki domowe i mieszkaniowe' },
        { id: 'groceries', name: 'Wspólne zakupy (Żywność)', amount: config?.defaultToGroceries || 500, icon: '🛒', status: hasIncome ? 'completed' : 'scheduled', description: 'Zakupy spożywcze' },
        { id: 'vacation', name: 'Wakacje (Podróże)', amount: config?.defaultToVacation || 420, icon: '✈️', status: hasIncome ? 'completed' : 'scheduled', description: 'Podróże i wakacje' },
        { id: 'wedding', name: 'Wesele', amount: config?.defaultToWedding || 300, icon: '💍', status: hasIncome ? 'completed' : 'scheduled', description: 'Fundusz na wesele' },
        { id: 'investment', name: 'IKE (Budowanie Przyszłości)', amount: config?.defaultToInvestment || 600, icon: '📈', status: hasIncome ? 'completed' : 'scheduled', description: 'Regularne inwestowanie' },
        { id: 'emergency', name: 'Fundusz Awaryjny', amount: config?.defaultToSavings || 1000, icon: '🚨', status: hasIncome ? 'completed' : 'scheduled', description: 'Oszczędności awaryjne' }
    ]

    const totalTransfers = transfers.reduce((sum, t) => sum + t.amount, 0)

    return (
        <div className="bg-theme-secondary card rounded-lg p-6" style={{
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border-primary)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className="section-header" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    💰 Stałe przelewy
                </h3>
                <span className="text-theme-secondary" style={{ fontSize: '12px', fontWeight: '500' }}>
                    {totalTransfers.toLocaleString()} zł
                </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {transfers.map(transfer => (
                    <div key={transfer.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px',
                        backgroundColor: transfer.status === 'completed' ? 'var(--bg-success)' : 'var(--bg-tertiary)',
                        borderRadius: '4px',
                        fontSize: '13px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <span style={{ fontSize: '16px' }}>{transfer.icon}</span>
                            <div>
                                <div className="text-theme-primary" style={{ fontWeight: '500', marginBottom: '2px' }}>{transfer.name}</div>
                                <div className="text-theme-secondary" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                                    {transfer.description}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: '600' }}>{transfer.amount.toLocaleString()} zł</span>
                            <span style={{
                                color: transfer.status === 'completed' ? 'var(--accent-success)' : 'var(--text-secondary)',
                                fontSize: '14px',
                                minWidth: '16px',
                                textAlign: 'center'
                            }}>
                                {transfer.status === 'completed' ? '✓' : '📅'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            {!hasIncome && (
                <div style={{
                    marginTop: '12px',
                    padding: '8px',
                    backgroundColor: 'var(--bg-warning)',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    textAlign: 'center',
                    border: '1px solid var(--accent-warning)'
                }}>
                    💡 Przelewy zostaną wykonane po dodaniu wypłaty
                </div>
            )}
        </div>
    )
}