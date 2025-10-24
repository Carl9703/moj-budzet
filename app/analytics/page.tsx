'use client'
import { useState, useEffect, useMemo } from 'react'
import { GlobalFilters, KeyMetricsCards, SpendingBreakdownVisualization, TrendsVisualization, InteractiveExpenseExplorer, AnalyticsCharts } from '@/components'
import { authorizedFetch } from '@/lib/utils/api'
import { useAuth } from '@/lib/hooks/useAuth'

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
  categoryId?: string // Dodajemy categoryId dla kategorii
}

interface TrendData {
  period: string
  value: number
}

interface TrendsData {
  totalExpenses: TrendData[]
  byEnvelope: { [envelopeId: string]: TrendData[] }
  byEnvelopeName: { [envelopeName: string]: TrendData[] } // Dodaj mapowanie po nazwie
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

export default function AnalyticsPage() {
    const { isAuthenticated, isCheckingAuth } = useAuth()
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Bieżący miesiąc
    to: new Date()
  })
  const [compareMode, setCompareMode] = useState(false)
  const [selectedItem, setSelectedItem] = useState<SpendingTreeNode | null>(null)
  const [highlightedGroup, setHighlightedGroup] = useState<string | null>(null)
  const [highlightedEnvelope, setHighlightedEnvelope] = useState<string | null>(null)
  const [forceCollapseAll, setForceCollapseAll] = useState(false)
  

  const fetchData = async (newDateRange: DateRange, newCompareMode: boolean) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (newDateRange.from && newDateRange.to) {
        params.append('startDate', newDateRange.from.toISOString())
        params.append('endDate', newDateRange.to.toISOString())
      }
      if (newCompareMode) {
        params.append('compare', 'true')
      }

      const response = await authorizedFetch(`/api/analytics?${params.toString()}`)
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (err) {
      console.error('Analytics error:', err)
    } finally {
      setLoading(false)
    }
  }

    useEffect(() => {
        if (!isAuthenticated) return
    fetchData(dateRange, compareMode)
  }, [isAuthenticated])

  const handleDateRangeChange = (newDateRange: DateRange) => {
    setDateRange(newDateRange)
    fetchData(newDateRange, compareMode)
  }

  const handleCompareModeChange = (enabled: boolean) => {
    setCompareMode(enabled)
    fetchData(dateRange, enabled)
  }

  const handleSegmentClick = (segmentName: string, segmentValue?: number) => {
    // Jeśli kliknięto na już wybrany segment, odkliknij
    if (selectedItem?.name === segmentName) {
      setSelectedItem(null)
      setHighlightedGroup(null)
      setHighlightedEnvelope(null)
      return
    }

    // Zwiń wszystkie listy przed rozwinięciem nowej
    setForceCollapseAll(true)
    
    // Znajdź pozycję w drzewie wydatków
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
      
      // Najpierw zwiń, potem rozwiń wybraną grupę
      setTimeout(() => {
        setForceCollapseAll(false)
        setHighlightedGroup(segmentName)
      }, 150)
      
      // Przewiń do eksploratora
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
      // Odkliknięcie - wyczyść wszystko
      setSelectedItem(null)
      setHighlightedGroup(null)
      setHighlightedEnvelope(null)
      return
    }

    setSelectedItem(item)
    
    // Ustaw odpowiednie podświetlenie na podstawie typu
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

  // Przygotowanie danych dla wykresu kołowego
  const chartData = useMemo(() => {
    if (!data?.spendingTree) return []
    
    return data.spendingTree.map((group, index) => ({
      name: group.name,
      value: group.total,
      color: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'][index % 10]
    }))
  }, [data?.spendingTree])

  // Przygotowanie danych dla wykresu trendów
  const trendsData = useMemo(() => {
    if (!data?.trends) {
      return []
    }
    
    // Sprawdź czy mamy dane trendów
    const totalExpenses = data.trends.totalExpenses || []
    
    if (selectedItem) {
      if (selectedItem.type === 'ENVELOPE') {
        // Znajdź trendy dla wybranej koperty
        const envelopeName = selectedItem.name
        const envelopeTrends = data.trends.byEnvelopeName?.[envelopeName] || []
        return envelopeTrends
      } else if (selectedItem.type === 'GROUP') {
        // Dla grupy, zsumuj trendy wszystkich kopert w tej grupie
        const groupEnvelopes = selectedItem.children?.filter(child => child.type === 'ENVELOPE') || []
        
        if (groupEnvelopes.length > 0) {
          // Znajdź trendy dla wszystkich kopert w grupie i zsumuj je
          const groupTrends: { [key: string]: number } = {}
          
          groupEnvelopes.forEach(envelope => {
            const envelopeName = envelope.name
            
            // Użyj byEnvelopeName do znalezienia trendów
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
          
          // Konwertuj na format oczekiwany przez wykres
          const result = Object.entries(groupTrends).map(([period, value]) => ({
            period,
            value
          }))
          
          // Jeśli nie ma trendów dla grupy, zwróć puste dane (nie wszystkie trendy)
          if (result.length === 0) {
            return []
          }
          
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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Sprawdzanie autoryzacji...</p>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

  if (loading && !data) {
        return (
            <div className="min-h-screen bg-theme-primary">
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
            <div style={{ fontSize: '14px' }}>
              Spróbuj odświeżyć stronę lub skontaktuj się z administratorem
            </div>
          </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-theme-primary">
            <div className="container-wide" style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px' }}>
        <h1 className="section-header" style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: 'var(--text-primary)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
                    📊 Analizy Budżetowe
                </h1>

        {/* Sekcja A: Globalne Kontrolery */}
        <GlobalFilters
          dateRange={dateRange}
          compareMode={compareMode}
          onDateRangeChange={handleDateRangeChange}
          onCompareModeChange={handleCompareModeChange}
          loading={loading}
        />

        {/* Sekcja B: Kluczowe Wskaźniki */}
        <KeyMetricsCards
          currentPeriod={data.mainMetrics.currentPeriod}
          previousPeriod={data.mainMetrics.previousPeriod}
          compareMode={compareMode}
          loading={loading}
        />

        {/* Sekcja C: Wizualizacje */}
                        <div className="grid-responsive" style={{
                            display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
          marginBottom: '24px'
        }}>
          {/* NOWY KOMPONENT Z WYKRESAMI - Client Component */}
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

        {/* Sekcja D: Interaktywny Eksplorator Wydatków */}
        <div id="expense-explorer">
          <InteractiveExpenseExplorer
            data={data.spendingTree}
            compareMode={compareMode}
            onItemClick={handleExplorerItemClick}
            loading={loading}
            highlightedGroup={highlightedGroup}
            highlightedEnvelope={highlightedEnvelope}
            forceCollapseAll={forceCollapseAll}
          />
        </div>

            </div>
        </div>
    )
}