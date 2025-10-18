'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, DollarSign, FileText, TrendingUp, TrendingDown } from 'lucide-react'
import { authorizedFetch } from '@/lib/utils/api'

interface Transaction {
  id: string
  amount: number
  description: string
  date: string
  type: 'income' | 'expense'
  category?: string
}

interface EnvelopeTransactionsModalProps {
  isOpen: boolean
  onClose: () => void
  envelopeId: string
  envelopeName: string
  envelopeIcon: string
}

export function EnvelopeTransactionsModal({ 
  isOpen, 
  onClose, 
  envelopeId, 
  envelopeName, 
  envelopeIcon 
}: EnvelopeTransactionsModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && envelopeId) {
      fetchTransactions()
    }
  }, [isOpen, envelopeId])

  const fetchTransactions = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Fetching transactions for envelopeId:', envelopeId)
      const response = await authorizedFetch(`/api/transactions?envelopeId=${envelopeId}&limit=20`)
      const data = await response.json()
      
      console.log('API Response:', { response: response.ok, data })
      
      if (response.ok) {
        // API zwraca dane bezpośrednio jako array, nie jako { transactions: [] }
        const transactionsArray = Array.isArray(data) ? data : (data.transactions || [])
        setTransactions(transactionsArray)
        console.log('Transactions set:', transactionsArray)
      } else {
        setError(data.error || 'Błąd pobierania transakcji')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Błąd połączenia z serwerem')
    } finally {
      setLoading(false)
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionIcon = (type: string) => {
    return type === 'income' ? '💰' : '💸'
  }

  const getTransactionColor = (type: string) => {
    return type === 'income' ? '#10b981' : '#ef4444'
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '16px',
        border: '1px solid var(--border-primary)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>{envelopeIcon}</span>
            <div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                margin: 0
              }}>
                {envelopeName}
              </h2>
              <p style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                margin: 0
              }}>
                Ostatnie transakcje
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              gap: '16px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid var(--border-primary)',
                borderTop: '4px solid var(--accent-primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <div style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                fontWeight: '500'
              }}>
                Ładowanie transakcji...
              </div>
            </div>
          ) : error ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              gap: '16px'
            }}>
              <div style={{ fontSize: '48px' }}>❌</div>
              <div style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                textAlign: 'center'
              }}>
                {error}
              </div>
              <button
                onClick={fetchTransactions}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Spróbuj ponownie
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              gap: '16px'
            }}>
              <div style={{ fontSize: '48px' }}>📝</div>
              <div style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                textAlign: 'center'
              }}>
                Brak transakcji w tej kopercie
              </div>
            </div>
          ) : (
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 24px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-primary)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-primary)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <div style={{
                      fontSize: '20px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {getTransactionIcon(transaction.type)}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: 'var(--text-primary)',
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {transaction.description || 'Brak opisu'}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Calendar size={12} />
                        {formatDate(transaction.date)}
                        {transaction.category && (
                          <>
                            <span>•</span>
                            <span>{transaction.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexShrink: 0
                    }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: getTransactionColor(transaction.type)
                      }}>
                        {transaction.type === 'income' ? '+' : '-'}{formatMoney(transaction.amount)}
                      </div>
                      {transaction.type === 'income' ? (
                        <TrendingUp size={16} color="#10b981" />
                      ) : (
                        <TrendingDown size={16} color="#ef4444" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-primary)',
          backgroundColor: 'var(--bg-tertiary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}>
            {transactions.length} transakcji
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  )
}
