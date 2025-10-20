'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TopNavigation } from '@/components/ui/TopNavigation'
import { GlobalFilters } from '@/components/analytics/GlobalFilters'
import { KeyMetricsCards } from '@/components/analytics/KeyMetricsCards'
import { SpendingBreakdownVisualization } from '@/components/analytics/SpendingBreakdownVisualization'
import { TrendsVisualization } from '@/components/analytics/TrendsVisualization'
import { InteractiveExpenseExplorer } from '@/components/analytics/InteractiveExpenseExplorer'
import { AnalyticsCharts } from '@/components/analytics/AnalyticsCharts'
import { authorizedFetch } from '@/lib/utils/api'
import { useAuth } from '@/lib/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ArrowLeft, Calendar } from 'lucide-react'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3B82F6',
}

// Interfaces from Analytics
interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

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
  const params = useParams()
  const router = useRouter()
  
  // State exactly like Analytics
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [selectedItem, setSelectedItem] = useState<SpendingTreeNode | null>(null)
  const [highlightedGroup, setHighlightedGroup] = useState<string | null>(null)
  const [highlightedEnvelope, setHighlightedEnvelope] = useState<string | null>(null)

  const year = params.year as string
  const month = params.month as string

  // Calculate date range for the specific month
  const getMonthDateRange = (year: string, month: string): DateRange => {
    const yearNum = parseInt(year)
    let monthNum: number
    
    // Check if month is already a number or needs conversion
    if (isNaN(parseInt(month))) {
      // Month is Polish name, convert to number
      const monthNames = [
        'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
        'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'
      ]
      const decodedMonth = decodeURIComponent(month)
      monthNum = monthNames.findIndex(m => m.toLowerCase() === decodedMonth.toLowerCase())
    } else {
      monthNum = parseInt(month) - 1
    }
    
    const startDate = new Date(yearNum, monthNum, 1)
    const endDate = new Date(yearNum, monthNum + 1, 0, 23, 59, 59)
    
    return { from: startDate, to: endDate }
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
      console.log('Fetching analytics for date range:', dateRange)
      
      const params = new URLSearchParams()
      if (dateRange.from && dateRange.to) {
        params.append('startDate', dateRange.from.toISOString())
        params.append('endDate', dateRange.to.toISOString())
      }

      const response = await authorizedFetch(`/api/analytics?${params.toString()}`)
      const analyticsData = await response.json()
      
      if (response.ok) {
        setData(analyticsData)
      } else {
        setError(analyticsData.error || 'Błąd pobierania danych analitycznych')
      }
    } catch (err) {
      console.error('Error fetching analytics data:', err)
      setError('Błąd połączenia z serwerem')
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    router.push('/archive')
  }

  // Exact same functions as Analytics
  const handleSegmentClick = (segmentName: string, segmentValue?: number) => {
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
        const explorerElement = document.getElementById('expense-explorer')
        if (explorerElement) {
          explorerElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
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

  // Prepare data for charts (exact same as Analytics)
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
          
          return Object.entries(groupTrends).map(([period, value]) => ({
            period,
            value
          }))
        }
      }
    }
    
    return data.trends.totalExpenses || []
  }, [data?.trends, selectedItem])

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

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-theme-primary">
        <TopNavigation />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 'calc(100vh - 80px)'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid var(--border-primary)',
              borderTop: '4px solid var(--accent-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{
              fontSize: '18px',
              color: 'var(--text-secondary)'
            }}>
              📊 Ładowanie analiz...
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-theme-primary">
        <TopNavigation />
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px' }}>
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              Błąd ładowania danych
            </div>
            <div style={{ fontSize: '14px', marginBottom: '16px' }}>
              {error || 'Nie znaleziono danych dla tego miesiąca'}
            </div>
            <button
              onClick={goBack}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Wróć do archiwum
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Get month name for display
  const getMonthDisplayName = () => {
    const monthNames = [
      'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
      'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'
    ]
    
    if (isNaN(parseInt(month))) {
      return decodeURIComponent(month)
    } else {
      const monthIndex = parseInt(month) - 1
      return monthNames[monthIndex] || month
    }
  }

  return (
    <div className="min-h-screen bg-theme-primary">
      <TopNavigation />
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <button
            onClick={goBack}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-primary)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
          >
            <ArrowLeft size={16} />
            Wróć
          </button>
          
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: 'var(--text-primary)',
              margin: '0 0 4px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Calendar size={32} />
              {getMonthDisplayName()} {year}
            </h1>
            <p style={{
              fontSize: '16px',
              color: 'var(--text-secondary)',
              margin: 0
            }}>
              Analiza finansowa miesiąca
            </p>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <KeyMetricsCards
          currentPeriod={data.mainMetrics.currentPeriod}
          previousPeriod={data.mainMetrics.previousPeriod}
          compareMode={false}
          loading={loading}
        />

        {/* Visualizations - EXACT SAME AS ANALYTICS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: '24px',
          marginBottom: '24px'
        }}>
          <AnalyticsCharts 
            data={chartData} 
            total={data.mainMetrics.currentPeriod.expense}
            onSegmentClick={handleSegmentClick}
          />
          <TrendsVisualization
            data={trendsData}
            selectedItem={selectedItem?.name}
            loading={loading}
          />
        </div>

        {/* Interactive Expense Explorer */}
        <div id="expense-explorer">
          <InteractiveExpenseExplorer
            data={data.spendingTree}
            compareMode={false}
            onItemClick={handleExplorerItemClick}
            loading={loading}
            highlightedGroup={highlightedGroup}
            highlightedEnvelope={highlightedEnvelope}
          />
        </div>
      </div>
    </div>
  )
}
