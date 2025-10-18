'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { ChevronRight, ChevronDown, Search, DollarSign, TrendingUp, TrendingDown, Minus, Filter, X } from 'lucide-react'

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
  date?: string
  description?: string
  amount?: number
}

interface InteractiveExpenseExplorerProps {
  data: SpendingTreeNode[]
  compareMode: boolean
  onItemClick?: (item: SpendingTreeNode | null) => void
  loading?: boolean
  highlightedGroup?: string | null
  highlightedEnvelope?: string | null
}

// Professional icon mapping with fallbacks
const getItemIcon = (type: string, name?: string): string => {
  const iconMap: Record<string, Record<string, string>> = {
    GROUP: {
      'Potrzeby': '🏠',
      'Styl Życia': '🎯', 
      'Cele Finansowe': '💰',
      'Fundusze Celowe': '🎯',
      'default': '📦'
    },
    ENVELOPE: {
      'Mieszkanie': '🏠',
      'Żywność': '🍕',
      'Transport': '🚗',
      'Zdrowie i Higiena': '💊',
      'Rachunki i Subskrypcje': '📱',
      'Wydatki Osobiste': '🎮',
      'Gastronomia': '🍽️',
      'Ubrania i Akcesoria': '👕',
      'Fundusz Awaryjny': '🚨',
      'Budowanie Przyszłości': '📈',
      'Auto: Serwis i Ubezpieczenie': '🚗',
      'Prezenty i Okazje': '🎁',
      'Podróże': '✈️',
      'Wesele': '💍',
      'default': '📁'
    },
    CATEGORY: {
      'Wspólne opłaty': '🏠',
      'Paliwo': '⛽',
      'Lekarz i Leki': '👨‍⚕️',
      'Telefon(y)': '📱',
      'Hobby': '🎮',
      'Restauracje': '🍕',
      'Odzież': '👕',
      'IKE': '📈',
      'Wakacje': '✈️',
      'default': '🏷️'
    },
    TRANSACTION: {
      'default': '💰'
    }
  }

  return iconMap[type]?.[name || ''] || iconMap[type]?.default || '📦'
}

// Professional money formatter
const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Professional percentage formatter
const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

// Professional date formatter
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Professional change color logic
const getChangeColor = (change: number): string => {
    if (change === 0) return 'var(--text-secondary)'
    return change > 0 ? 'var(--accent-error)' : 'var(--accent-success)'
  }

// Professional change icon
  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp size={14} />
    if (change < 0) return <TrendingDown size={14} />
    return <Minus size={14} />
  }

// Professional tree node component
interface TreeNodeProps {
  node: SpendingTreeNode
  level: number
  isExpanded: boolean
  isSelected: boolean
  isHighlighted: boolean
  compareMode: boolean
  onToggle: (nodeId: string) => void
  onSelect: (node: SpendingTreeNode) => void
}

