'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TopNavigation } from '@/components/ui/TopNavigation'
import { KeyMetricsCards } from '@/components/analytics/KeyMetricsCards'
import { AnalyticsCharts } from '@/components/analytics/AnalyticsCharts'
import { InteractiveExpenseExplorer } from '@/components/analytics/InteractiveExpenseExplorer'
import { authorizedFetch } from '@/lib/utils/api'
import { useAuth } from '@/lib/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ArrowLeft, Calendar } from 'lucide-react'
import { formatMoney } from '@/lib/utils/money'

interface MonthData {
  month: string
  year: number
  income: number
  expenses: number
  balance: number
  envelopes: Array<{
    name: string
    icon: string
    totalSpent: number
    percentage: number
    categories: Array<{
      name: string
      icon: string
      amount: number
      percentage: number
      transactions: Array<{
        id: string
        type: string
        amount: number
        description: string
        date: string
        category: string
      }>
    }>
  }>
  transfers: Array<{
    name: string
    icon: string
    amount: number
    percentage: number
    transactions: Array<{
      id: string
      type: string
      amount: number
      description: string
      date: string
      category: string
    }>
  }>
}

// Interfaces for Analytics components
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

export default function ArchiveMonthPage() {
  const { isAuthenticated, isCheckingAuth } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [monthData, setMonthData] = useState<MonthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  
  // State for Analytics components
  const [selectedItem, setSelectedItem] = useState<SpendingTreeNode | null>(null)
  const [highlightedGroup, setHighlightedGroup] = useState<string | null>(null)
  const [highlightedEnvelope, setHighlightedEnvelope] = useState<string | null>(null)

  const year = params.year as string
  const month = params.month as string

  useEffect(() => {
    if (!isAuthenticated) return
    fetchMonthData()
  }, [isAuthenticated, year, month])

  const fetchMonthData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await authorizedFetch('/api/archive')
      const allMonths = await response.json()
      
      console.log('All months from API:', allMonths)
      console.log('Looking for year:', year, 'month:', month)
      console.log('API response type:', typeof allMonths, 'is array:', Array.isArray(allMonths))
      
      // Debug each month structure
      allMonths.forEach((m: MonthData, index: number) => {
        console.log(`Month ${index}:`, {
          year: m.year,
          month: m.month,
          hasMonth: !!m.month,
          monthType: typeof m.month
        })
      })
      
      // Decode URL-encoded month name
      const decodedMonth = decodeURIComponent(month)
      console.log('Decoded month:', decodedMonth)
      
      // Check if month is already a Polish name or if it's a number
      let monthName: string
      if (isNaN(parseInt(month))) {
        // Month is already a Polish name (URL-encoded)
        monthName = decodedMonth
      } else {
        // Month is a number, convert to Polish name
        const monthNames = [
          'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
          'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'
        ]
        const monthIndex = parseInt(month) - 1
        monthName = monthNames[monthIndex]
      }
      
      console.log('Looking for month name:', monthName)
      
      // Find the specific month - filter out invalid months first
      const validMonths = allMonths.filter((m: MonthData) => m.month && typeof m.month === 'string')
      console.log('Valid months:', validMonths.length, 'out of', allMonths.length)
      
      const targetMonth = validMonths.find((m: MonthData) => 
        m.year.toString() === year && 
        m.month.toLowerCase() === monthName.toLowerCase()
      )
      
      console.log('Found month:', targetMonth)
      
      if (targetMonth) {
        setMonthData(targetMonth)
      } else {
        setError('Nie znaleziono danych dla tego miesiąca')
      }
    } catch (err) {
      console.error('Error fetching month data:', err)
      setError('Błąd pobierania danych miesiąca')
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    router.push('/archive')
  }

  // Convert archive data to Analytics format
  const convertToSpendingTree = (data: MonthData): SpendingTreeNode[] => {
    const spendingTree: SpendingTreeNode[] = []
    
    // Group envelopes by their group (assuming they have a group property)
    const groupedEnvelopes: { [key: string]: any[] } = {}
    
    data.envelopes.forEach(envelope => {
      // For now, we'll create a simple structure
      // In a real app, envelopes would have a group property
      const groupName = 'Wydatki' // Default group
      if (!groupedEnvelopes[groupName]) {
        groupedEnvelopes[groupName] = []
      }
      groupedEnvelopes[groupName].push(envelope)
    })
    
    // Create spending tree structure
    Object.entries(groupedEnvelopes).forEach(([groupName, envelopes]) => {
      const groupTotal = envelopes.reduce((sum, env) => sum + env.totalSpent, 0)
      
      const groupNode: SpendingTreeNode = {
        type: 'GROUP',
        id: groupName.toLowerCase().replace(/\s+/g, '-'),
        name: groupName,
        total: groupTotal,
        children: envelopes.map(envelope => {
          const envelopeNode: SpendingTreeNode = {
            type: 'ENVELOPE',
            id: envelope.name.toLowerCase().replace(/\s+/g, '-'),
            name: envelope.name,
            total: envelope.totalSpent,
            children: envelope.categories.map((category: any) => ({
              type: 'CATEGORY' as const,
              id: category.name.toLowerCase().replace(/\s+/g, '-'),
              name: category.name,
              total: category.amount,
              children: category.transactions.map((transaction: any) => ({
                type: 'TRANSACTION' as const,
                id: transaction.id,
                name: transaction.description,
                total: transaction.amount,
                date: transaction.date,
                description: transaction.description,
                amount: transaction.amount
              }))
            }))
          }
          return envelopeNode
        })
      }
      
      spendingTree.push(groupNode)
    })
    
    return spendingTree
  }

  // Prepare chart data
  const chartData = monthData ? monthData.envelopes.map(env => ({
    name: env.name,
    value: env.totalSpent
  })) : []

  // Handle segment click from chart
  const handleSegmentClick = (segmentName: string, segmentValue?: number) => {
    if (selectedItem?.name === segmentName) {
      setSelectedItem(null)
      setHighlightedGroup(null)
      setHighlightedEnvelope(null)
      return
    }

    // Find item in spending tree
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
    
    const spendingTree = monthData ? convertToSpendingTree(monthData) : []
    const item = findItem(spendingTree)
    if (item) {
      setSelectedItem(item)
      setHighlightedGroup(segmentName)
      setHighlightedEnvelope(null)
    }
  }

  // Handle explorer item click
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
      <div className="min-h-screen bg-theme-primary">
        <TopNavigation />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh'
        }}>
          <LoadingSpinner size="large" text="Ładowanie danych miesiąca..." />
        </div>
      </div>
    )
  }

  if (error || !monthData) {
    return (
      <div className="min-h-screen bg-theme-primary">
        <TopNavigation />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh'
        }}>
          <div className="bg-theme-secondary card" style={{
            padding: '32px',
            borderRadius: '12px',
            textAlign: 'center',
            color: 'var(--accent-error)',
            border: '1px solid var(--accent-error)',
            maxWidth: '400px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <p style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '600' }}>Błąd ładowania</p>
            <p style={{ fontSize: '14px', marginBottom: '16px' }}>{error}</p>
            <button
              onClick={goBack}
              className="nav-button"
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

  const savingsRate = monthData.income > 0 ? (monthData.balance / monthData.income) : 0
  const spendingTree = monthData ? convertToSpendingTree(monthData) : []

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
              {monthData.month} {monthData.year}
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
          currentPeriod={{
            income: monthData.income,
            expense: monthData.expenses,
            balance: monthData.balance,
            savingsRate: savingsRate
          }}
          compareMode={false}
          loading={loading}
        />

        {/* Analytics Charts */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: '24px',
          marginBottom: '24px'
        }}>
          <AnalyticsCharts 
            data={chartData} 
            total={monthData.expenses}
            onSegmentClick={handleSegmentClick}
          />
        </div>

        {/* Interactive Expense Explorer */}
        <div id="expense-explorer">
          <InteractiveExpenseExplorer
            data={spendingTree}
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
