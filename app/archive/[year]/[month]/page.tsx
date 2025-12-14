'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { KeyMetricsCards } from '@/components'
import { TrendsVisualization } from '@/components/features/analytics/TrendsVisualization'
import { InteractiveExpenseExplorer } from '@/components/features/analytics/InteractiveExpenseExplorer'
import { AnalyticsCharts } from '@/components/features/analytics/AnalyticsCharts'
import { authorizedFetch } from '@/lib/api/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, AlertCircle, RefreshCw } from 'lucide-react'
import type { DateRange } from '@/lib/types'
import { useCategories } from '@/lib/contexts/CategoryContext'

interface MainMetrics {
  currentPeriod: {
    income: number
    expense: number
    balance: number
    savingsRate: number
  }
  previousPeriod?: {
    income: number
    expense: number
    balance: number
    savingsRate: number
  }
}

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
}

interface TrendData {
  period: string
  value: number
}

interface TrendsData {
  totalExpenses: TrendData[]
  byEnvelope: { [envelopeId: string]: TrendData[] }
  byEnvelopeName: { [envelopeName: string]: TrendData[] }
}

interface CategoryAnalysis {
  categoryId: string
  categoryName: string
  categoryIcon: string
  totalAmount: number
  transactionCount: number
  avgTransactionAmount: number
  percentage: number
  envelopeBreakdown: {
    envelopeName: string
    envelopeIcon: string
    amount: number
    percentage: number
  }[]
  monthlyTrend: {
    month: string
    year: number
    amount: number
  }[]
  transactions: {
    id: string
    amount: number
    description: string
    date: string
    envelopeName: string
    envelopeIcon: string
  }[]
}

interface AnalyticsData {
  mainMetrics: MainMetrics
  spendingTree: SpendingTreeNode[]
  trends: TrendsData
  categoryAnalysis: CategoryAnalysis[]
  totalExpenses: number
  period: string
  summary: {
    totalCategories: number
    totalTransactions: number
    avgTransactionAmount: number
  }
}