const TreeNode: React.FC<TreeNodeProps> = React.memo(({
  node,
  level,
  isExpanded,
  isSelected,
  isHighlighted,
  compareMode,
  onToggle,
  onSelect
}) => {
  const hasChildren = node.children && node.children.length > 0
  const isTransaction = node.type === 'TRANSACTION'
  const indentLevel = level * 24

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (hasChildren && !isTransaction) {
      onToggle(node.id)
    }
    onSelect(node)
  }, [hasChildren, isTransaction, node.id, node, onToggle, onSelect])

  const nodeStyle: React.CSSProperties = {
            display: 'flex',
            alignItems: 'center',
            padding: isTransaction ? '8px 16px' : '12px 16px',
    marginLeft: `${indentLevel}px`,
            backgroundColor: isSelected 
              ? 'var(--accent-primary-alpha)' 
              : isHighlighted 
                ? 'var(--accent-primary-alpha)' 
                : 'transparent',
            border: isSelected 
              ? '2px solid var(--accent-primary)' 
              : isHighlighted 
                ? '2px solid var(--accent-primary)' 
                : '1px solid transparent',
            borderRadius: '8px',
            cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    marginBottom: '2px',
            fontSize: isTransaction ? '14px' : '16px',
    transform: isHighlighted ? 'scale(1.01)' : 'scale(1)',
    boxShadow: isHighlighted ? '0 4px 12px rgba(59, 130, 246, 0.15)' : 'none',
    position: 'relative'
  }

  return (
    <div
      onClick={handleClick}
      style={nodeStyle}
          onMouseEnter={(e) => {
            if (!isSelected && !isHighlighted) {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected && !isHighlighted) {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
      {/* Expand/Collapse Icon */}
          {hasChildren && !isTransaction && (
            <div style={{
              marginRight: '8px',
              color: 'var(--text-secondary)',
              display: 'flex',
          alignItems: 'center',
          transition: 'transform 0.2s ease'
            }}>
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          )}
          
      {/* Item Icon */}
          <div style={{
            marginRight: '12px',
        fontSize: isTransaction ? '16px' : '20px',
        display: 'flex',
        alignItems: 'center'
          }}>
            {getItemIcon(node.type, node.name)}
          </div>

      {/* Name */}
          <div style={{
            flex: 1,
            color: 'var(--text-primary)',
        fontWeight: isTransaction ? '400' : '500',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
          }}>
            {node.name}
          </div>

      {/* Amount and Comparison */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
        gap: '12px',
        flexShrink: 0
          }}>
        {/* Amount */}
            <div style={{
              fontSize: isTransaction ? '14px' : '16px',
              fontWeight: '600',
              color: isTransaction ? 'var(--text-secondary)' : 'var(--text-primary)'
            }}>
              {formatMoney(node.total)}
            </div>

        {/* Comparison */}
            {compareMode && node.comparison && !isTransaction && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '2px',
                fontSize: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: getChangeColor(node.comparison.change),
                  fontWeight: '600'
                }}>
                  {getChangeIcon(node.comparison.change)}
                  {formatPercentage(node.comparison.changePercent)}
                </div>
                <div style={{
                  color: 'var(--text-tertiary)',
                  fontSize: '10px'
                }}>
                  Poprzednio: {formatMoney(node.comparison.previousTotal)}
                </div>
              </div>
            )}

        {/* Date for transactions */}
            {isTransaction && node.date && (
              <div style={{
                fontSize: '12px',
                color: 'var(--text-tertiary)'
              }}>
            {formatDate(node.date)}
              </div>
            )}
          </div>
        </div>
  )
})

TreeNode.displayName = 'TreeNode'

