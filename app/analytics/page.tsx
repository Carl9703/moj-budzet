'use client'

import { useState, useMemo } from 'react'
import { GlobalFilters, KeyMetricsCards, ViewModeToggle, LazyTrendsVisualization, LazyInteractiveExpenseExplorer, LazyAnalyticsCharts, LazyIncomeAnalysis } from '@/components'
import { useAuth } from '@/lib/hooks/useAuth'
import { useIncomeAnalytics } from '@/lib/hooks/useIncomeAnalytics'
import type { SpendingTreeNode } from '@/lib/types'
import { useQuery } from '@tanstack/react-query'
import { fetchAnalyticsData } from '@/lib/api/analytics'
import { useAnalyticsFilters } from '@/lib/hooks/useAnalyticsFilters'
import { motion } from 'framer-motion'


import { Suspense } from 'react'

function AnalyticsContent() {
  const { isAuthenticated, isCheckingAuth } = useAuth()
  const [viewMode, setViewMode] = useState<'expenses' | 'income'>('expenses')

  // Use custom hook for URL-synced state
  const { dateRange, compareMode, setDateRange, setCompareMode } = useAnalyticsFilters()

  const [selectedItem, setSelectedItem] = useState<SpendingTreeNode | null>(null)
  const [highlightedGroup, setHighlightedGroup] = useState<string | null>(null)
  const [highlightedEnvelope, setHighlightedEnvelope] = useState<string | null>(null)
  const [forceCollapseAll, setForceCollapseAll] = useState(false)

  const { data: incomeData, loading: incomeLoading } = useIncomeAnalytics(dateRange)

  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', dateRange.from?.toISOString(), dateRange.to?.toISOString(), compareMode],
    queryFn: () => fetchAnalyticsData(dateRange, compareMode),
    enabled: isAuthenticated && !!dateRange.from && !!dateRange.to
  })

  // compatibility with existing code
  const loading = isLoading

  const handleSegmentClick = (segmentName: string, segmentValue?: number) => {
    if (selectedItem?.name === segmentName) {
      setSelectedItem(null)
      setHighlightedGroup(null)
      setHighlightedEnvelope(null)
      return
    }

    setForceCollapseAll(true)

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
      setHighlightedEnvelope(null)

      setTimeout(() => {
        setForceCollapseAll(false)
        setHighlightedGroup(segmentName)
      }, 150)

      setTimeout(() => {
        const explorerElement = document.getElementById('expense-explorer')
        if (explorerElement) {
          explorerElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 300)
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
      color: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'][index % 10]
    }))
  }, [data?.spendingTree])

  const trendsData = useMemo(() => {
    if (!data?.trends) return []

    const totalExpenses = data.trends.totalExpenses || []

    if (selectedItem) {
      if (selectedItem.type === 'ENVELOPE') {
        const envelopeName = selectedItem.name
        const envelopeTrends = data.trends.byEnvelopeName?.[envelopeName] || []
        return envelopeTrends
      } else if (selectedItem.type === 'GROUP') {
        const groupEnvelopes = selectedItem.children?.filter(child => child.type === 'ENVELOPE') || []

        if (groupEnvelopes.length > 0) {
          const groupTrends: { [key: string]: number } = {}

          groupEnvelopes.forEach(envelope => {
            const envelopeName = envelope.name
            const envelopeTrends = data.trends.byEnvelopeName?.[envelopeName] || []

            if (envelopeTrends.length > 0) {
              envelopeTrends.forEach(trend => {
                if (!groupTrends[trend.period]) {
                  groupTrends[trend.period] = 0
                }
                groupTrends[trend.period] += trend.value
              })
            }
          })

          const result = Object.entries(groupTrends).map(([period, value]) => ({
            period,
            value
          }))

          if (result.length === 0) return []
          return result
        } else {
          return []
        }
      }
    }

    return totalExpenses
  }, [data?.trends, selectedItem])


  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-950">
        <p className="text-slate-400">Sprawdzanie autoryzacji...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
          <div className="text-lg text-slate-400">
            📊 Ładowanie analiz...
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-[1400px] mx-auto p-4">
          <div className="text-center p-10 text-slate-400">
            <div className="text-5xl mb-4">❌</div>
            <div className="text-lg font-semibold mb-2">
              Błąd ładowania danych
            </div>
            <div className="text-sm">
              Spróbuj odświeżyć stronę lub skontaktuj się z administratorem
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Ambient Background similar to Dashboard */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 80% 0%, #172554 0%, #020617 60%)',
        }}
      />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />


      <div className="relative z-10 max-w-[1600px] mx-auto p-4 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3 tracking-tight">
            <span className="text-4xl">📊</span> Analizy Budżetowe
          </h1>
          <p className="text-slate-400 ml-12">
            Szczegółowy przegląd Twoich finansów i trendów wydatków.
          </p>
        </motion.div>

        <GlobalFilters
          dateRange={dateRange}
          compareMode={compareMode}
          onDateRangeChange={setDateRange}
          onCompareModeChange={setCompareMode}
          loading={loading}
        />

        <ViewModeToggle
          currentMode={viewMode}
          onModeChange={setViewMode}
          loading={loading || incomeLoading}
        />

        <KeyMetricsCards
          currentPeriod={data.mainMetrics.currentPeriod}
          previousPeriod={data.mainMetrics.previousPeriod}
          compareMode={compareMode}
          loading={loading}
        />

        {viewMode === 'expenses' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <LazyAnalyticsCharts
                data={chartData}
                total={data.mainMetrics.currentPeriod.expense}
                onSegmentClick={handleSegmentClick}
              />
              <LazyTrendsVisualization
                data={trendsData}
                selectedItem={selectedItem?.name}
                loading={loading}
              />
            </div>

            <div id="expense-explorer">
              <LazyInteractiveExpenseExplorer
                data={data.spendingTree}
                compareMode={compareMode}
                onItemClick={handleExplorerItemClick}
                loading={loading}
                highlightedGroup={highlightedGroup}
                highlightedEnvelope={highlightedEnvelope}
                forceCollapseAll={forceCollapseAll}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <LazyIncomeAnalysis
              data={incomeData ?? null}
              loading={incomeLoading}
            />
          </motion.div>
        )}

      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen bg-slate-950">
        <p className="text-slate-400">Ładowanie...</p>
      </div>
    }>
      <AnalyticsContent />
    </Suspense>
  )
}
