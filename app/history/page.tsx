'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { TransactionFilters, FilterState } from '@/components/transactions/TransactionFilters'
import { TransactionTable } from '@/components/transactions/TransactionTable'
import { TopNavigation } from '@/components/ui/TopNavigation'
import { authorizedFetch } from '@/lib/utils/api'
import { useAuth } from '@/lib/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  date: string
  category?: string
  envelope?: {
    name: string
    icon: string
  }
}

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

export default function HistoryPage() {
  const { isAuthenticated, isCheckingAuth } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    groups: [],
    envelopes: []
  })

  // Memoize filterOptions to prevent unnecessary re-renders
  const memoizedFilterOptions = useMemo(() => filterOptions, [filterOptions])
  const [loading, setLoading] = useState(true)
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
  
  const fetchTransactions = async (currentFilters?: FilterState) => {
    try {
      setLoading(true)
      const activeFilters = currentFilters || filters
      console.log('History: fetchTransactions called with:', activeFilters)
      
      // Buduj URL z parametrami
      const params = new URLSearchParams()
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value && value !== 'date' && value !== 'desc') {
          params.append(key, value)
        }
      })
      
      console.log('History: API URL:', `/api/transactions?${params.toString()}`)
      const response = await authorizedFetch(`/api/transactions?${params.toString()}`)
      const data = await response.json()
      
      if (data.transactions) {
        setTransactions(data.transactions)
        if (data.filters) {
          setFilterOptions(data.filters)
        }
      } else {
        // Fallback dla starego formatu API
        setTransactions(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }
  
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    console.log('History: handleFiltersChange called with:', newFilters)
    setFilters(newFilters)
    fetchTransactions(newFilters)
  }, [])
  
  const resetFilters = () => {
    const defaultFilters: FilterState = {
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
    setFilters(defaultFilters)
    fetchTransactions(defaultFilters)
  }
  
  useEffect(() => {
    if (!isAuthenticated) return
    fetchTransactions()
  }, [isAuthenticated])

  if (isCheckingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadingSpinner size="large" text="Sprawdzanie autoryzacji..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-primary" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="text-theme-secondary" style={{ fontSize: '24px' }}>📜 Ładowanie historii...</div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-theme-primary">
      <TopNavigation />
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 className="section-header" style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
            📜 Historia transakcji
          </h1>
          <button
            onClick={resetFilters}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🔄 Wyczyść filtry
          </button>
        </div>
        
        {/* Panel filtrów */}
        <TransactionFilters
          key="transaction-filters"
          onFiltersChange={handleFiltersChange}
          filterOptions={memoizedFilterOptions}
          loading={loading}
          initialFilters={filters}
        />
        
        {/* Tabela transakcji */}
        <TransactionTable
          transactions={transactions}
          onTransactionDeleted={() => fetchTransactions()}
          loading={loading}
        />
      </div>
    </div>
  )
}