// Professional search component
interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder }) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClear = useCallback(() => {
    onChange('')
    inputRef.current?.focus()
  }, [onChange])

  return (
    <div style={{ position: 'relative', marginBottom: '20px' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search 
          size={20} 
          style={{
            position: 'absolute',
            left: '12px',
            color: 'var(--text-tertiary)',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder || "Wyszukaj wydatki..."}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 12px 12px 44px',
            borderRadius: '8px',
            border: '1px solid var(--border-primary)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            outline: 'none',
            transition: 'all 0.2s ease',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--accent-primary)'
            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-primary)'
            e.target.style.boxShadow = 'none'
          }}
        />
        {value && (
          <button
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-tertiary)',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--text-tertiary)'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

// Professional tree renderer with virtualization support
interface TreeRendererProps {
  nodes: SpendingTreeNode[]
  expandedItems: Set<string>
  selectedItem: string | null
  highlightedGroup: string | null
  highlightedEnvelope: string | null
  compareMode: boolean
  onToggle: (nodeId: string) => void
  onSelect: (node: SpendingTreeNode) => void
}

const TreeRenderer: React.FC<TreeRendererProps> = ({
  nodes,
  expandedItems,
  selectedItem,
  highlightedGroup,
  highlightedEnvelope,
  compareMode,
  onToggle,
  onSelect
}) => {
  const renderNode = useCallback((node: SpendingTreeNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedItems.has(node.id)
    const isSelected = selectedItem === node.id
    const isHighlighted = 
      (node.type === 'GROUP' && highlightedGroup === node.name) ||
      (node.type === 'ENVELOPE' && highlightedEnvelope === node.name)

    return (
      <div key={node.id}>
        <TreeNode
          node={node}
          level={level}
          isExpanded={isExpanded}
          isSelected={isSelected}
          isHighlighted={isHighlighted}
          compareMode={compareMode}
          onToggle={onToggle}
          onSelect={onSelect}
        />
        
        {/* Children with smooth animation */}
        {node.children && isExpanded && (
          <div style={{
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: 'slideDown 0.3s ease-out'
          }}>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }, [expandedItems, selectedItem, highlightedGroup, highlightedEnvelope, compareMode, onToggle, onSelect])

  return (
    <div style={{ padding: '8px' }}>
      {nodes.map(node => renderNode(node))}
    </div>
  )
}

// Main component
export function InteractiveExpenseExplorer({ 
  data, 
  compareMode,
  onItemClick, 
  loading = false,
  highlightedGroup = null,
  highlightedEnvelope = null
}: InteractiveExpenseExplorerProps) {
  // Professional state management
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  // Professional memoized callbacks
  const handleToggle = useCallback((nodeId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }, [])

  const handleSelect = useCallback((node: SpendingTreeNode) => {
    if (selectedItem === node.id) {
      setSelectedItem(null)
      onItemClick?.(null)
    } else {
      setSelectedItem(node.id)
      onItemClick?.(node)
    }
  }, [selectedItem, onItemClick])

  // Professional search filtering with performance optimization
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data

    const searchLower = searchTerm.toLowerCase()
    
    const filterTree = (nodes: SpendingTreeNode[]): SpendingTreeNode[] => {
      return nodes.reduce<SpendingTreeNode[]>((acc, node) => {
        const matchesSearch = node.name.toLowerCase().includes(searchLower)
        const filteredChildren = node.children ? filterTree(node.children) : []
        
        if (matchesSearch || filteredChildren.length > 0) {
          acc.push({
            ...node,
            children: filteredChildren.length > 0 ? filteredChildren : node.children
          })
        }
        
        return acc
      }, [])
    }

    return filterTree(data)
  }, [data, searchTerm])

  // Auto-expand highlighted items
  useEffect(() => {
    if (highlightedGroup || highlightedEnvelope) {
      const findAndExpand = (nodes: SpendingTreeNode[]): void => {
        nodes.forEach(node => {
          if (
            (node.type === 'GROUP' && node.name === highlightedGroup) ||
            (node.type === 'ENVELOPE' && node.name === highlightedEnvelope)
          ) {
            setExpandedItems(prev => new Set(Array.from(prev).concat(node.id)))
          }
          if (node.children) {
            findAndExpand(node.children)
          }
        })
      }
      findAndExpand(data)
    }
  }, [highlightedGroup, highlightedEnvelope, data])

  // Professional loading state
  if (loading) {
    return (
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '32px',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
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
            Ładowanie eksploratora wydatków...
          </div>
        </div>
      </div>
    )
  }

  // Professional empty state
  if (!data || data.length === 0) {
    return (
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '32px',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '24px'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
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
      {/* Professional Header */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🔍 Interaktywny Eksplorator Wydatków
        </h3>
        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          margin: '0',
          lineHeight: '1.5'
        }}>
          Kliknij na pozycję, aby ją rozwinąć lub zobaczyć szczegóły. Użyj wyszukiwania, aby szybko znaleźć konkretne wydatki.
        </p>
      </div>

      {/* Professional Search */}
      <SearchBar
            value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Wyszukaj wydatki (np. 'paliwo', 'transport', 'mieszkanie')..."
      />

      {/* Professional Tree Container */}
      <div style={{
        maxHeight: '90vh',
        minHeight: '70vh',
        overflowY: 'auto',
        border: '1px solid var(--border-primary)',
        borderRadius: '8px',
        backgroundColor: 'var(--bg-primary)',
        position: 'relative'
      }}>
        {filteredData.length === 0 ? (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            <Search size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              Nie znaleziono wyników
            </div>
            <div style={{ fontSize: '14px' }}>
              Spróbuj zmienić wyszukiwane hasło lub sprawdź pisownię
            </div>
          </div>
        ) : (
          <TreeRenderer
            nodes={filteredData}
            expandedItems={expandedItems}
            selectedItem={selectedItem}
            highlightedGroup={highlightedGroup}
            highlightedEnvelope={highlightedEnvelope}
            compareMode={compareMode}
            onToggle={handleToggle}
            onSelect={handleSelect}
          />
        )}
      </div>

      {/* Professional Search Summary */}
      {searchTerm && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '8px',
          border: '1px solid var(--border-primary)',
          fontSize: '14px',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Filter size={16} />
          <span>
            Znaleziono <strong>{filteredData.length}</strong> pozycji dla hasła "<strong>{searchTerm}</strong>"
          </span>
        </div>
      )}
    </div>
  )
}