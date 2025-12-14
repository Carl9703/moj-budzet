'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { TransactionFilters, FilterState } from '@/components/features/transactions/TransactionFilters'
import { TransactionTable } from '@/components/features/transactions/TransactionTable'
import { api, authorizedFetch } from '@/lib/api/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner'

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

      const params = new URLSearchParams()
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value && value !== 'date' && value !== 'desc') {
          params.append(key, value)
        }
      })
      const response = await authorizedFetch(`/api/transactions?${params.toString()}`)
      const data = await response.json()

      if (data.transactions) {
        setTransactions(data.transactions)
        if (data.filters) {
          setFilterOptions(data.filters)
        }
      } else {
        setTransactions(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
    fetchTransactions(newFilters)
  }, [])


  useEffect(() => {
    if (!isAuthenticated) return
    fetchTransactions()
  }, [isAuthenticated])

  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-950">
        <LoadingSpinner size="large" text="Sprawdzanie autoryzacji..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center h-screen">
        <div className="text-2xl text-slate-400 animate-pulse">📜 Ładowanie historii...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-[1400px] mx-auto p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Historia transakcji</span>
          </h1>
          <p className="text-slate-400">Przeglądaj i zarządzaj swoimi wydatkami i przychodami</p>
        </motion.div>

        <TransactionFilters
          key="transaction-filters"
          onFiltersChange={handleFiltersChange}
          filterOptions={memoizedFilterOptions}
          loading={loading}
          initialFilters={filters}
        />

        <TransactionTable
          transactions={transactions}
          onTransactionDeleted={() => {
            fetchTransactions()
            window.dispatchEvent(new CustomEvent('dashboardRefresh'))
          }}
          loading={loading}
        />
      </div>
    </div>
  )
}
