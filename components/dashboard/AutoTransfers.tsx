'use client'

interface Props {
    totalIncome: number
    config?: any
}

export function AutoTransfers({ totalIncome, config }: Props) {
    const hasIncome = totalIncome > 0
    
    const transfers = [
        { id: 'joint', name: 'Konto wspólne', amount: config?.defaultToJoint || 1500, icon: '👫', status: hasIncome ? 'completed' : 'scheduled', description: 'Wydatki domowe i mieszkaniowe' },
        { id: 'wesele', name: 'Wesele (cel)', amount: config?.defaultToSavings || 1000, icon: '💍', status: hasIncome ? 'completed' : 'scheduled', description: 'Oszczędności na wesele' },
        { id: 'vacation', name: 'Wakacje', amount: config?.defaultToVacation || 420, icon: '✈️', status: hasIncome ? 'completed' : 'scheduled', description: 'Koperta wakacyjna' },
        { id: 'investment', name: 'Inwestycje', amount: config?.defaultToInvestment || 600, icon: '📈', status: hasIncome ? 'completed' : 'scheduled', description: 'Regularne inwestowanie' }
    ]

    const totalTransfers = transfers.reduce((sum, t) => sum + t.amount, 0)

    return (
        <div className="bg-white rounded-lg p-6" style={{
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)',
            border: '1px solid #f3f4f6'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    💰 Stałe przelewy
                </h3>
                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
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
                        backgroundColor: transfer.status === 'completed' ? '#f0fdf4' : '#f9fafb',
                        borderRadius: '4px',
                        fontSize: '13px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <span style={{ fontSize: '16px' }}>{transfer.icon}</span>
                            <div>
                                <div style={{ fontWeight: '500', marginBottom: '2px' }}>{transfer.name}</div>
                                <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.2' }}>
                                    {transfer.description}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: '600' }}>{transfer.amount.toLocaleString()} zł</span>
                            <span style={{
                                color: transfer.status === 'completed' ? '#10b981' : '#6b7280',
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
                    backgroundColor: '#fef3c7',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#92400e',
                    textAlign: 'center'
                }}>
                    💡 Przelewy zostaną wykonane po dodaniu wypłaty
                </div>
            )}
        </div>
    )
}