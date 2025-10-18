'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, Edit, Trash2, Check, X } from 'lucide-react'
import { authorizedFetch } from '@/lib/utils/api'
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

interface TransactionTableProps {
  transactions: Transaction[]
  onTransactionDeleted?: () => void
  loading?: boolean
}

type SortField = 'date' | 'amount' | 'description' | 'type'
type SortOrder = 'asc' | 'desc'

export function TransactionTable({ transactions, onTransactionDeleted, loading = false }: TransactionTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState<string>('')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Funkcja do obliczania działań matematycznych
  const calculateMathExpression = (expression: string): number | null => {
    try {
      const cleanExpression = expression.replace(/\s/g, '')
      
      if (!/^[0-9+\-*/.()]+$/.test(cleanExpression)) {
        return null
      }
      
      if (cleanExpression.includes('..') || 
          cleanExpression.includes('++') || 
          cleanExpression.includes('--') ||
          cleanExpression.includes('**') ||
          cleanExpression.includes('//')) {
        return null
      }
      
      const result = Function(`"use strict"; return (${cleanExpression})`)()
      
      if (typeof result !== 'number' || !isFinite(result)) {
        return null
      }
      
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const handleEdit = async (transactionId: string, currentAmount: number) => {
    if (editingId === transactionId) {
      let newAmount: number
      
      const mathResult = calculateMathExpression(editAmount)
      if (mathResult !== null) {
        newAmount = mathResult
      } else {
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

  // Sortuj transakcje
  const sortedTransactions = [...transactions].sort((a, b) => {
    let aValue: any, bValue: any

    switch (sortField) {
      case 'date':
        aValue = new Date(a.date).getTime()
        bValue = new Date(b.date).getTime()
        break
      case 'amount':
        aValue = a.amount
        bValue = b.amount
        break
      case 'description':
        aValue = a.description.toLowerCase()
        bValue = b.description.toLowerCase()
        break
      case 'type':
        aValue = a.type
        bValue = b.type
        break
      default:
        return 0
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--border-primary)',
          borderTop: '4px solid var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          marginBottom: '8px'
        }}>
          Brak transakcji
        </h3>
        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary)'
        }}>
          Nie znaleziono transakcji spełniających kryteria wyszukiwania
        </p>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border-primary)',
      boxShadow: 'var(--shadow-md)',
      overflow: 'hidden'
    }}>
      {/* Nagłówek tabeli */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 120px 200px 100px 80px',
        gap: '16px',
        padding: '16px 20px',
        backgroundColor: 'var(--bg-tertiary)',
        borderBottom: '1px solid var(--border-primary)',
        fontSize: '13px',
        fontWeight: '600',
        color: 'var(--text-secondary)'
      }}>
        <div
          onClick={() => handleSort('description')}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            userSelect: 'none'
          }}
        >
          Opis
          {sortField === 'description' && (
            sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
          )}
        </div>
        
        <div
          onClick={() => handleSort('amount')}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            userSelect: 'none'
          }}
        >
          Kwota
          {sortField === 'amount' && (
            sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
          )}
        </div>
        
        <div
          onClick={() => handleSort('date')}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            userSelect: 'none'
          }}
        >
          Data
          {sortField === 'date' && (
            sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
          )}
        </div>
        
        <div
          onClick={() => handleSort('type')}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            userSelect: 'none'
          }}
        >
          Typ
          {sortField === 'type' && (
            sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
          )}
        </div>
        
        <div style={{ textAlign: 'center' }}>
          Akcje
        </div>
      </div>

      {/* Wiersze transakcji */}
      <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
        {sortedTransactions.map((transaction, index) => (
          <div
            key={transaction.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px 200px 100px 80px',
              gap: '16px',
              padding: '16px 20px',
              borderBottom: index < sortedTransactions.length - 1 ? '1px solid var(--border-primary)' : 'none',
              backgroundColor: 'var(--bg-secondary)',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
          >
            {/* Opis */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '16px' }}>{getTypeIcon(transaction.type)}</span>
                
                {/* Kategoria */}
                {transaction.category && (
                  <span style={{
                    backgroundColor: 'var(--bg-info)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: 'var(--accent-info)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    {getCategoryIcon(transaction.category)} {getCategoryName(transaction.category)}
                  </span>
                )}

                {/* Koperta */}
                {transaction.envelope && (
                  <span style={{
                    backgroundColor: 'var(--bg-success)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: 'var(--accent-success)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    {transaction.envelope.icon} {transaction.envelope.name}
                  </span>
                )}
              </div>
              
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text-primary)',
                wordBreak: 'break-word'
              }}>
                {transaction.description || 'Brak opisu'}
              </div>
              
              <div style={{
                fontSize: '11px',
                color: 'var(--text-tertiary)'
              }}>
                {formatTime(transaction.date)}
              </div>
            </div>

            {/* Kwota */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end'
            }}>
              {editingId === transaction.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="text"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="np. 750/2"
                    style={{
                      width: '80px',
                      padding: '4px 6px',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)'
                    }}
                    autoFocus
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>zł</span>
                </div>
              ) : (
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: getTypeColor(transaction.type),
                  textAlign: 'right'
                }}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {transaction.amount.toLocaleString()} zł
                </div>
              )}
            </div>

            {/* Data */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '13px',
              color: 'var(--text-primary)'
            }}>
              {formatDate(transaction.date)}
            </div>

            {/* Typ */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '13px',
              color: getTypeColor(transaction.type),
              fontWeight: '500'
            }}>
              {transaction.type === 'income' ? 'Przychód' :
               transaction.type === 'expense' ? 'Wydatek' : 'Transfer'}
            </div>

            {/* Akcje */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}>
              {editingId === transaction.id ? (
                <>
                  <button
                    onClick={() => handleEdit(transaction.id, transaction.amount)}
                    style={{
                      padding: '4px 6px',
                      backgroundColor: 'var(--accent-success)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                    title="Zapisz"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{
                      padding: '4px 6px',
                      backgroundColor: 'var(--accent-error)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                    title="Anuluj"
                  >
                    <X size={12} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleEdit(transaction.id, transaction.amount)}
                    style={{
                      padding: '4px 6px',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                    title="Edytuj kwotę"
                  >
                    <Edit size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    style={{
                      padding: '4px 6px',
                      backgroundColor: 'var(--bg-error)',
                      border: '1px solid var(--accent-error)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      color: 'var(--accent-error)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                    title="Usuń transakcję"
                  >
                    <Trash2 size={12} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