export default function ArchiveMonthPage() {
  const { isAuthenticated, isCheckingAuth } = useAuth()
  const { getCategoryName } = useCategories()
  const params = useParams()
  const router = useRouter()

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [selectedItem, setSelectedItem] = useState<SpendingTreeNode | null>(null)
  const [highlightedGroup, setHighlightedGroup] = useState<string | null>(null)
  const [highlightedEnvelope, setHighlightedEnvelope] = useState<string | null>(null)

  const year = params.year as string
  const month = params.month as string

  const safeDecode = (value: string): string => {
    try { return decodeURIComponent(value) } catch { return value }
  }

  const monthIndexFromParam = (param: string): number => {
    const monthNames = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
      'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień']

    // Try numeric first
    const numeric = parseInt(param)
    if (!Number.isNaN(numeric)) return Math.max(0, Math.min(11, numeric - 1))

    // Normalize string for comparison (remove diacritics)
    const normalize = (str: string) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const decoded = safeDecode(param)
    const normalizedInput = normalize(decoded)

    // Try exact match first, then normalized match
    const idx = monthNames.findIndex(m => {
      return m.toLowerCase() === decoded.toLowerCase() || normalize(m) === normalizedInput
    })

    return idx >= 0 ? idx : new Date().getMonth()
  }

  const getMonthDateRange = (year: string, month: string): DateRange => {
    const yearNum = parseInt(year)
    const monthNum = monthIndexFromParam(month)
    return {
      from: new Date(yearNum, monthNum, 1),
      to: new Date(yearNum, monthNum + 1, 0, 23, 59, 59)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    fetchAnalyticsData()
  }, [isAuthenticated, year, month])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      setError('')
      const dateRange = getMonthDateRange(year, month)
      const params = new URLSearchParams()
      // Always pass the context year for trends
      params.append('year', year)

      if (dateRange.from && dateRange.to) {
        params.append('startDate', dateRange.from.toISOString())
        params.append('endDate', dateRange.to.toISOString())
      }
      const response = await authorizedFetch(`/api/analytics?${params.toString()}`)
      const analyticsData = await response.json()

      // Fix category names using client-side knowledge (localStorage)
      if (analyticsData.spendingTree) {
        const updateNames = (nodes: any[]) => {
          nodes.forEach(node => {
            if (node.type === 'CATEGORY') {
              const realId = node.id.replace('cat_', '')
              node.name = getCategoryName(realId)
            }
            if (node.children) updateNames(node.children)
          })
        }
        updateNames(analyticsData.spendingTree)
      }

      response.ok ? setData(analyticsData) : setError(analyticsData.error || 'Błąd pobierania danych')
    } catch (err) {
      console.error('Error fetching analytics data:', err)
      setError('Błąd połączenia z serwerem')
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => router.push('/archive')

  const handleSegmentClick = (segmentName: string) => {
    if (selectedItem?.name === segmentName) {
      setSelectedItem(null)
      setHighlightedGroup(null)
      setHighlightedEnvelope(null)
      return
    }

    const findItem = (nodes: SpendingTreeNode[]): SpendingTreeNode | null => {
      for (const node of nodes) {
        if (node.name === segmentName) return node
        if (node.children) {
          const found = findItem(node.children)
          if (found) return found
        }
      }
      return null
    }

    const item = findItem(data?.spendingTree || [])
    if (item) {
      setSelectedItem(item)
      setHighlightedGroup(segmentName)
      setHighlightedEnvelope(null)
      setTimeout(() => {
        document.getElementById('expense-explorer')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }

  const handleExplorerItemClick = (item: SpendingTreeNode | null) => {
    if (!item) {
      setSelectedItem(null)
      setHighlightedGroup(null)
      setHighlightedEnvelope(null)
      return
    }
    setSelectedItem(item)
    if (item.type === 'GROUP') {
      setHighlightedGroup(item.name)
      setHighlightedEnvelope(null)
    } else if (item.type === 'ENVELOPE') {
      setHighlightedEnvelope(item.name)
      setHighlightedGroup(null)
    } else {
      setHighlightedGroup(null)
      setHighlightedEnvelope(null)
    }
  }

  const chartData = useMemo(() => {
    if (!data?.spendingTree) return []
    return data.spendingTree.map((group, index) => ({
      name: group.name,
      value: group.total,
      color: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'][index % 8]
    }))
  }, [data?.spendingTree])

  const trendsData = useMemo(() => {
    if (!data?.trends) return []
    if (selectedItem) {
      if (selectedItem.type === 'ENVELOPE') {
        return data.trends.byEnvelopeName?.[selectedItem.name] || []
      } else if (selectedItem.type === 'GROUP') {
        const groupEnvelopes = selectedItem.children?.filter(child => child.type === 'ENVELOPE') || []
        if (groupEnvelopes.length > 0) {
          const groupTrends: { [key: string]: number } = {}
          groupEnvelopes.forEach(envelope => {
            const envelopeTrends = data.trends.byEnvelopeName?.[envelope.name] || []
            envelopeTrends.forEach(trend => {
              groupTrends[trend.period] = (groupTrends[trend.period] || 0) + trend.value
            })
          })
          return Object.entries(groupTrends)
            .map(([period, value]) => ({ period, value }))
            .sort((a, b) => a.period.localeCompare(b.period))
        }
      }
    }
    return (data.trends.totalExpenses || []).sort((a, b) => a.period.localeCompare(b.period))
  }, [data?.trends, selectedItem])

  const getMonthDisplayName = () => {
    const monthNames = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
      'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień']
    return monthNames[monthIndexFromParam(month)] || safeDecode(month)
  }

  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  if (loading && !data) {
    return (
      <div className="min-h-screen flex justify-center items-center h-[calc(100vh-80px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
          <div className="text-lg text-slate-400 animate-pulse">📊 Ładowanie analiz...</div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen py-20 px-4">
        <div className="max-w-md mx-auto p-10 text-center glass-card border-rose-500/30">
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
            <AlertCircle size={32} />
          </div>
          <div className="text-xl font-bold mb-2 text-white">Błąd ładowania danych</div>
          <div className="text-sm mb-6 text-slate-400">{error || 'Nie znaleziono danych'}</div>
          <button
            onClick={goBack}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} /> Wróć do archiwum
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-[1500px] mx-auto p-4 md:p-6 lg:p-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              className="p-3 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer text-slate-400 hover:text-white transition-colors"
              title="Wróć do archiwum"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-1 flex items-center gap-3">
                <span className="gradient-text capitalize">{getMonthDisplayName()} {year}</span>
              </h1>
              <p className="text-slate-400 text-sm flex items-center gap-2">
                <Calendar size={14} /> Analiza finansowa miesiąca
              </p>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <KeyMetricsCards
            currentPeriod={data.mainMetrics.currentPeriod}
            previousPeriod={data.mainMetrics.previousPeriod}
            compareMode={false}
            loading={loading}
          />
        </motion.div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-bold text-white mb-6">Rozkład Wydatków</h3>
            <AnalyticsCharts
              data={chartData}
              total={data.mainMetrics.currentPeriod.expense}
              onSegmentClick={handleSegmentClick}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Trendy Wydatków</h3>
              {selectedItem && (
                <span className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30">
                  {selectedItem.name}
                </span>
              )}
            </div>
            <TrendsVisualization
              data={trendsData}
              selectedItem={selectedItem?.name}
              loading={loading}
              year={year} /* Pass year to component */
            />
          </motion.div>
        </div>

        {/* Explorer */}
        <motion.div
          id="expense-explorer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card"
        >
          <div className="p-6 border-b border-white/5">
            <h3 className="text-xl font-bold text-white mb-2">Szczegółowa Analiza</h3>
            <p className="text-slate-400 text-sm">Przeglądaj wydatki według kategorii, kopert i poszczególnych transakcji</p>
          </div>
          <div className="p-0">
            <InteractiveExpenseExplorer
              data={data.spendingTree}
              compareMode={false}
              onItemClick={handleExplorerItemClick}
              loading={loading}
              highlightedGroup={highlightedGroup}
              highlightedEnvelope={highlightedEnvelope}
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
