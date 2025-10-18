'use client'

import { useState } from 'react'

interface TransactionDetail {
    id: string
    amount: number
    description: string
    date: string
    envelopeName: string
    envelopeIcon: string
}

interface CategoryAnalysis {
    categoryId: string
    categoryName: string
    categoryIcon: string
    totalAmount: number
    transactionCount: number
    avgTransactionAmount: number
    percentage: number
    envelopeBreakdown: {
        envelopeName: string
        envelopeIcon: string
        amount: number
        percentage: number
    }[]
    monthlyTrend: {
        month: string
        year: number
        amount: number
    }[]
    transactions: TransactionDetail[]
}

interface CategoryAnalyticsData {
    categoryAnalysis: CategoryAnalysis[]
    totalExpenses: number
    period: string
    summary: {
        totalCategories: number
        totalTransactions: number
        avgTransactionAmount: number
    }
}

interface Props {
    isLoading: boolean
    categories: CategoryAnalysis[] | undefined
    selectedPeriod: string
    onPeriodChange: (period: string) => void
    sortBy: 'amount' | 'transactions' | 'name'
    setSortBy: (value: 'amount' | 'transactions' | 'name') => void
    filterText: string
    setFilterText: (text: string) => void
    expandedCategories: Set<string>
    setExpandedCategories: (value: Set<string>) => void
    expandedTransactions: Set<string>
    setExpandedTransactions: (value: Set<string>) => void
}

