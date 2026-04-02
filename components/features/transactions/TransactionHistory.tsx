'use client'

import { useState } from 'react'
import { authorizedFetch } from '@/lib/api/client'
import { getCategoryIcon, getCategoryName } from '@/lib/constants/categories'

interface Transaction {
    id: string
    type: string
    amount: number
    description: string
    date: string
    category?: string
    envelope?: {
        name: string
        icon: string
    }
}

interface Props {
    transactions: Transaction[]
    onTransactionDeleted?: () => void
}

export function TransactionHistory({ transactions, onTransactionDeleted }: Props) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editAmount, setEditAmount] = useState<string>('')

    // Funkcja do obliczania działań matematycznych
    const calculateMathExpression = (expression: string): number | null => {
        try {
            // Usuń spacje i sprawdź czy zawiera operatory matematyczne
            const cleanExpression = expression.replace(/\s/g, '')
            
            // Sprawdź czy zawiera tylko dozwolone znaki (cyfry, +, -, *, /, ., (, ))
            if (!/^[0-9+\-*/.()]+$/.test(cleanExpression)) {
                return null
            }
            
            // Sprawdź czy nie zawiera niebezpiecznych konstrukcji
            if (cleanExpression.includes('..') || 
                cleanExpression.includes('++') || 
                cleanExpression.includes('--') ||
                cleanExpression.includes('**') ||
                cleanExpression.includes('//')) {
                return null
            }
            
            // Oblicz wyrażenie
            const result = Function(`"use strict"; return (${cleanExpression})`)()
            
            // Sprawdź czy wynik jest liczbą
            if (typeof result !== 'number' || !isFinite(result)) {
                return null
            }
            
            // Zaokrąglij do 2 miejsc po przecinku
            return Math.round(result * 100) / 100
        } catch {
            return null
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('pl-PL', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'income': return '💰'
            case 'expense': return '💸'
            case 'transfer': return '🔄'
            default: return '📄'
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'income': return 'var(--accent-success)'
            case 'expense': return 'var(--accent-error)'
            case 'transfer': return 'var(--accent-info)'
            default: return 'var(--text-secondary)'
        }
    }

    const handleEdit = async (transactionId: string, currentAmount: number) => {
        if (editingId === transactionId) {
            // Zapisz zmiany
            let newAmount: number
            
            // Sprawdź czy to wyrażenie matematyczne
            const mathResult = calculateMathExpression(editAmount)
            if (mathResult !== null) {
                newAmount = mathResult
            } else {
                // Spróbuj parsować jako zwykłą liczbę
                newAmount = parseFloat(editAmount)
            }
            
            if (isNaN(newAmount) || newAmount < 0) {
                alert('Nieprawidłowa kwota. Możesz używać działań matematycznych (np. 750/2)')
                return
            }
            
            if (newAmount !== currentAmount) {
                try {
                    const response = await authorizedFetch(`/api/transactions/${transactionId}`, {
                        method: 'PATCH',
                        body: JSON.stringify({
                            amount: newAmount,
                            reason: newAmount < currentAmount ? 'Zwrot częściowy' : 'Korekta'
                        })
                    })

                    if (response.ok) {
                        window.location.reload()
                    } else {
                        alert('Błąd podczas edycji')
                    }
                } catch {
                    alert('Błąd podczas edycji')
                }
            }
            setEditingId(null)
        } else {
            // Rozpocznij edycję
            setEditingId(transactionId)
            setEditAmount(currentAmount.toString())
        }
    }

    const handleDelete = async (transactionId: string) => {
        if (confirm('Czy na pewno chcesz usunąć tę transakcję?')) {
            try {
                const response = await authorizedFetch(`/api/transactions/${transactionId}`, {
                    method: 'DELETE'
                })

                if (response.ok) {
                    // Wywołaj callback jeśli dostępny, inaczej przeładuj stronę
                    if (onTransactionDeleted) {
                        onTransactionDeleted()
                    } else {
                        window.location.reload()
                    }
                } else {
                    alert('Błąd podczas usuwania')
                }
            } catch {
                alert('Błąd podczas usuwania')
            }
        }
    }

    // Sortuj transakcje po dacie (najnowsze pierwsze)
    const sortedTransactions = [...transactions].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // Grupuj transakcje po dniach
    const groupedTransactions = sortedTransactions.reduce((groups: Record<string, Transaction[]>, transaction) => {
        const date = formatDate(transaction.date)
        if (!groups[date]) {
            groups[date] = []
        }
        groups[date].push(transaction)
        return groups
    }, {})

    return (
        <div className="bg-theme-secondary card" style={{ borderRadius: '8px', boxShadow: 'var(--shadow-md)', padding: '16px', border: '1px solid var(--border-primary)' }}>
            <h2 className="section-header" style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                📜 Historia transakcji
            </h2>

            {Object.keys(groupedTransactions).length === 0 ? (
                <p className="text-theme-secondary" style={{ textAlign: 'center', padding: '24px' }}>
                    Brak transakcji
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {Object.entries(groupedTransactions).map(([date, dayTransactions]: [string, Transaction[]]) => (
                        <div key={date}>
                            <div className="text-theme-secondary" style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                marginBottom: '6px',
                                paddingBottom: '4px',
                                borderBottom: '1px solid var(--border-primary)'
                            }}>
                                {date}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {dayTransactions.map((transaction: Transaction) => (
                                    <div
                                        key={transaction.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '8px',
                                            backgroundColor: 'var(--bg-tertiary)',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                            <span>{getTypeIcon(transaction.type)}</span>
                                            <div style={{ flex: 1 }}>
                                                <div>
                                                    {/* Wyświetl kategorię jeśli istnieje */}
                                                    {transaction.category && (
                                                        <span style={{
                                                            marginRight: '8px',
                                                            backgroundColor: 'var(--bg-info)',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            color: 'var(--accent-info)'
                                                        }}>
                                                            {getCategoryIcon(transaction.category)} {getCategoryName(transaction.category)}
                                                        </span>
                                                    )}

                                                    {/* Wyświetl kopertę */}
                                                    {transaction.envelope && (
                                                        <span style={{
                                                            marginRight: '8px',
                                                            backgroundColor: 'var(--bg-success)',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            color: 'var(--accent-success)'
                                                        }}>
                                                            {transaction.envelope.icon} {transaction.envelope.name}
                                                        </span>
                                                    )}

                                                    {editingId !== transaction.id && (
                                                        <>
                                                            <span style={{ fontWeight: '500' }}>
                                                                {transaction.amount.toLocaleString()} zł
                                                            </span>
                                                            {transaction.description && (
                                                                <span className="text-theme-secondary" style={{ marginLeft: '8px' }}>
                                                                    - {transaction.description}
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                <div className="text-theme-tertiary" style={{ fontSize: '11px', marginTop: '2px' }}>
                                                    {formatTime(transaction.date)}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {editingId === transaction.id ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        value={editAmount}
                                                        onChange={(e) => setEditAmount(e.target.value)}
                                                        placeholder="np. 750/2"
                                                        style={{
                                                            width: '120px',
                                                            padding: '4px 8px',
                                                            border: '1px solid var(--border-primary)',
                                                            borderRadius: '4px',
                                                            fontSize: '14px',
                                                            backgroundColor: 'var(--bg-primary)',
                                                            color: 'var(--text-primary)'
                                                        }}
                                                        autoFocus
                                                    />
                                                    <span className="text-theme-secondary">zł</span>
                                                    <button
                                                        onClick={() => handleEdit(transaction.id, transaction.amount)}
                                                        className="nav-button"
                                                        style={{
                                                            padding: '4px 8px',
                                                            backgroundColor: 'var(--accent-success)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            cursor: 'pointer'
                                                        }}
                                                        title="Zapisz"
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="nav-button"
                                                        style={{
                                                            padding: '4px 8px',
                                                            backgroundColor: 'var(--accent-error)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            cursor: 'pointer'
                                                        }}
                                                        title="Anuluj"
                                                    >
                                                        ✕
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <div style={{
                                                        fontWeight: '600',
                                                        color: getTypeColor(transaction.type),
                                                        whiteSpace: 'nowrap',
                                                        minWidth: '80px',
                                                        textAlign: 'right'
                                                    }}>
                                                        {transaction.type === 'income' ? '+' : '-'}
                                                        {transaction.amount.toLocaleString()} zł
                                                    </div>
                                                    {/* POPRAWKA: przyciski dla WSZYSTKICH transakcji */}
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <button
                                                            onClick={() => handleEdit(transaction.id, transaction.amount)}
                                                            className="nav-button"
                                                            style={{
                                                                padding: '4px 8px',
                                                                backgroundColor: 'var(--bg-tertiary)',
                                                                border: '1px solid var(--border-primary)',
                                                                borderRadius: '4px',
                                                                fontSize: '11px',
                                                                cursor: 'pointer',
                                                                color: 'var(--text-primary)'
                                                            }}
                                                            title="Edytuj kwotę (możesz używać działań: 750/2, 100+50, itp.)"
                                                        >
                                                            Edytuj
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(transaction.id)}
                                                            className="nav-button"
                                                            style={{
                                                                padding: '4px 8px',
                                                                backgroundColor: 'var(--bg-error)',
                                                                border: '1px solid var(--accent-error)',
                                                                borderRadius: '4px',
                                                                fontSize: '11px',
                                                                cursor: 'pointer',
                                                                color: 'var(--accent-error)'
                                                            }}
                                                            title="Usuń transakcję"
                                                        >
                                                            Usuń
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}