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

  const stats = useMemo(() => {
    return transactions.reduce((acc, curr) => {
      if (curr.type === 'income') acc.income += curr.amount
      else if (curr.type === 'expense') acc.expense += curr.amount
      return acc
    }, { income: 0, expense: 0 })
  }, [transactions])

  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center h-screen bg-zinc-950">
        <LoadingSpinner size="large" text="Sprawdzanie autoryzacji..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <div className="w-full px-4 sm:px-6 lg:px-8 pb-28 md:pb-4 pt-0 flex flex-col relative z-10 max-w-[2560px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-8 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 tracking-tight">
                📜 Historia transakcji
              </h1>
              <p className="text-xs text-zinc-500 font-medium tracking-wide mt-1">
                Pełny rejestr operacji finansowych i zarządzanie wpisami
              </p>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col gap-6">
          {/* Middle Row: Filters (Bento) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-2 rounded-3xl bg-zinc-900/50 backdrop-blur-xl border border-white/5"
          >
            <TransactionFilters
              key="transaction-filters"
              onFiltersChange={handleFiltersChange}
              filterOptions={memoizedFilterOptions}
              loading={loading}
              initialFilters={filters}
            />
          </motion.div>

          {/* Bottom Row: Table (Bento) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <TransactionTable
              transactions={transactions}
              onTransactionDeleted={() => {
                fetchTransactions()
                window.dispatchEvent(new CustomEvent('dashboardRefresh'))
              }}
              loading={loading}
            />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
