'use client'

import { useState, useEffect } from 'react'
import type React from 'react'
import { Search, Calendar, X } from 'lucide-react'
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

export function TransactionFilters({ onFiltersChange, filterOptions, loading: _loading = false }: TransactionFiltersProps) {
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

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [isActivePanelOpen, setIsActivePanelOpen] = useState(false)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)
  // Aktualizuj licznik aktywnych filtrów
  useEffect(() => {
    const count = Object.values(filters).filter(value => 
      value !== '' && value !== 'date' && value !== 'desc'
    ).length
    setActiveFiltersCount(count)
  }, [filters])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    
    // Jeśli wybieramy grupę, wyczyść filtr koperty
    if (key === 'group' && value) {
      newFilters.envelope = ''
    }
    
    // Jeśli wybieramy kopertę, wyczyść filtr grupy
    if (key === 'envelope' && value) {
      newFilters.group = ''
    }
    
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onFiltersChange(filters)
    }
  }

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

  const getTypeLabel = (type: string) => {
    if (type === 'income') return 'Przychody'
    if (type === 'expense') return 'Wydatki'
    if (type === 'transfer') return 'Transfery'
    return ''
  }

  const getEnvelopeLabel = (id: string) => {
    const env = filterOptions.envelopes.find(e => e.id === id)
    return env ? `${env.icon} ${env.name}` : ''
  }

  const getActiveFilterLabels = (): string[] => {
    const labels: string[] = []
    if (filters.search) labels.push(`Szukaj: ${filters.search}`)
    if (filters.type) labels.push(`Typ: ${getTypeLabel(filters.type)}`)
    if (filters.envelope) labels.push(`Koperta: ${getEnvelopeLabel(filters.envelope)}`)
    if (filters.category) labels.push(`Kategoria: ${getCategoryName(filters.category)}`)
    if (filters.group) labels.push(`Grupa: ${getGroupTranslation(filters.group)}`)
    if (filters.startDate) labels.push(`Od: ${filters.startDate}`)
    if (filters.endDate) labels.push(`Do: ${filters.endDate}`)
    return labels
  }

  const clearFilter = (key: keyof FilterState) => {
    const newFilters = { ...filters, [key]: '' }
    
    // Jeśli czyścimy sortBy, ustaw domyślne wartości
    if (key === 'sortBy') {
      newFilters.sortBy = 'date'
      newFilters.sortOrder = 'desc'
    }
    
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border-primary)',
      boxShadow: 'var(--shadow-md)',
      marginBottom: '20px',
      overflow: 'visible'
    }}>
      {/* Pasek głównych filtrów zawsze widoczny */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 220px auto',
        gap: '12px',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-primary)',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        {/* Wyszukiwarka */}
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
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            onKeyPress={handleSearchKeyPress}
            placeholder="Szukaj... (Enter)"
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

        {/* Typ */}
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

        

        {/* Akcje */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center', position: 'relative', flexWrap: 'wrap' }}>
          {activeFiltersCount > 0 && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '9999px',
              padding: '6px 10px',
              fontSize: '12px',
              color: 'var(--text-primary)',
              maxWidth: '50%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              <span>Aktywne: {getActiveFilterLabels().join(', ')}</span>
              <button onClick={clearFilters} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)', textDecoration: 'underline' }}>
                Wyczyść
              </button>
            </div>
          )}
          {activeFiltersCount > 0 && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsActivePanelOpen(prev => !prev)}
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                Aktywne filtry ({activeFiltersCount})
              </button>
              {/* Dropdown aktywnych filtrów */}
              <div
                style={{
                  display: isActivePanelOpen ? 'block' : 'none',
                  position: 'absolute',
                  right: 0,
                  marginTop: '8px',
                  width: '320px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '10px',
                  zIndex: 1000
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Aktywne filtry</span>
                  <button
                    onClick={clearFilters}
                    style={{
                      padding: '6px 8px',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    Wyczyść wszystkie
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {filters.search && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: '9999px', padding: '6px 10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Szukaj: {filters.search}
                      <button onClick={() => clearFilter('search')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  {filters.type && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: '9999px', padding: '6px 10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Typ: {getTypeLabel(filters.type)}
                      <button onClick={() => clearFilter('type')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  {filters.envelope && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: '9999px', padding: '6px 10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Koperta: {getEnvelopeLabel(filters.envelope)}
                      <button onClick={() => clearFilter('envelope')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  {filters.category && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: '9999px', padding: '6px 10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Kategoria: {getCategoryName(filters.category)}
                      <button onClick={() => clearFilter('category')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  {filters.group && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: '9999px', padding: '6px 10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Grupa: {getGroupTranslation(filters.group)}
                      <button onClick={() => clearFilter('group')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  {filters.startDate && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: '9999px', padding: '6px 10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Od: {filters.startDate}
                      <button onClick={() => clearFilter('startDate')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  {filters.endDate && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: '9999px', padding: '6px 10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Do: {filters.endDate}
                      <button onClick={() => clearFilter('endDate')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <X size={14} />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            {isAdvancedOpen ? 'Ukryj zaawansowane' : 'Zaawansowane filtry'}{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
          </button>
          <button
            onClick={clearFilters}
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <X size={14} /> Wyczyść
          </button>
        </div>
      </div>

      {/* Pigułki aktywnych filtrów */}
      <div style={{
        display: activeFiltersCount > 0 ? 'flex' : 'none',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '10px 16px',
        borderBottom: '1px solid var(--border-primary)',
        backgroundColor: 'var(--bg-tertiary)'
      }}>
          {filters.search && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '9999px',
              padding: '6px 10px',
              fontSize: '12px',
              color: 'var(--text-secondary)'
            }}>
              Szukaj: {filters.search}
              <button onClick={() => clearFilter('search')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </span>
          )}
          {filters.type && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '9999px',
              padding: '6px 10px',
              fontSize: '12px',
              color: 'var(--text-secondary)'
            }}>
              Typ: {getTypeLabel(filters.type)}
              <button onClick={() => clearFilter('type')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </span>
          )}
          {filters.envelope && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '9999px',
              padding: '6px 10px',
              fontSize: '12px',
              color: 'var(--text-secondary)'
            }}>
              Koperta: {getEnvelopeLabel(filters.envelope)}
              <button onClick={() => clearFilter('envelope')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </span>
          )}
          {filters.category && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: '9999px', padding: '6px 10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Kategoria: {getCategoryName(filters.category)}
              <button onClick={() => clearFilter('category')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </span>
          )}
          {filters.group && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: '9999px', padding: '6px 10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Grupa: {getGroupTranslation(filters.group)}
              <button onClick={() => clearFilter('group')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </span>
          )}
          {filters.startDate && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: '9999px', padding: '6px 10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Od: {filters.startDate}
              <button onClick={() => clearFilter('startDate')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </span>
          )}
          {filters.endDate && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: '9999px', padding: '6px 10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Do: {filters.endDate}
              <button onClick={() => clearFilter('endDate')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </span>
          )}
      </div>

      {/* Aktywne filtry - zawsze widoczne */}
      {activeFiltersCount > 0 && (
        <div style={{
          marginBottom: '20px',
          padding: '12px',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '8px',
          border: '1px solid var(--border-primary)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: 0
            }}>
              Aktywne filtry ({activeFiltersCount})
            </h3>
            <button
              onClick={clearFilters}
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Wyczyść wszystkie
            </button>
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            {filters.search && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '9999px',
                padding: '6px 10px',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>
                Szukaj: {filters.search}
                <button onClick={() => clearFilter('search')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.type && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '9999px',
                padding: '6px 10px',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>
                Typ: {getTypeLabel(filters.type)}
                <button onClick={() => clearFilter('type')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.envelope && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '9999px',
                padding: '6px 10px',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>
                Koperta: {getEnvelopeLabel(filters.envelope)}
                <button onClick={() => clearFilter('envelope')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.category && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '9999px',
                padding: '6px 10px',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>
                Kategoria: {getCategoryName(filters.category)}
                <button onClick={() => clearFilter('category')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.group && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '9999px',
                padding: '6px 10px',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>
                Grupa: {getGroupTranslation(filters.group)}
                <button onClick={() => clearFilter('group')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.startDate && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '9999px',
                padding: '6px 10px',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>
                Od: {filters.startDate}
                <button onClick={() => clearFilter('startDate')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.endDate && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '9999px',
                padding: '6px 10px',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>
                Do: {filters.endDate}
                <button onClick={() => clearFilter('endDate')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      <div style={{ padding: '16px', display: isAdvancedOpen ? 'block' : 'none' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Koperta
              </label>
              <select
                value={filters.envelope}
                onChange={(e) => handleFilterChange('envelope', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-primary)', borderRadius: '8px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px' }}
              >
                <option value="">Wszystkie koperty</option>
                {filterOptions.envelopes.map(envelope => (
                  <option key={envelope.id} value={envelope.id}>
                    {envelope.icon} {envelope.name}
                  </option>
                ))}
              </select>
            </div>

            
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
