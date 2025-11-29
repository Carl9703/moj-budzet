import { useState, useEffect } from 'react'
import { authorizedFetch } from '@/lib/utils/api'

interface IncomeSource {
  source: string
  total: number
  count: number
  avgAmount: number
  percentage: number
  transactions: {
    id: string
    amount: number
    description: string
    date: string
  }[]
}

interface IncomeTrendData {
  period: string
  value: number
}

interface IncomeAnalyticsData {
  sources: IncomeSource[]
  trends: IncomeTrendData[]
  totalIncome: number
  period: string
  summary: {
    totalSources: number
    totalTransactions: number
    avgTransactionAmount: number
  }
}

interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

export function useIncomeAnalytics(dateRange: DateRange) {
  const [data, setData] = useState<IncomeAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async (newDateRange: DateRange) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (newDateRange.from && newDateRange.to) {
        params.append('startDate', newDateRange.from.toISOString())
        params.append('endDate', newDateRange.to.toISOString())
      }

      const response = await authorizedFetch(`/api/analytics/income?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (err) {
      console.error('Income analytics error:', err)
      setError(err instanceof Error ? err.message : 'Błąd pobierania danych przychodów')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(dateRange)
  }, [dateRange.from, dateRange.to])

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(dateRange)
  }
}
