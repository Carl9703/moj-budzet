'use client'

import { useState, useEffect } from 'react'
import { TopNavigation } from '@/components/ui/TopNavigation'
import { authorizedFetch } from '@/lib/utils/api'
import { useAuth } from '@/lib/hooks/useAuth'

interface TransactionData {
    id: string
    type: string
    amount: number
    description: string
    date: string
    category: string
}

interface ArchiveCategory {
    name: string
    icon: string
    amount: number
    percentage: number
    transactions: TransactionData[]
}

interface ArchiveEnvelope {
    name: string
    icon: string
    totalSpent: number
    percentage: number
    categories: ArchiveCategory[]
}

interface MonthData {
    month: string
    year: number
    income: number
    expenses: number
    balance: number
    envelopes: ArchiveEnvelope[]
    transfers: ArchiveCategory[]
    transactions: TransactionData[]
}

export default function ArchivePage() {
    const { isAuthenticated, isCheckingAuth } = useAuth()
    const [monthsData, setMonthsData] = useState<MonthData[]>([])
    const [selectedMonth, setSelectedMonth] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>('')

    // Stany rozwinięcia
    const [expandedEnvelopes, setExpandedEnvelopes] = useState<Set<string>>(new Set())
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
    const [expandedTransfers, setExpandedTransfers] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (isAuthenticated) {
            fetchMonthsData()
        }
    }, [isAuthenticated])
    
    if (isCheckingAuth) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Sprawdzanie autoryzacji...</p>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    const fetchMonthsData = async () => {
        try {
            setLoading(true)
            const response = await authorizedFetch('/api/archive', {
                cache: 'no-store'
            })

            if (response.ok) {
                const data = await response.json()
                console.log('Archive data:', data)
                setMonthsData(data)
                if (data.length > 0) {
                    setSelectedMonth(`${data[0].year}-${data[0].month}`)
                }
            } else {
                const errorText = await response.text()
                setError(`Błąd API: ${response.status} - ${errorText}`)
                console.error('Archive API error:', response.status, errorText)
            }
        } catch (error) {
            console.error('Error fetching archive:', error)
            setError('Błąd połączenia z serwerem')
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('pl-PL', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatMoney = (amount: number) => {
        return amount.toLocaleString('pl-PL') + ' zł'
    }

    const getSelectedMonthData = () => {
        return monthsData.find(m => `${m.year}-${m.month}` === selectedMonth)
    }

    const toggleEnvelope = (envelopeName: string) => {
        const newExpanded = new Set(expandedEnvelopes)
        if (newExpanded.has(envelopeName)) {
            newExpanded.delete(envelopeName)
        } else {
            newExpanded.add(envelopeName)
        }
        setExpandedEnvelopes(newExpanded)
    }

    const toggleCategory = (categoryKey: string) => {
        const newExpanded = new Set(expandedCategories)
        if (newExpanded.has(categoryKey)) {
            newExpanded.delete(categoryKey)
        } else {
            newExpanded.add(categoryKey)
        }
        setExpandedCategories(newExpanded)
    }

    const toggleTransfer = (transferName: string) => {
        const newExpanded = new Set(expandedTransfers)
        if (newExpanded.has(transferName)) {
            newExpanded.delete(transferName)
        } else {
            newExpanded.add(transferName)
        }
        setExpandedTransfers(newExpanded)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-theme-primary">
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh'
                }}>
                    <div className="text-theme-secondary" style={{
                        fontSize: '24px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                        <div>Ładowanie archiwum...</div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-theme-primary">
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh'
                }}>
                    <div className="bg-theme-secondary card" style={{
                        padding: '32px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        color: 'var(--accent-error)',
                        border: '1px solid var(--accent-error)',
                        maxWidth: '400px'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                        <p style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '600' }}>Błąd ładowania</p>
                        <p style={{ fontSize: '14px', marginBottom: '16px' }}>{error}</p>
                        <button
                            onClick={fetchMonthsData}
                            className="nav-button"
                            style={{
                                padding: '8px 16px',
                                backgroundColor: 'var(--accent-error)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            Spróbuj ponownie
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const monthData = getSelectedMonthData()

    return (
        <div className="min-h-screen bg-theme-primary">
            <TopNavigation />
            <div style={{ 
                maxWidth: '1400px', 
                margin: '0 auto', 
                padding: '12px'
            }} className="archive-container">
                <h1 className="section-header" style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '24px' }}>
                    📁 Archiwum miesięcy
                </h1>

                {monthsData.length === 0 ? (
                    <div className="bg-theme-secondary card" style={{
                        padding: '48px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-primary)'
                    }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📂</div>
                        <p style={{ fontSize: '20px', marginBottom: '8px', fontWeight: '600' }}>
                            Brak danych archiwalnych
                        </p>
                        <p style={{ fontSize: '16px' }}>
                            Archiwum będzie dostępne po zamknięciu pierwszego miesiąca
                        </p>
                    </div>
                ) : (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'minmax(300px, 400px) 1fr', 
                        gap: '24px'
                    }} className="archive-layout">
                        {/* Lista miesięcy */}
                        <div>
                            <h2 className="section-header" style={{
                                fontSize: '18px',
                                fontWeight: '600',
                                marginBottom: '16px',
                                color: 'var(--text-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                📅 Miesiące ({monthsData.length})
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {monthsData.map((month) => {
                                    const isSelected = selectedMonth === `${month.year}-${month.month}`
                                    const savingsRate = month.income > 0 ? Math.round((month.balance / month.income) * 100) : 0

                                    return (
                                        <div
                                            key={`${month.year}-${month.month}`}
                                            onClick={() => setSelectedMonth(`${month.year}-${month.month}`)}
                                            className="bg-theme-secondary card hover-lift"
                                            style={{
                                                padding: '20px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-primary)',
                                                transition: 'all 0.2s',
                                                boxShadow: isSelected ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                                                transform: isSelected ? 'translateY(-2px)' : 'none'
                                            }}
                                        >
                                            <h3 style={{
                                                fontWeight: '700',
                                                marginBottom: '12px',
                                                fontSize: '18px',
                                                color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)'
                                            }}>
                                                {month.month} {month.year}
                                            </h3>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span className="text-theme-secondary">Przychody:</span>
                                                    <span style={{ color: 'var(--accent-success)', fontWeight: '600' }}>
                                                        +{formatMoney(month.income)}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span className="text-theme-secondary">Wydatki:</span>
                                                    <span style={{ color: 'var(--accent-error)', fontWeight: '600' }}>
                                                        -{formatMoney(month.expenses)}
                                                    </span>
                                                </div>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    paddingTop: '6px',
                                                    borderTop: '1px solid var(--border-tertiary)'
                                                }}>
                                                    <span className="text-theme-secondary" style={{ fontWeight: '500' }}>Bilans:</span>
                                                    <span style={{
                                                        color: month.balance >= 0 ? 'var(--accent-success)' : 'var(--accent-error)',
                                                        fontWeight: '700',
                                                        fontSize: '16px'
                                                    }}>
                                                        {month.balance >= 0 ? '+' : ''}{formatMoney(month.balance)}
                                                    </span>
                                                </div>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    marginTop: '4px'
                                                }}>
                                                    <span className="text-theme-secondary" style={{ fontSize: '13px' }}>Oszczędności:</span>
                                                    <span style={{
                                                        fontWeight: '600',
                                                        fontSize: '13px',
                                                        color: savingsRate >= 20 ? 'var(--accent-success)' : savingsRate >= 10 ? 'var(--accent-warning)' : 'var(--accent-error)'
                                                    }}>
                                                        {savingsRate}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Szczegóły wybranego miesiąca */}
                        <div>
                            {selectedMonth && monthData ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {/* Header miesiąca */}
                                    <div className="card" style={{
                                        padding: '24px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-primary)',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white'
                                    }}>
                                        <h2 style={{
                                            fontSize: '24px',
                                            fontWeight: '700',
                                            marginBottom: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px'
                                        }}>
                                            📋 {monthData.month} {monthData.year}
                                        </h2>
                                        <p style={{ fontSize: '16px', opacity: 0.9 }}>
                                            Hierarchiczne podsumowanie wydatków
                                        </p>
                                    </div>

                                    {/* Główne statystyki */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                        gap: '16px'
                                    }} className="stats-grid">
                                        <div className="bg-theme-secondary card" style={{
                                            padding: '20px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-primary)',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>💰</div>
                                            <div className="text-theme-secondary" style={{ fontSize: '12px', marginBottom: '4px' }}>Przychody</div>
                                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-success)' }}>
                                                +{formatMoney(monthData.income)}
                                            </div>
                                        </div>
                                        <div className="bg-theme-secondary card" style={{
                                            padding: '20px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-primary)',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>💸</div>
                                            <div className="text-theme-secondary" style={{ fontSize: '12px', marginBottom: '4px' }}>Wydatki</div>
                                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-error)' }}>
                                                -{formatMoney(monthData.expenses)}
                                            </div>
                                        </div>
                                        <div className="bg-theme-secondary card" style={{
                                            padding: '20px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-primary)',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚖️</div>
                                            <div className="text-theme-secondary" style={{ fontSize: '12px', marginBottom: '4px' }}>Bilans</div>
                                            <div style={{
                                                fontSize: '20px',
                                                fontWeight: 'bold',
                                                color: monthData.balance >= 0 ? 'var(--accent-success)' : 'var(--accent-error)'
                                            }}>
                                                {monthData.balance >= 0 ? '+' : ''}{formatMoney(monthData.balance)}
                                            </div>
                                        </div>
                                        <div className="bg-theme-secondary card" style={{
                                            padding: '20px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-primary)',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
                                            <div className="text-theme-secondary" style={{ fontSize: '12px', marginBottom: '4px' }}>Oszczędności</div>
                                            <div style={{
                                                fontSize: '20px',
                                                fontWeight: 'bold',
                                                color: monthData.income > 0 ? (Math.round((monthData.balance / monthData.income) * 100) >= 20 ? 'var(--accent-success)' : Math.round((monthData.balance / monthData.income) * 100) >= 10 ? 'var(--accent-warning)' : 'var(--accent-error)') : 'var(--accent-error)'
                                            }}>
                                                {monthData.income > 0 ? Math.round((monthData.balance / monthData.income) * 100) : 0}%
                                            </div>
                                        </div>
                                    </div>

                                    {/* KOPERTY */}
                                    {monthData.envelopes.length > 0 && (
                                        <div className="bg-theme-secondary card" style={{
                                            padding: '24px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-primary)'
                                        }}>
                                            <h3 className="section-header" style={{
                                                fontSize: '18px',
                                                fontWeight: '600',
                                                marginBottom: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                color: 'var(--text-primary)'
                                            }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    📦 Wydatki z kopert ({monthData.envelopes.length})
                                                </span>
                                                <span style={{ 
                                                    fontSize: '16px', 
                                                    fontWeight: 'bold', 
                                                    color: 'var(--accent-error)',
                                                    backgroundColor: 'var(--bg-warning)',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px'
                                                }}>
                                                    {formatMoney(monthData.envelopes.reduce((sum, env) => sum + env.totalSpent, 0))}
                                                </span>
                                            </h3>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {monthData.envelopes.map((envelope, index) => {
                                                    const isExpanded = expandedEnvelopes.has(envelope.name)

                                                    return (
                                                        <div key={envelope.name} style={{
                                                            padding: '16px',
                                                            backgroundColor: 'var(--bg-tertiary)',
                                                            borderRadius: '6px',
                                                            border: '1px solid #f3f4f6'
                                                        }}>
                                                            <div
                                                                onClick={() => toggleEnvelope(envelope.name)}
                                                                style={{
                                                                    cursor: 'pointer',
                                                                    marginBottom: isExpanded ? '16px' : '0'
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                                                                        {envelope.icon} #{index + 1} {envelope.name}
                                                                    </span>
                                                                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{envelope.percentage}%</span>
                                                                </div>
                                                                <div style={{ fontSize: '16px', fontWeight: '700', color: '#dc2626', marginBottom: '6px' }}>
                                                                    {formatMoney(envelope.totalSpent)}
                                                                </div>
                                                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                                                                    {envelope.percentage}% wszystkich wydatków
                                                                </div>
                                                                <div style={{
                                                                    width: '100%',
                                                                    height: '4px',
                                                                    backgroundColor: 'var(--bg-quaternary)',
                                                                    borderRadius: '2px',
                                                                    overflow: 'hidden'
                                                                }}>
                                                                    <div style={{
                                                                        width: `${envelope.percentage}%`,
                                                                        height: '100%',
                                                                        backgroundColor: index === 0 ? 'var(--accent-error)' : index === 1 ? 'var(--accent-warning)' : 'var(--text-secondary)',
                                                                        transition: 'width 0.3s ease'
                                                                    }} />
                                                                </div>
                                                            </div>

                                                            {isExpanded && (
                                                                <div>
                                                                    <div style={{
                                                                        fontSize: '13px',
                                                                        fontWeight: '600',
                                                                        marginBottom: '12px',
                                                                        color: '#4b5563'
                                                                    }}>
                                                                        🏷️ Szczegóły wydatków ({envelope.categories.length} kategorii):
                                                                    </div>

                                                                    {envelope.categories.map((category) => {
                                                                        const categoryKey = `${envelope.name}-${category.name}`
                                                                        const isCategoryExpanded = expandedCategories.has(categoryKey)

                                                                        return (
                                                                            <div key={categoryKey} style={{ marginBottom: '8px' }}>
                                                                                <div
                                                                                    onClick={() => toggleCategory(categoryKey)}
                                                                                    style={{
                                                                                        cursor: 'pointer',
                                                                                        display: 'flex',
                                                                                        justifyContent: 'space-between',
                                                                                        alignItems: 'center',
                                                                                        fontSize: '12px',
                                                                                        marginBottom: isCategoryExpanded ? '8px' : '0'
                                                                                    }}
                                                                                >
                                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                                        <span>{category.icon}</span>
                                                                                        <strong>{category.name}</strong>
                                                                                    </span>
                                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                        <span style={{ fontWeight: '600' }}>
                                                                                            {formatMoney(category.amount)}
                                                                                        </span>
                                                                                        <span style={{ color: '#6b7280' }}>
                                                                                            {category.percentage}%
                                                                                        </span>
                                                                                        <span style={{
                                                                                            fontSize: '10px',
                                                                                            transform: isCategoryExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                                                                            transition: 'transform 0.2s'
                                                                                        }}>
                                                                                            ▼
                                                                                        </span>
                                                                                    </div>
                                                                                </div>

                                                                                {isCategoryExpanded && (
                                                                                    <div style={{
                                                                                        marginLeft: '16px',
                                                                                        paddingLeft: '12px',
                                                                                        borderLeft: '2px solid #e5e7eb'
                                                                                    }}>
                                                                                        <div style={{
                                                                                            fontSize: '11px',
                                                                                            color: '#6b7280',
                                                                                            marginBottom: '6px'
                                                                                        }}>
                                                                                            📝 Historia transakcji ({category.transactions.length}):
                                                                                        </div>
                                                                                        {category.transactions.map((transaction) => (
                                                                                            <div
                                                                                                key={transaction.id}
                                                                                                style={{
                                                                                                    display: 'flex',
                                                                                                    justifyContent: 'space-between',
                                                                                                    alignItems: 'center',
                                                                                                    padding: '6px 8px',
                                                                                                    backgroundColor: 'var(--bg-secondary)',
                                                                                                    borderRadius: '4px',
                                                                                                    marginBottom: '4px',
                                                                                                    border: '1px solid #f0f0f0',
                                                                                                    fontSize: '11px'
                                                                                                }}
                                                                                            >
                                                                                                <div style={{ flex: 1 }}>
                                                                                                    <div style={{ fontWeight: '500', marginBottom: '2px' }}>
                                                                                                        {transaction.description}
                                                                                                    </div>
                                                                                                    <div style={{ color: '#9ca3af' }}>
                                                                                                        {formatDate(transaction.date)}
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div style={{
                                                                                                    fontWeight: '600',
                                                                                                    color: '#dc2626'
                                                                                                }}>
                                                                                                    -{formatMoney(transaction.amount)}
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* TRANSFERY */}
                                    {monthData.transfers.length > 0 && (
                                        <div className="bg-theme-secondary card" style={{
                                            padding: '24px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-primary)'
                                        }}>
                                            <h3 className="section-header" style={{
                                                fontSize: '18px',
                                                fontWeight: '600',
                                                marginBottom: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                color: 'var(--text-primary)'
                                            }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    🔄 Transfery i przelewy ({monthData.transfers.length})
                                                </span>
                                                <span style={{ 
                                                    fontSize: '16px', 
                                                    fontWeight: 'bold', 
                                                    color: 'var(--accent-info)',
                                                    backgroundColor: 'var(--bg-info)',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px'
                                                }}>
                                                    {formatMoney(monthData.transfers.reduce((sum, transfer) => sum + transfer.amount, 0))}
                                                </span>
                                            </h3>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {monthData.transfers.map((transfer) => {
                                                    const isExpanded = expandedTransfers.has(transfer.name)

                                                    return (
                                                        <div key={transfer.name} style={{
                                                            border: '1px solid #e5e7eb',
                                                            borderRadius: '8px',
                                                            overflow: 'hidden'
                                                        }}>
                                                            <div
                                                                onClick={() => toggleTransfer(transfer.name)}
                                                                style={{
                                                                    padding: '16px',
                                                                    backgroundColor: 'var(--bg-tertiary)',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none'
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                    <span style={{ fontSize: '20px' }}>{transfer.icon}</span>
                                                                    <div>
                                                                        <div style={{ fontSize: '16px', fontWeight: '600' }}>
                                                                            {transfer.name}
                                                                        </div>
                                                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                                            {transfer.transactions.length} transakcji
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                    <div style={{ textAlign: 'right' }}>
                                                                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>
                                                                            -{formatMoney(transfer.amount)}
                                                                        </div>
                                                                    </div>
                                                                    <span style={{
                                                                        fontSize: '14px',
                                                                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                                                        transition: 'transform 0.2s'
                                                                    }}>
                                                                        ▶
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {isExpanded && (
                                                                <div style={{ padding: '16px' }}>
                                                                    {transfer.transactions.map((transaction) => (
                                                                        <div
                                                                            key={transaction.id}
                                                                            style={{
                                                                                display: 'flex',
                                                                                justifyContent: 'space-between',
                                                                                alignItems: 'center',
                                                                                padding: '12px',
                                                                                backgroundColor: 'var(--bg-tertiary)',
                                                                                borderRadius: '6px',
                                                                                marginBottom: '8px',
                                                                                border: '1px solid #e2e8f0'
                                                                            }}
                                                                        >
                                                                            <div style={{ flex: 1 }}>
                                                                                <div style={{ fontSize: '14px', fontWeight: '500' }}>
                                                                                    {transaction.description}
                                                                                </div>
                                                                                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                                                                    {formatDate(transaction.date)}
                                                                                </div>
                                                                            </div>
                                                                            <div style={{
                                                                                fontSize: '16px',
                                                                                fontWeight: '600',
                                                                                color: '#3b82f6'
                                                                            }}>
                                                                                -{formatMoney(transaction.amount)}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-theme-secondary card" style={{
                                    padding: '48px',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-primary)'
                                }}>
                                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>👈</div>
                                    <p className="text-theme-primary" style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '600' }}>
                                        Wybierz miesiąc z listy
                                    </p>
                                    <p className="text-theme-secondary" style={{ fontSize: '14px' }}>
                                        aby zobaczyć hierarchiczne podsumowanie wydatków
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}