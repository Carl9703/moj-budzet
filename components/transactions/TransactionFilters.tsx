'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Calendar, Filter, X, ChevronDown } from 'lucide-react'
import { getCategoryIcon, getCategoryName } from '@/lib/constants/categories'

interface FilterOptions {
  categories: string[]
  groups: string[]
  envelopes: Array<{
    id: string
    name: string
    icon: string
    group: string
  }>
}

interface TransactionFiltersProps {
  onFiltersChange: (filters: FilterState) => void
  filterOptions: FilterOptions
  loading?: boolean
}

export interface FilterState {
  search: string
  startDate: string
  endDate: string
  type: string
  category: string
  group: string
  envelope: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export function TransactionFilters({ onFiltersChange, filterOptions, loading = false }: TransactionFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    startDate: '',
    endDate: '',
    type: '',
    category: '',
    group: '',
    envelope: '',
    sortBy: 'date',
    sortOrder: 'desc'
  })

  const [isExpanded, setIsExpanded] = useState(true)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // Aktualizuj licznik aktywnych filtrów
  useEffect(() => {
    const count = Object.values(filters).filter(value => 
      value !== '' && value !== 'date' && value !== 'desc'
    ).length
    setActiveFiltersCount(count)
  }, [filters])

  // Debounced search function
  const debouncedSearch = useCallback((searchValue: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    const timeout = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchValue })
    }, 500) // 500ms delay
    
    setSearchTimeout(timeout)
  }, [filters, onFiltersChange, searchTimeout])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    if (key === 'search') {
      // Update local state immediately for UI responsiveness
      setFilters(prev => ({ ...prev, [key]: value }))
      // Use debounced version for API calls
      debouncedSearch(value)
    } else {
      // For other filters, update immediately
      const newFilters = { ...filters, [key]: value }
      setFilters(newFilters)
      onFiltersChange(newFilters)
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      search: '',
      startDate: '',
      endDate: '',
      type: '',
      category: '',
      group: '',
      envelope: '',
      sortBy: 'date',
      sortOrder: 'desc'
    }
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const toggleSortOrder = () => {
    const newOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc'
    handleFilterChange('sortOrder', newOrder)
  }

  const getGroupTranslation = (group: string) => {
    const translations: Record<string, string> = {
      'needs': 'Potrzeby',
      'lifestyle': 'Styl życia',
      'financial': 'Cele finansowe',
      'target': 'Fundusze celowe'
    }
    return translations[group] || group
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border-primary)',
      boxShadow: 'var(--shadow-md)',
      marginBottom: '20px',
      overflow: 'hidden'
    }}>
      {/* Nagłówek z przyciskami */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-primary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Filter size={20} color="var(--accent-primary)" />
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Filtry i wyszukiwanie
          </h3>
          {activeFiltersCount > 0 && (
            <span style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              fontSize: '12px',
              fontWeight: '600',
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              {activeFiltersCount}
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <X size={14} />
              Wyczyść
            </button>
          )}
        </div>
      </div>

      {/* Panel filtrów */}
        <div style={{ padding: '20px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}>
            {/* Wyszukiwanie tekstowe */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}>
                Wyszukaj w opisie
              </label>
              <div style={{ position: 'relative' }}>
                <Search 
                  size={16} 
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-tertiary)'
                  }}
                />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="np. zakupy, rachunek..."
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Typ transakcji */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}>
                Typ transakcji
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              >
                <option value="">Wszystkie typy</option>
                <option value="income">💰 Przychody</option>
                <option value="expense">💸 Wydatki</option>
                <option value="transfer">🔄 Transfery</option>
              </select>
            </div>

            {/* Kategoria */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}>
                Kategoria
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              >
                <option value="">Wszystkie kategorie</option>
                {filterOptions.categories.map(category => (
                  <option key={category} value={category}>
                    {getCategoryIcon(category)} {getCategoryName(category)}
                  </option>
                ))}
              </select>
            </div>

            {/* Grupa kopert */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}>
                Grupa kopert
              </label>
              <select
                value={filters.group}
                onChange={(e) => handleFilterChange('group', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              >
                <option value="">Wszystkie grupy</option>
                {filterOptions.groups.map(group => (
                  <option key={group} value={group}>
                    {getGroupTranslation(group)}
                  </option>
                ))}
              </select>
            </div>

            {/* Koperta */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}>
                Koperta
              </label>
              <select
                value={filters.envelope}
                onChange={(e) => handleFilterChange('envelope', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              >
                <option value="">Wszystkie koperty</option>
                {filterOptions.envelopes.map(envelope => (
                  <option key={envelope.id} value={envelope.id}>
                    {envelope.icon} {envelope.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtry dat */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}>
                Data od
              </label>
              <div style={{ position: 'relative' }}>
                <Calendar 
                  size={16} 
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-tertiary)'
                  }}
                />
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}>
                Data do
              </label>
              <div style={{ position: 'relative' }}>
                <Calendar 
                  size={16} 
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-tertiary)'
                  }}
                />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Sortowanie */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '8px',
            border: '1px solid var(--border-primary)'
          }}>
            <span style={{
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--text-secondary)'
            }}>
              Sortuj według:
            </span>
            
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              style={{
                padding: '6px 10px',
                border: '1px solid var(--border-primary)',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '13px'
              }}
            >
              <option value="date">Data</option>
              <option value="amount">Kwota</option>
              <option value="description">Opis</option>
              <option value="type">Typ</option>
            </select>
            
            <button
              onClick={toggleSortOrder}
              style={{
                padding: '6px 10px',
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {filters.sortOrder === 'asc' ? '↑ Rosnąco' : '↓ Malejąco'}
            </button>
          </div>
        </div>
    </div>
  )
}
