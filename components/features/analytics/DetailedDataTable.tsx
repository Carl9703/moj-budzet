'use client'

import { useState, useMemo } from 'react'

interface TableRow {
    name: string
    amount: number
    percentage: number
    icon: string
    comparison?: {
        previousAmount: number
        change: number
        changePercent: number
    }
}

interface DetailedDataTableProps {
    data: TableRow[]
    viewType: 'categories' | 'envelopes'
    compareMode: boolean
    loading?: boolean
    onViewTypeChange: (type: 'categories' | 'envelopes') => void
    onRowClick?: (row: TableRow) => void
}

type SortField = 'name' | 'amount' | 'percentage' | 'change'
type SortDirection = 'asc' | 'desc'

export function DetailedDataTable({ 
    data, 
    viewType, 
    compareMode, 
    loading = false,
    onViewTypeChange,
    onRowClick 
}: DetailedDataTableProps) {
    const [sortField, setSortField] = useState<SortField>('amount')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
    const [searchTerm, setSearchTerm] = useState('')

    const sortedData = useMemo(() => {
        const filtered = data.filter(row => 
            row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.icon.includes(searchTerm)
        )

        return filtered.sort((a, b) => {
            let aValue: number | string
            let bValue: number | string

            switch (sortField) {
                case 'name':
                    aValue = a.name.toLowerCase()
                    bValue = b.name.toLowerCase()
                    break
                case 'amount':
                    aValue = a.amount
                    bValue = b.amount
                    break
                case 'percentage':
                    aValue = a.percentage
                    bValue = b.percentage
                    break
                case 'change':
                    aValue = a.comparison?.change || 0
                    bValue = b.comparison?.change || 0
                    break
                default:
                    aValue = a.amount
                    bValue = b.amount
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc' 
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue)
            }

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
            }

            return 0
        })
    }, [data, sortField, sortDirection, searchTerm])

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('desc')
        }
    }

    const formatMoney = (amount: number) => amount.toLocaleString('pl-PL') + ' zł'
    
    const formatChange = (change: number) => {
        const sign = change >= 0 ? '+' : ''
        return `${sign}${formatMoney(change)}`
    }

    const formatChangePercent = (percent: number) => {
        const sign = percent >= 0 ? '+' : ''
        return `${sign}${percent.toFixed(1)}%`
    }

    const getChangeColor = (change: number, isExpense: boolean = true) => {
        if (change === 0) return 'var(--text-secondary)'
        if (isExpense) {
            return change < 0 ? 'var(--accent-success)' : 'var(--accent-error)'
        } else {
            return change > 0 ? 'var(--accent-success)' : 'var(--accent-error)'
        }
    }

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return '↕️'
        return sortDirection === 'asc' ? '↑' : '↓'
    }

    if (loading) {
        return (
            <div style={{
                backgroundColor: 'var(--bg-secondary)',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--border-primary)',
                boxShadow: 'var(--shadow-md)',
                marginBottom: '24px'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '200px'
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
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
                            color: 'var(--text-secondary)'
                        }}>
                            Ładowanie tabeli...
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-md)',
            marginBottom: '24px'
        }}>
            {/* Nagłówek z przełącznikiem */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: 0
                }}>
                    📊 Szczegółowe dane
                </h3>

                {/* Przełącznik widoku */}
                <div style={{
                    display: 'flex',
                    gap: '4px',
                    padding: '4px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-primary)'
                }}>
                    <button
                        onClick={() => onViewTypeChange('envelopes')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: viewType === 'envelopes' ? 'var(--accent-primary)' : 'transparent',
                            color: viewType === 'envelopes' ? 'white' : 'var(--text-primary)',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        📦 Koperty
                    </button>
                    <button
                        onClick={() => onViewTypeChange('categories')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: viewType === 'categories' ? 'var(--accent-primary)' : 'transparent',
                            color: viewType === 'categories' ? 'white' : 'var(--text-primary)',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        🏷️ Kategorie
                    </button>
                </div>
            </div>

            {/* Filtry i wyszukiwanie */}
            <div style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap'
            }}>
                {/* Wyszukiwanie */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flex: 1,
                    minWidth: '200px'
                }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>🔍</span>
                    <input
                        type="text"
                        placeholder={`Szukaj ${viewType === 'envelopes' ? 'kopert' : 'kategorii'}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)'
                        }}
                    />
                </div>

                {/* Statystyki */}
                <div style={{
                    display: 'flex',
                    gap: '16px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)'
                }}>
                    <span>Znaleziono: <strong>{sortedData.length}</strong></span>
                    <span>Łącznie: <strong>{formatMoney(data.reduce((sum, item) => sum + item.amount, 0))}</strong></span>
                </div>
            </div>

            {/* Tabela */}
            <div style={{
                overflow: 'auto',
                borderRadius: '8px',
                border: '1px solid var(--border-primary)'
            }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '14px'
                }}>
                    <thead>
                        <tr style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            borderBottom: '2px solid var(--border-primary)'
                        }}>
                            <th style={{
                                padding: '12px 16px',
                                textAlign: 'left',
                                fontWeight: '600',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                userSelect: 'none'
                            }} onClick={() => handleSort('name')}>
                                Nazwa {getSortIcon('name')}
                            </th>
                            <th style={{
                                padding: '12px 16px',
                                textAlign: 'right',
                                fontWeight: '600',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                userSelect: 'none'
                            }} onClick={() => handleSort('amount')}>
                                Kwota {getSortIcon('amount')}
                            </th>
                            <th style={{
                                padding: '12px 16px',
                                textAlign: 'right',
                                fontWeight: '600',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                userSelect: 'none'
                            }} onClick={() => handleSort('percentage')}>
                                % Udziału {getSortIcon('percentage')}
                            </th>
                            {compareMode && (
                                <th style={{
                                    padding: '12px 16px',
                                    textAlign: 'right',
                                    fontWeight: '600',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    userSelect: 'none'
                                }} onClick={() => handleSort('change')}>
                                    Porównanie {getSortIcon('change')}
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((row, index) => (
                            <tr
                                key={index}
                                style={{
                                    borderBottom: '1px solid var(--border-primary)',
                                    cursor: onRowClick ? 'pointer' : 'default',
                                    transition: 'background-color 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (onRowClick) {
                                        e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (onRowClick) {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                    }
                                }}
                                onClick={() => onRowClick?.(row)}
                            >
                                <td style={{ padding: '12px 16px' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <span style={{ fontSize: '20px' }}>{row.icon}</span>
                                        <div>
                                            <div style={{
                                                fontWeight: '600',
                                                color: 'var(--text-primary)'
                                            }}>
                                                {row.name}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{
                                    padding: '12px 16px',
                                    textAlign: 'right',
                                    fontWeight: '600',
                                    color: 'var(--accent-error)'
                                }}>
                                    {formatMoney(row.amount)}
                                </td>
                                <td style={{
                                    padding: '12px 16px',
                                    textAlign: 'right'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        justifyContent: 'flex-end'
                                    }}>
                                        <span style={{
                                            fontWeight: '600',
                                            color: 'var(--text-primary)'
                                        }}>
                                            {row.percentage}%
                                        </span>
                                        <div style={{
                                            width: '60px',
                                            height: '6px',
                                            backgroundColor: 'var(--bg-quaternary)',
                                            borderRadius: '3px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${row.percentage}%`,
                                                height: '100%',
                                                backgroundColor: 'var(--accent-primary)',
                                                borderRadius: '3px',
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </div>
                                    </div>
                                </td>
                                {compareMode && row.comparison && (
                                    <td style={{
                                        padding: '12px 16px',
                                        textAlign: 'right'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-end',
                                            gap: '2px'
                                        }}>
                                            <div style={{
                                                fontSize: '12px',
                                                color: 'var(--text-secondary)'
                                            }}>
                                                vs. poprzedni okres
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: getChangeColor(row.comparison.change, true)
                                            }}>
                                                <span>{row.comparison.change > 0 ? '📈' : row.comparison.change < 0 ? '📉' : '➡️'}</span>
                                                <span>{formatChange(row.comparison.change)}</span>
                                                <span>({formatChangePercent(row.comparison.changePercent)})</span>
                                            </div>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Podsumowanie */}
            {sortedData.length > 0 && (
                <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-primary)'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '16px',
                        textAlign: 'center'
                    }}>
                        <div>
                            <div style={{
                                fontSize: '12px',
                                color: 'var(--text-secondary)',
                                marginBottom: '4px'
                            }}>
                                Łączna kwota
                            </div>
                            <div style={{
                                fontSize: '16px',
                                fontWeight: 'bold',
                                color: 'var(--accent-error)'
                            }}>
                                {formatMoney(sortedData.reduce((sum, item) => sum + item.amount, 0))}
                            </div>
                        </div>
                        <div>
                            <div style={{
                                fontSize: '12px',
                                color: 'var(--text-secondary)',
                                marginBottom: '4px'
                            }}>
                                Liczba pozycji
                            </div>
                            <div style={{
                                fontSize: '16px',
                                fontWeight: 'bold',
                                color: 'var(--accent-primary)'
                            }}>
                                {sortedData.length}
                            </div>
                        </div>
                        <div>
                            <div style={{
                                fontSize: '12px',
                                color: 'var(--text-secondary)',
                                marginBottom: '4px'
                            }}>
                                Średnia kwota
                            </div>
                            <div style={{
                                fontSize: '16px',
                                fontWeight: 'bold',
                                color: 'var(--accent-success)'
                            }}>
                                {formatMoney(sortedData.reduce((sum, item) => sum + item.amount, 0) / sortedData.length)}
                            </div>
                        </div>
                        {compareMode && (
                            <div>
                                <div style={{
                                    fontSize: '12px',
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Zmiana łącznie
                                </div>
                                <div style={{
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    color: sortedData.reduce((sum, item) => sum + (item.comparison?.change || 0), 0) >= 0 
                                        ? 'var(--accent-error)' 
                                        : 'var(--accent-success)'
                                }}>
                                    {formatChange(sortedData.reduce((sum, item) => sum + (item.comparison?.change || 0), 0))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Brak danych */}
            {sortedData.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: 'var(--text-secondary)'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                        Brak danych do wyświetlenia
                    </div>
                    <div style={{ fontSize: '14px' }}>
                        {searchTerm ? 'Spróbuj zmienić kryteria wyszukiwania' : 'Dodaj transakcje w wybranym okresie'}
                    </div>
                </div>
            )}
        </div>
    )
}
