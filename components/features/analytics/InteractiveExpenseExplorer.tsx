'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { ChevronRight, ChevronDown, Search, TrendingUp, TrendingDown, Minus, Filter, X } from 'lucide-react'
import { useCategories } from '@/lib/contexts/CategoryContext'
import { motion, AnimatePresence } from 'framer-motion'

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
  categoryId?: string
  budget?: number
  budgetPercentage?: number
  icon?: string | null
}

interface InteractiveExpenseExplorerProps {
  data: SpendingTreeNode[]
  compareMode: boolean
  onItemClick?: (item: SpendingTreeNode | null) => void
  loading?: boolean
  highlightedGroup?: string | null
  highlightedEnvelope?: string | null
  forceCollapseAll?: boolean
}

const getItemIcon = (type: string, name: string | undefined, categoryId: string | undefined, icon: string | null | undefined, getCategoryIcon: (id: string) => string): string => {
  if (type === 'CATEGORY' && categoryId) {
    return getCategoryIcon(categoryId)
  }

  if (icon) return icon

  const iconMap: Record<string, Record<string, string>> = {
    GROUP: {
      'Potrzeby': '🏡',
      'Styl Życia': '🎉',
      'Cele i majątek': '💰',
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
    CATEGORY: { 'default': '🏷️' },
    TRANSACTION: { 'default': '💰' }
  }

  return iconMap[type]?.[name || ''] || iconMap[type]?.default || '📦'
}

const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

const formatPercentage = (value: number): string => {
  const sign = value >= 0 ? '+' : ''
  if (Math.abs(value) > 999) return `${sign}999%+`
  return `${sign}${value.toFixed(1)}%`
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

interface TreeNodeProps {
  node: SpendingTreeNode
  level: number
  isExpanded: boolean
  isSelected: boolean
  isHighlighted: boolean
  compareMode: boolean
  onToggle: (nodeId: string) => void
  onSelect: (node: SpendingTreeNode) => void
  getCategoryIcon: (id: string) => string
  getCategoryName: (id: string) => string
}

const TreeNode: React.FC<TreeNodeProps> = React.memo(({
  node,
  level,
  isExpanded,
  isSelected,
  isHighlighted,
  compareMode,
  onToggle,
  onSelect,
  getCategoryIcon,
  getCategoryName
}) => {
  const hasChildren = node.children && node.children.length > 0
  const isTransaction = node.type === 'TRANSACTION'

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasChildren && !isTransaction) {
      onToggle(node.id)
    }
    onSelect(node)
  }, [hasChildren, isTransaction, node, onToggle, onSelect])

  const getBudgetColor = (percentage?: number) => {
    if (!percentage) return 'bg-emerald-500'
    if (percentage > 100) return 'bg-rose-500'
    if (percentage > 80) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  const getBudgetTextColor = (percentage?: number) => {
    if (!percentage) return 'text-slate-400'
    if (percentage > 100) return 'text-rose-400'
    if (percentage > 80) return 'text-amber-400'
    return 'text-slate-400'
  }

  return (
    <motion.div
      initial={false}
      onClick={handleClick}
      className={`group relative flex items-center rounded-xl cursor-pointer transition-all mb-1.5 backdrop-blur-sm border 
        ${isTransaction ? 'py-2.5 px-4 text-sm' : 'py-3.5 px-4 text-base'} 
        ${isSelected || isHighlighted
          ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] z-10'
          : 'bg-slate-800/20 border-transparent hover:bg-slate-700/30 hover:border-slate-700/50'
        }`}
      style={{ marginLeft: `${level * 20}px` }}
    >
      {/* Connection line for nested items */}
      {level > 0 && <div className="absolute left-[-10px] top-1/2 w-[10px] h-[1px] bg-slate-700/30" />}
      {level > 0 && <div className="absolute left-[-10px] top-[-20px] bottom-1/2 w-[1px] bg-slate-700/30" />}

      {/* Expand icon */}
      {hasChildren && !isTransaction ? (
        <div className={`mr-2.5 w-5 h-5 flex items-center justify-center rounded-md transition-colors ${isSelected || isHighlighted ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 group-hover:text-slate-300'
          }`}>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      ) : (
        <div className="w-5 mr-3" /> // Spacer
      )}

      {/* Item icon */}
      <div className={`mr-3 flex items-center justify-center ${isTransaction ? 'text-lg' : 'text-xl'}`}>
        {getItemIcon(node.type, node.name, node.categoryId, node.icon, getCategoryIcon)}
      </div>

      {/* Name */}
      <div className={`flex-1 overflow-hidden text-ellipsis whitespace-nowrap pr-4 ${isTransaction ? 'text-slate-300 font-normal' : 'text-slate-100 font-medium'
        }`}>
        {node.type === 'CATEGORY' && node.categoryId ? getCategoryName(node.categoryId) : node.name}
      </div>

      {/* Amount and extras */}
      <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">

        {/* Budget progress (only on desktop mostly) */}
        {(node.type === 'GROUP' || node.type === 'ENVELOPE') && node.budget && node.budget > 0 && (
          <div className="hidden md:flex flex-col items-end min-w-[100px]">
            <div className="w-24 h-1.5 bg-slate-700/50 rounded-full overflow-hidden mb-1">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getBudgetColor(node.budgetPercentage)}`}
                style={{ width: `${Math.min(node.budgetPercentage || 0, 100)}%` }}
              />
            </div>
            <div className={`text-[10px] font-medium ${getBudgetTextColor(node.budgetPercentage)}`}>
              {Math.round(node.budgetPercentage || 0)}% budżetu
            </div>
          </div>
        )}

        {/* Current Total */}
        <div className={`font-bold tabular-nums tracking-tight ${isTransaction ? 'text-sm text-slate-400' : 'text-base text-white'
          }`}>
          {formatMoney(node.total)}
        </div>

        {/* Comparison */}
        {compareMode && node.comparison && !isTransaction && (
          <div className="flex flex-col items-end gap-0.5 min-w-[70px]">
            <div className={`flex items-center gap-1 font-semibold text-xs ${node.comparison.change > 0 ? 'text-rose-400' : node.comparison.change < 0 ? 'text-emerald-400' : 'text-slate-500'
              }`}>
              {node.comparison.change > 0 ? <TrendingUp size={12} /> : node.comparison.change < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
              {Math.abs(node.comparison.changePercent) > 999 ? (
                '999%+'
              ) : (
                formatPercentage(node.comparison.changePercent)
              )}
            </div>
            <div className="text-[10px] text-slate-600">
              vs {formatMoney(node.comparison.previousTotal)}
            </div>
          </div>
        )}

        {/* Date for transactions */}
        {isTransaction && node.date && (
          <div className="hidden sm:block text-xs text-slate-600 font-medium">{formatDate(node.date)}</div>
        )}
      </div>
    </motion.div>
  )
})

TreeNode.displayName = 'TreeNode'

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
    <div className="relative mb-6">
      <div className="relative flex items-center group">
        <Search size={20} className="absolute left-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder || "Wyszukaj wydatki..."}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full py-3.5 pl-12 pr-12 rounded-xl border border-slate-700/50 bg-slate-900/50 text-slate-100 text-sm placeholder:text-slate-600 outline-none transition-all 
            focus:bg-slate-900 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-600/50"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 p-1.5 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

interface TreeRendererProps {
  nodes: SpendingTreeNode[]
  expandedItems: Set<string>
  selectedItem: string | null
  highlightedGroup: string | null
  highlightedEnvelope: string | null
  compareMode: boolean
  onToggle: (nodeId: string) => void
  onSelect: (node: SpendingTreeNode) => void
  getCategoryIcon: (id: string) => string
  getCategoryName: (id: string) => string
}

const TreeRenderer: React.FC<TreeRendererProps> = ({
  nodes,
  expandedItems,
  selectedItem,
  highlightedGroup,
  highlightedEnvelope,
  compareMode,
  onToggle,
  onSelect,
  getCategoryIcon,
  getCategoryName
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
          getCategoryIcon={getCategoryIcon}
          getCategoryName={getCategoryName}
        />

        <AnimatePresence>
          {node.children && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {node.children.map(child => renderNode(child, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }, [expandedItems, selectedItem, highlightedGroup, highlightedEnvelope, compareMode, onToggle, onSelect, getCategoryIcon, getCategoryName])

  return (
    <div className="p-2">
      {nodes.map(node => renderNode(node))}
    </div>
  )
}

export function InteractiveExpenseExplorer({
  data,
  compareMode,
  onItemClick,
  loading = false,
  highlightedGroup = null,
  highlightedEnvelope = null,
  forceCollapseAll = false
}: InteractiveExpenseExplorerProps) {
  const { getCategoryIcon, getCategoryName } = useCategories()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

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

  useEffect(() => {
    if (forceCollapseAll) {
      setExpandedItems(new Set())
    }
  }, [forceCollapseAll])

  if (loading) {
    return (
      <div
        className="p-8 rounded-2xl border border-slate-700/30 mb-6 flex flex-col items-center justify-center min-h-[400px]"
        style={{ background: 'rgba(30, 41, 59, 0.4)' }}
      >
        <div className="w-12 h-12 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
        <div className="mt-4 text-base text-slate-400 font-medium animate-pulse">Ładowanie danych...</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="p-12 rounded-2xl border border-slate-700/30 mb-6 text-center"
        style={{ background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(12px)' }}
      >
        <div className="text-6xl mb-4 opacity-50 grayscale">📊</div>
        <div className="text-xl font-bold text-white mb-2">Brak danych</div>
        <p className="text-slate-400">Dodaj transakcje, aby zbudować drzewo wydatków.</p>
      </div>
    )
  }

  return (
    <div
      className="p-6 md:p-8 rounded-2xl border border-slate-700/30 shadow-xl mb-6 relative overflow-hidden"
      style={{
        background: 'rgba(30, 41, 59, 0.4)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

      {/* Header */}
      <div className="mb-8 relative z-10">
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
          🔍 Eksplorator Wydatków
        </h3>
        <p className="text-slate-400">
          Szczegółowa hierarchia Twoich wydatków. Kliknij element, aby zobaczyć detale.
        </p>
      </div>

      {/* Search */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}

      />

      {/* Tree */}
      <div className="max-h-[800px] min-h-[400px] overflow-y-auto custom-scrollbar border border-slate-700/50 rounded-xl bg-slate-900/30 relative backdrop-blur-sm">
        {filteredData.length === 0 ? (
          <div className="py-20 px-5 text-center text-slate-400 flex flex-col items-center">
            <Search size={48} className="mb-4 opacity-30" />
            <div className="text-lg font-semibold mb-1 text-slate-200">Brak wyników</div>
            <div className="text-sm">Nie znaleziono pozycji pasujących do "{searchTerm}"</div>
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
            getCategoryIcon={getCategoryIcon}
            getCategoryName={getCategoryName}
          />
        )}
      </div>

      {/* Search summary */}
      {searchTerm && filteredData.length > 0 && (
        <div className="mt-4 text-xs text-slate-500 text-center">
          Znaleziono {filteredData.length} głównych kategorii pasujących do wyszukiwania
        </div>
      )}
    </div>
  )
}