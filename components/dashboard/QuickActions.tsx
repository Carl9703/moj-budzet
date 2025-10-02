interface Props {
    onAddIncome: () => void
    onAddExpense: () => void
}

export function QuickActions({ onAddIncome, onAddExpense }: Props) {
    return (
        <div className="bg-theme-secondary card rounded-lg p-6" style={{
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border-primary)'
        }}>
            <h2 className="section-header" style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                ⚡ Szybkie akcje
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                    onClick={onAddIncome}
                    style={{
                        backgroundColor: 'var(--accent-success)',
                        color: 'white',
                        padding: '10px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}
                >
                    💵 Dodaj przychód
                </button>

                <button
                    onClick={onAddExpense}
                    style={{
                        backgroundColor: 'var(--accent-error)',
                        color: 'white',
                        padding: '10px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}
                >
                    💸 Dodaj wydatek
                </button>
            </div>
        </div>
    )
}