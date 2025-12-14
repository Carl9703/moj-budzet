'use client'

import { useState, useEffect } from 'react'
import type React from 'react'
import { Search, X, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCategories } from '@/lib/contexts/CategoryContext'

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
  initialFilters?: FilterState
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

export function TransactionFilters({ onFiltersChange, filterOptions, initialFilters }: TransactionFiltersProps) {
  const { getCategoryIcon, getCategoryName } = useCategories()
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
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  useEffect(() => {
    if (initialFilters) setFilters(initialFilters)
  }, [initialFilters])

  useEffect(() => {
    const count = Object.values(filters).filter(value =>
      value !== '' && value !== 'date' && value !== 'desc'
    ).length
    setActiveFiltersCount(count)
  }, [filters])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    if (key === 'group' && value) newFilters.envelope = ''
    if (key === 'envelope' && value) newFilters.group = ''
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }))
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onFiltersChange(filters)
    }
  }

  const clearFilter = (key: keyof FilterState) => {
    const newFilters = { ...filters, [key]: '' }
    if (key === 'sortBy') {
      newFilters.sortBy = 'date'
      newFilters.sortOrder = 'desc'
    }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const toggleSortOrder = () => {
    const newOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc'
    handleFilterChange('sortOrder', newOrder)
  }

  const getGroupTranslation = (group: string) => {
    const translations: Record<string, string> = {
      'needs': 'Potrzeby',
      'lifestyle': 'Styl życia',
      'assets': 'Cele i majątek'
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

  const FilterTag = ({ label, onClear }: { label: string; onClear: () => void }) => (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="inline-flex items-center gap-1.5 bg-slate-800/50 border border-slate-700 rounded-full py-1.5 px-3 text-xs text-slate-300 backdrop-blur-sm"
    >
      {label}
      <button onClick={onClear} className="border-none bg-transparent cursor-pointer text-slate-400 hover:text-white transition-colors">
        <X size={14} />
      </button>
    </motion.span>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card mb-6 overflow-visible"
    >
      {/* Main filters bar */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_auto] gap-4 items-center p-4 border-b border-[rgba(255,255,255,0.05)]">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Szukaj (tytuł, opis, kwota)..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="input-glass !pl-12 py-2.5 text-sm"
          />
        </div>

        {/* Type */}
        <div className="relative">
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="input-glass py-2.5 text-sm appearance-none cursor-pointer"
          >
            <option value="">Wszystkie typy</option>
            <option value="income">💰 Przychody</option>
            <option value="expense">💸 Wydatki</option>
            <option value="transfer">🔄 Transfery</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Actions */}
        <div className="flex gap-2 items-center justify-end">
          <button
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className={`btn-glass flex items-center gap-2 py-2.5 px-4 text-sm ${isAdvancedOpen ? 'bg-slate-700/50 border-indigo-500/50' : ''}`}
          >
            <Filter size={16} className={activeFiltersCount > 0 ? "text-indigo-400" : "text-slate-400"} />
            <span className="hidden sm:inline">{isAdvancedOpen ? 'Mniej opcji' : 'Więcej opcji'}</span>
            {activeFiltersCount > 0 && (
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 min-w-[18px] text-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active filters */}
      <AnimatePresence>
        {activeFiltersCount > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-wrap gap-2 py-3 px-4 border-b border-[rgba(255,255,255,0.05)] bg-slate-900/20"
          >
            {filters.search && <FilterTag label={`Szukaj: ${filters.search}`} onClear={() => clearFilter('search')} />}
            {filters.type && <FilterTag label={`Typ: ${getTypeLabel(filters.type)}`} onClear={() => clearFilter('type')} />}
            {filters.envelope && <FilterTag label={`Koperta: ${getEnvelopeLabel(filters.envelope)}`} onClear={() => clearFilter('envelope')} />}
            {filters.category && <FilterTag label={`Kategoria: ${getCategoryName(filters.category)}`} onClear={() => clearFilter('category')} />}
            {filters.group && <FilterTag label={`Grupa: ${getGroupTranslation(filters.group)}`} onClear={() => clearFilter('group')} />}
            {filters.startDate && <FilterTag label={`Od: ${filters.startDate}`} onClear={() => clearFilter('startDate')} />}
            {filters.endDate && <FilterTag label={`Do: ${filters.endDate}`} onClear={() => clearFilter('endDate')} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced filters */}
      <AnimatePresence>
        {isAdvancedOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-[rgba(255,255,255,0.05)] bg-slate-900/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Kategoria</label>
                  <div className="relative">
                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="input-glass py-2 px-3 text-sm appearance-none cursor-pointer"
                    >
                      <option value="">Wszystkie kategorie</option>
                      {filterOptions.categories.map(category => (
                        <option key={category} value={category}>
                          {getCategoryIcon(category)} {getCategoryName(category)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Group */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Grupa kopert</label>
                  <div className="relative">
                    <select
                      value={filters.group}
                      onChange={(e) => handleFilterChange('group', e.target.value)}
                      className="input-glass py-2 px-3 text-sm appearance-none cursor-pointer"
                    >
                      <option value="">Wszystkie grupy</option>
                      {filterOptions.groups.map(group => (
                        <option key={group} value={group}>{getGroupTranslation(group)}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Envelope */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Koperta</label>
                  <div className="relative">
                    <select
                      value={filters.envelope}
                      onChange={(e) => handleFilterChange('envelope', e.target.value)}
                      className="input-glass py-2 px-3 text-sm appearance-none cursor-pointer"
                    >
                      <option value="">Wszystkie koperty</option>
                      {filterOptions.envelopes.map(envelope => (
                        <option key={envelope.id} value={envelope.id}>
                          {envelope.icon} {envelope.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Dates */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Od daty</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="input-glass py-2 px-3 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Do daty</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="input-glass py-2 px-3 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Sorting */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[rgba(255,255,255,0.05)]">
                <span className="text-sm font-medium text-slate-400">Sortowanie:</span>
                <div className="relative min-w-[140px]">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="input-glass py-1.5 px-3 text-sm pr-8 appearance-none cursor-pointer"
                  >
                    <option value="date">📅 Data</option>
                    <option value="amount">💸 Kwota</option>
                    <option value="description">abc Opis</option>
                    <option value="type">🏷️ Typ</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <button
                  onClick={toggleSortOrder}
                  className="btn-glass py-1.5 px-3 text-sm flex items-center gap-2 hover:bg-slate-700/50"
                >
                  {filters.sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {filters.sortOrder === 'asc' ? 'Rosnąco' : 'Malejąco'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
