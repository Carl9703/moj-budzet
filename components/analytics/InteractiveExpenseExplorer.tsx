'use client'

import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, Search, DollarSign, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface SpendingTreeNode {
  type: 'GROUP' | 'ENVELOPE' | 'CATEGORY' | 'TRANSACTION'
  id: string
  name: string
  total: number
  comparison?: {
    previousTotal: number
    change: number
    changePercent: number
  }
  children?: SpendingTreeNode[]
  // Dodatkowe pola dla transakcji
  date?: string
  description?: string
  amount?: number
}

interface InteractiveExpenseExplorerProps {
  data: SpendingTreeNode[]
  compareMode: boolean
  onItemClick?: (item: SpendingTreeNode) => void
  loading?: boolean
}

export function InteractiveExpenseExplorer({ 
  data, 
  compareMode,
  onItemClick, 
  loading = false 
}: InteractiveExpenseExplorerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('pl-PL') + ' zł'
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const getChangeColor = (change: number) => {
    if (change === 0) return 'var(--text-secondary)'
    return change > 0 ? 'var(--accent-error)' : 'var(--accent-success)'
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp size={14} />
    if (change < 0) return <TrendingDown size={14} />
    return <Minus size={14} />
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'GROUP': return '🏠'
      case 'ENVELOPE': return '📁'
      case 'CATEGORY': return '🏷️'
      case 'TRANSACTION': return '💰'
      default: return '📦'
    }
  }

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const handleItemClick = (item: SpendingTreeNode) => {
    setSelectedItem(item.id)
    onItemClick?.(item)
    
    // Jeśli to nie transakcja, rozwiń/zwij
    if (item.type !== 'TRANSACTION' && item.children && item.children.length > 0) {
      toggleExpanded(item.id)
    }
  }

  // Filtrowanie danych na podstawie wyszukiwania
  const filteredData = useMemo(() => {
    if (!searchTerm) return data

    const filterTree = (nodes: SpendingTreeNode[]): SpendingTreeNode[] => {
      return nodes.filter(node => {
        const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase())
        const hasMatchingChildren = node.children ? filterTree(node.children).length > 0 : false
        
        if (matchesSearch || hasMatchingChildren) {
          return {
            ...node,
            children: node.children ? filterTree(node.children) : undefined
          }
        }
        return false
      }).map(node => ({
        ...node,
        children: node.children ? filterTree(node.children) : undefined
      }))
    }

    return filterTree(data)
  }, [data, searchTerm])

  const renderTreeNode = (node: SpendingTreeNode, level: number = 0) => {
    const isExpanded = expandedItems.has(node.id)
    const isSelected = selectedItem === node.id
    const hasChildren = node.children && node.children.length > 0
    const isTransaction = node.type === 'TRANSACTION'

    return (
      <div key={node.id}>
        <div
          onClick={() => handleItemClick(node)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: isTransaction ? '8px 16px' : '12px 16px',
            marginLeft: `${level * 20}px`,
            backgroundColor: isSelected ? 'var(--accent-primary-alpha)' : 'transparent',
            border: isSelected ? '1px solid var(--accent-primary)' : '1px solid transparent',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '4px',
            fontSize: isTransaction ? '14px' : '16px'
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          {/* Ikona rozwijania */}
          {hasChildren && !isTransaction && (
            <div style={{
              marginRight: '8px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center'
            }}>
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          )}
          
          {/* Ikona typu */}
          <div style={{
            marginRight: '12px',
            fontSize: isTransaction ? '16px' : '20px'
          }}>
            {getItemIcon(node.type)}
          </div>

          {/* Nazwa */}
          <div style={{
            flex: 1,
            color: 'var(--text-primary)',
            fontWeight: isTransaction ? '400' : '500'
          }}>
            {node.name}
          </div>

          {/* Kwota i porównanie */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {/* Kwota */}
            <div style={{
              fontSize: isTransaction ? '14px' : '16px',
              fontWeight: '600',
              color: isTransaction ? 'var(--text-secondary)' : 'var(--text-primary)'
            }}>
              {formatMoney(node.total)}
            </div>

            {/* Porównanie */}
            {compareMode && node.comparison && !isTransaction && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: getChangeColor(node.comparison.change)
              }}>
                {getChangeIcon(node.comparison.change)}
                {formatPercentage(node.comparison.changePercent)}
              </div>
            )}

            {/* Data dla transakcji */}
            {isTransaction && node.date && (
              <div style={{
                fontSize: '12px',
                color: 'var(--text-tertiary)'
              }}>
                {new Date(node.date).toLocaleDateString('pl-PL')}
              </div>
            )}
          </div>
        </div>

        {/* Dzieci */}
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
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
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '50%',
            animation: 'pulse 2s infinite'
          }} />
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
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
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            Brak danych do wyświetlenia
          </div>
          <div style={{ fontSize: '14px' }}>
            Dodaj transakcje, aby zobaczyć hierarchiczną strukturę wydatków
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
      {/* Nagłówek */}
      <div style={{
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🔍 Interaktywny Eksplorator Wydatków
        </h3>
        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          margin: '0'
        }}>
          Kliknij na pozycję, aby ją rozwinąć lub zobaczyć szczegóły
        </p>
      </div>

      {/* Wyszukiwanie */}
      <div style={{
        marginBottom: '20px',
        position: 'relative'
      }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Search 
            size={20} 
            style={{
              position: 'absolute',
              left: '12px',
              color: 'var(--text-tertiary)',
              zIndex: 1
            }}
          />
          <input
            type="text"
            placeholder="Wyszukaj wydatki (np. 'paliwo', 'transport')..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 44px',
              borderRadius: '8px',
              border: '1px solid var(--border-primary)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent-primary)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-primary)'
            }}
          />
        </div>
      </div>

      {/* Lista hierarchiczna */}
      <div style={{
        maxHeight: '600px',
        overflowY: 'auto',
        border: '1px solid var(--border-primary)',
        borderRadius: '8px',
        backgroundColor: 'var(--bg-primary)'
      }}>
        {filteredData.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            <Search size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              Nie znaleziono wyników
            </div>
            <div style={{ fontSize: '14px' }}>
              Spróbuj zmienić wyszukiwane hasło
            </div>
          </div>
        ) : (
          <div style={{ padding: '8px' }}>
            {filteredData.map(node => renderTreeNode(node))}
          </div>
        )}
      </div>

      {/* Podsumowanie */}
      {searchTerm && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '8px',
          border: '1px solid var(--border-primary)',
          fontSize: '14px',
          color: 'var(--text-secondary)'
        }}>
          Znaleziono {filteredData.length} pozycji dla hasła "{searchTerm}"
        </div>
      )}
    </div>
  )
}
