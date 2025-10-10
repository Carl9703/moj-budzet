'use client'

interface Props {
    totalIncome: number
    config?: any
    transactions?: Array<{
        id: string
        type: string
        amount: number
        description: string
        date: string
    }>
}

export function AutoTransfers({ totalIncome, config, transactions = [] }: Props) {
    const hasIncome = totalIncome > 0
    
    // Mapowanie nazw transakcji na ID transferów
    const getTransferAmount = (transferId: string, defaultAmount: number) => {
        const transaction = transactions.find(t => {
            switch (transferId) {
                case 'joint':
                    return t.description?.includes('Wspólne opłaty')
                case 'groceries':
                    return t.description?.includes('Wspólne zakupy')
                case 'vacation':
                    return t.description?.includes('Transfer: Wakacje')
                case 'wedding':
                    return t.description?.includes('Transfer: Wesele')
                case 'investment':
                    return t.description?.includes('IKE')
                case 'emergency':
                    return t.description?.includes('Fundusz Awaryjny')
                default:
                    return false
            }
        })
        return transaction ? transaction.amount : defaultAmount
    }
    
    const getTransferStatus = (transferId: string) => {
        if (!hasIncome) return 'scheduled'
        
        const transaction = transactions.find(t => {
            switch (transferId) {
                case 'joint':
                    return t.description?.includes('Wspólne opłaty')
                case 'groceries':
                    return t.description?.includes('Wspólne zakupy')
                case 'vacation':
                    return t.description?.includes('Transfer: Wakacje')
                case 'wedding':
                    return t.description?.includes('Transfer: Wesele')
                case 'investment':
                    return t.description?.includes('IKE')
                case 'emergency':
                    return t.description?.includes('Fundusz Awaryjny')
                default:
                    return false
            }
        })
        return transaction ? 'completed' : 'scheduled'
    }
    
    const transfers = [
        { 
            id: 'joint', 
            name: 'Wspólne opłaty (Mieszkanie)', 
            amount: getTransferAmount('joint', config?.defaultToJoint || 1500), 
            icon: '🏠', 
            status: getTransferStatus('joint'), 
            description: 'Wydatki domowe i mieszkaniowe' 
        },
        { 
            id: 'groceries', 
            name: 'Wspólne zakupy (Żywność)', 
            amount: getTransferAmount('groceries', config?.defaultToGroceries || 500), 
            icon: '🛒', 
            status: getTransferStatus('groceries'), 
            description: 'Zakupy spożywcze' 
        },
        { 
            id: 'vacation', 
            name: 'Wakacje (Podróże)', 
            amount: getTransferAmount('vacation', config?.defaultToVacation || 420), 
            icon: '✈️', 
            status: getTransferStatus('vacation'), 
            description: 'Podróże i wakacje' 
        },
        { 
            id: 'wedding', 
            name: 'Wesele', 
            amount: getTransferAmount('wedding', config?.defaultToWedding || 300), 
            icon: '💍', 
            status: getTransferStatus('wedding'), 
            description: 'Fundusz na wesele' 
        },
        { 
            id: 'investment', 
            name: 'IKE (Budowanie Przyszłości)', 
            amount: getTransferAmount('investment', config?.defaultToInvestment || 600), 
            icon: '📈', 
            status: getTransferStatus('investment'), 
            description: 'Regularne inwestowanie' 
        },
        { 
            id: 'emergency', 
            name: 'Fundusz Awaryjny', 
            amount: getTransferAmount('emergency', config?.defaultToSavings || 1000), 
            icon: '🚨', 
            status: getTransferStatus('emergency'), 
            description: 'Oszczędności awaryjne' 
        }
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