export function CategoryAnalysis({ 
    isLoading, 
    categories, 
    selectedPeriod, 
    onPeriodChange, 
    sortBy, 
    setSortBy, 
    filterText, 
    setFilterText,
    expandedCategories,
    setExpandedCategories,
    expandedTransactions,
    setExpandedTransactions
}: Props) {

    const periodOptions = [
        { value: 'currentMonth', label: 'Bieżący miesiąc' },
        { value: '1month', label: 'Ostatni miesiąc' },
        { value: '3months', label: 'Ostatnie 3 miesiące' },
        { value: '6months', label: 'Ostatnie 6 miesięcy' },
        { value: 'currentYear', label: 'Bieżący rok' }
    ]

    const formatMoney = (amount: number) => amount.toLocaleString('pl-PL') + ' zł'

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const toggleCategory = (categoryId: string) => {
        const newExpanded = new Set(expandedCategories)
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId)
        } else {
            newExpanded.add(categoryId)
        }
        setExpandedCategories(newExpanded)
    }

    const toggleTransactions = (categoryId: string) => {
        const newExpanded = new Set(expandedTransactions)
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId)
        } else {
            newExpanded.add(categoryId)
        }
        setExpandedTransactions(newExpanded)
    }

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '200px'
            }}>
                <div className="text-theme-secondary" style={{ fontSize: '18px' }}>
                    📊 Ładowanie analiz kategorii...
                </div>
            </div>
        )
    }

    if (!categories) {
        return (
            <div className="text-theme-primary" style={{ padding: '20px', textAlign: 'center' }}>
                Błąd ładowania danych kategorii
            </div>
        )
    }

    // Użyj przefiltrowanych i posortowanych kategorii z propsów
    const filteredCategories = categories

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* NAGŁÓWEK Z FILTROWANIEM */}
            <div style={{
                backgroundColor: 'var(--bg-secondary)',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid var(--border-primary)',
                boxShadow: 'var(--shadow-md)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🏷️ Wydatki wg kategorii
                    </h2>
                    
                    {/* SELECTOR OKRESU */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>📅</span>
                        <select
                            value={selectedPeriod}
                            onChange={(e) => onPeriodChange(e.target.value)}
                            style={{
                                padding: '6px 12px',
                                border: '1px solid var(--border-primary)',
                                borderRadius: '6px',
                                fontSize: '14px',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer'
                            }}
                        >
                            {periodOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* FILTRY I SORTOWANIE */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Wyszukiwanie */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Szukaj kategorii..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            style={{
                                padding: '6px 12px',
                                border: '1px solid var(--border-primary)',
                                borderRadius: '6px',
                                fontSize: '14px',
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-primary)',
                                width: '200px'
                            }}
                        />
                    </div>

                    {/* Sortowanie */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>📊</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'amount' | 'transactions' | 'name')}
                            style={{
                                padding: '6px 12px',
                                border: '1px solid var(--border-primary)',
                                borderRadius: '6px',
                                fontSize: '14px',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="amount">Według kwoty</option>
                            <option value="transactions">Według liczby transakcji</option>
                            <option value="name">Według nazwy</option>
                        </select>
                    </div>
                </div>

                {/* PODSUMOWANIE */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '16px', 
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-primary)'
                }}>
                    <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Kategorie z wydatkami</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                            {data.summary.totalCategories}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Łączne wydatki</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-error)' }}>
                            {formatMoney(data.totalExpenses)}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Średnia transakcja</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-success)' }}>
                            {formatMoney(data.summary.avgTransactionAmount)}
                        </div>
                    </div>
                </div>
            </div>

            {/* LISTA KATEGORII */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredCategories.map((category, index) => {
                    const isExpanded = expandedCategories.has(category.categoryId)
                    const hasExpenses = category.totalAmount > 0

                    return (
                        <div key={category.categoryId} style={{
                            border: '1px solid var(--border-primary)',
                            borderRadius: '8px',
                            backgroundColor: hasExpenses ? 'var(--bg-tertiary)' : 'var(--bg-quaternary)',
                            opacity: hasExpenses ? 1 : 0.6
                        }}>
                            {/* GŁÓWNY RZĄD KATEGORII */}
                            <div
                                onClick={() => hasExpenses && toggleCategory(category.categoryId)}
                                style={{
                                    padding: '16px',
                                    cursor: hasExpenses ? 'pointer' : 'default',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderRadius: '8px',
                                    backgroundColor: 'var(--bg-secondary)',
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '24px' }}>{category.categoryIcon}</span>
                                    <div>
                                        <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                            #{index + 1} {category.categoryName}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            {hasExpenses 
                                                ? `${category.transactionCount} transakcji • średnio ${formatMoney(category.avgTransactionAmount)}`
                                                : 'Brak wydatków w tym okresie'
                                            }
                                        </div>
                                    </div>
                                </div>

                                {hasExpenses && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-error)' }}>
                                                {formatMoney(category.totalAmount)}
                                            </div>
                                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                                {category.percentage}% wszystkich wydatków
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>
                                            {isExpanded ? '▼' : '▶'}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* SZCZEGÓŁY KATEGORII */}
                            {isExpanded && hasExpenses && (
                                <div style={{ padding: '0 16px 16px' }}>
                                    {/* BREAKDOWN KOPERT */}
                                    {category.envelopeBreakdown.length > 0 && (
                                        <div style={{ marginBottom: '16px' }}>
                                            <h4 style={{
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                marginBottom: '8px',
                                                color: 'var(--text-primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                📦 Wydatki według kopert:
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {category.envelopeBreakdown.map((envelope) => (
                                                    <div key={envelope.envelopeName} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '8px 12px',
                                                        backgroundColor: 'var(--bg-tertiary)',
                                                        borderRadius: '4px',
                                                        fontSize: '14px'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '16px' }}>{envelope.envelopeIcon}</span>
                                                            <span style={{ fontWeight: '500' }}>{envelope.envelopeName}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <span style={{ color: 'var(--accent-error)', fontWeight: '600' }}>
                                                                {formatMoney(envelope.amount)}
                                                            </span>
                                                            <span style={{
                                                                fontSize: '12px',
                                                                color: 'var(--text-secondary)',
                                                                minWidth: '40px',
                                                                textAlign: 'right'
                                                            }}>
                                                                {envelope.percentage}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* TREND MIESIĘCZNY */}
                                    {category.monthlyTrend.length > 0 && (
                                        <div style={{ marginBottom: '16px' }}>
                                            <h4 style={{
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                marginBottom: '8px',
                                                color: 'var(--text-primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                📈 Trend miesięczny:
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {category.monthlyTrend.slice(-6).map((month, i) => (
                                                    <div key={`${month.year}-${month.month}`} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '6px 12px',
                                                        backgroundColor: 'var(--bg-tertiary)',
                                                        borderRadius: '4px',
                                                        fontSize: '13px'
                                                    }}>
                                                        <span style={{ color: 'var(--text-secondary)' }}>
                                                            {month.month} {month.year}
                                                        </span>
                                                        <span style={{ color: 'var(--accent-error)', fontWeight: '600' }}>
                                                            {formatMoney(month.amount)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* SZCZEGÓŁY TRANSAKCJI */}
                                    {category.transactions.length > 0 && (
                                        <div>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '8px'
                                            }}>
                                                <h4 style={{
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    color: 'var(--text-primary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    margin: 0
                                                }}>
                                                    💳 Szczegóły transakcji:
                                                </h4>
                                                <button
                                                    onClick={() => toggleTransactions(category.categoryId)}
                                                    style={{
                                                        padding: '4px 8px',
                                                        backgroundColor: 'var(--bg-tertiary)',
                                                        border: '1px solid var(--border-primary)',
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        color: 'var(--text-primary)',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'var(--accent-primary)'
                                                        e.currentTarget.style.color = '#ffffff'
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                                                        e.currentTarget.style.color = 'var(--text-primary)'
                                                    }}
                                                >
                                                    {expandedTransactions.has(category.categoryId) ? 'Ukryj' : 'Pokaż'} transakcje
                                                </button>
                                            </div>
                                            
                                            {expandedTransactions.has(category.categoryId) && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {category.transactions.map((transaction) => (
                                                        <div key={transaction.id} style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            padding: '8px 12px',
                                                            backgroundColor: 'var(--bg-tertiary)',
                                                            borderRadius: '4px',
                                                            fontSize: '13px',
                                                            border: '1px solid var(--border-primary)'
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                                <span style={{ fontSize: '14px' }}>{transaction.envelopeIcon}</span>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                                                                        {transaction.description}
                                                                    </div>
                                                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                                        {transaction.envelopeName} • {formatDate(transaction.date)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div style={{ 
                                                                color: 'var(--accent-error)', 
                                                                fontWeight: '600',
                                                                fontSize: '14px'
                                                            }}>
                                                                {formatMoney(transaction.amount)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {filteredCategories.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: 'var(--text-secondary)',
                    fontSize: '16px'
                }}>
                    🔍 Nie znaleziono kategorii pasujących do wyszukiwania
                </div>
            )}
        </div>
    )
}
