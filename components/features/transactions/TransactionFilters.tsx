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

export function TransactionFilters({ onFiltersChange, filterOptions, loading, initialFilters }: TransactionFiltersProps) {
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full"
    >
      {/* Main filters bar */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_auto] gap-4 items-center p-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="SZUKAJ (TYTUŁ, OPIS, KWOTA)..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            disabled={loading}
            className="w-full bg-slate-950/50 border border-white/10 rounded-2xl !pl-12 py-3 text-sm font-black text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner disabled:opacity-50"
          />
        </div>

        {/* Type */}
        <div className="relative">
          <select
            value={filters.type}
            disabled={loading}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-3 px-4 text-[10px] font-black uppercase tracking-widest text-white appearance-none cursor-pointer focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner disabled:opacity-50"
          >
            <option value="">WSZYSTKIE TYPY</option>
            <option value="income">💰 PRZYCHODY</option>
            <option value="expense">💸 WYDATKI</option>
            <option value="transfer">🔄 TRANSFERY</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Actions */}
        <div className="flex gap-2 items-center justify-end">
          <button
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 active:scale-95 ${isAdvancedOpen
              ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20'
              : 'bg-slate-800 text-slate-400 border border-white/5 hover:bg-slate-700 hover:text-white'}`}
          >
            <Filter size={16} className={activeFiltersCount > 0 && !isAdvancedOpen ? "text-indigo-400" : ""} />
            <span className="hidden sm:inline">{isAdvancedOpen ? 'Schowaj Filtry' : 'Więcej Opcji'}</span>
            {activeFiltersCount > 0 && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ml-1 min-w-[20px] text-center shadow-inner ${isAdvancedOpen ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-400'}`}>
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
                  <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em] ml-1">Kategoria</label>
                  <div className="relative">
                    <select
                      value={filters.category}
                      disabled={loading}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-2.5 px-4 text-[10px] font-black uppercase tracking-widest text-white appearance-none cursor-pointer focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner disabled:opacity-50"
                    >
                      <option value="">WSZYSTKIE KATEGORIE</option>
                      {filterOptions.categories.map(category => (
                        <option key={category} value={category}>
                          {getCategoryIcon(category)} {getCategoryName(category).toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Group */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em] ml-1">Grupa kopert</label>
                  <div className="relative">
                    <select
                      value={filters.group}
                      disabled={loading}
                      onChange={(e) => handleFilterChange('group', e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-2.5 px-4 text-[10px] font-black uppercase tracking-widest text-white appearance-none cursor-pointer focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner disabled:opacity-50"
                    >
                      <option value="">WSZYSTKIE GRUPY</option>
                      {filterOptions.groups.map(group => (
                        <option key={group} value={group}>{getGroupTranslation(group).toUpperCase()}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Envelope */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em] ml-1">Koperta</label>
                  <div className="relative">
                    <select
                      value={filters.envelope}
                      disabled={loading}
                      onChange={(e) => handleFilterChange('envelope', e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-2.5 px-4 text-[10px] font-black uppercase tracking-widest text-white appearance-none cursor-pointer focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner disabled:opacity-50"
                    >
                      <option value="">WSZYSTKIE KOPERTY</option>
                      {filterOptions.envelopes.map(envelope => (
                        <option key={envelope.id} value={envelope.id}>
                          {envelope.icon} {envelope.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Dates */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em] ml-1">Od daty</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      disabled={loading}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-2.5 px-3 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner date-input-icon-fix disabled:opacity-50"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em] ml-1">Do daty</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      disabled={loading}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-2.5 px-3 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner date-input-icon-fix disabled:opacity-50"
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
                    disabled={loading}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-2 px-4 pr-10 text-[10px] font-black uppercase tracking-widest text-white appearance-none cursor-pointer focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner disabled:opacity-50"
                  >
                    <option value="date">📅 DATA</option>
                    <option value="amount">💸 KWOTA</option>
                    <option value="description">ABC OPIS</option>
                    <option value="type">🏷️ TYP</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <button
                  onClick={toggleSortOrder}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all flex items-center gap-3 active:scale-95"
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
