'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TopNavigation } from '@/components/ui/TopNavigation'
import { authorizedFetch } from '@/lib/utils/api'
import { useAuth } from '@/lib/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { formatMoney } from '@/lib/utils/money'

// Lazy load analytics components
const DonutChart = lazy(() => import('@tremor/react').then(m => ({ default: m.DonutChart })))
const BarChart = lazy(() => import('@tremor/react').then(m => ({ default: m.BarChart })))

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

export default function ArchiveMonthPage() {
  const { isAuthenticated, isCheckingAuth } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [monthData, setMonthData] = useState<MonthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

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
      
      // Debug each month structure
      allMonths.forEach((m: MonthData, index: number) => {
        console.log(`Month ${index}:`, {
          year: m.year,
          month: m.month,
          hasMonth: !!m.month,
          monthType: typeof m.month
        })
      })
      
      // Convert month number to Polish month name
      const monthNames = [
        'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
        'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'
      ]
      
      const monthIndex = parseInt(month) - 1
      const monthName = monthNames[monthIndex]
      
      console.log('Looking for month name:', monthName)
      
      // Find the specific month
      const targetMonth = allMonths.find((m: MonthData) => 
        m.year.toString() === year && 
        m.month && m.month.toLowerCase() === monthName.toLowerCase()
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

  const savingsRate = monthData.income > 0 ? Math.round((monthData.balance / monthData.income) * 100) : 0
  const isPositiveBalance = monthData.balance >= 0

  // Prepare data for charts
  const envelopeChartData = monthData.envelopes.map(env => ({
    name: env.name,
    value: env.totalSpent,
    icon: env.icon
  }))

  const transferChartData = monthData.transfers.map(transfer => ({
    name: transfer.name,
    value: transfer.amount,
    icon: transfer.icon
  }))

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

        {/* KPIs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div className="bg-theme-secondary card" style={{
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--border-primary)',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px', color: 'var(--accent-success)' }}>
              <TrendingUp size={24} />
              <span style={{ fontSize: '14px', fontWeight: '600' }}>Przychody</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-success)' }}>
              +{formatMoney(monthData.income)}
            </div>
          </div>

          <div className="bg-theme-secondary card" style={{
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--border-primary)',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px', color: 'var(--accent-error)' }}>
              <TrendingDown size={24} />
              <span style={{ fontSize: '14px', fontWeight: '600' }}>Wydatki</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-error)' }}>
              -{formatMoney(monthData.expenses)}
            </div>
          </div>

          <div className="bg-theme-secondary card" style={{
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--border-primary)',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px', color: 'var(--accent-info)' }}>
              <DollarSign size={24} />
              <span style={{ fontSize: '14px', fontWeight: '600' }}>Bilans</span>
            </div>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: isPositiveBalance ? 'var(--accent-success)' : 'var(--accent-error)' 
            }}>
              {isPositiveBalance ? '+' : ''}{formatMoney(monthData.balance)}
            </div>
          </div>

          <div className="bg-theme-secondary card" style={{
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--border-primary)',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px', color: 'var(--accent-warning)' }}>
              <span style={{ fontSize: '20px' }}>📊</span>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>Oszczędności</span>
            </div>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: savingsRate >= 20 ? 'var(--accent-success)' : savingsRate >= 10 ? 'var(--accent-warning)' : 'var(--accent-error)' 
            }}>
              {savingsRate}%
            </div>
          </div>
        </div>

        {/* Charts */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Envelope spending chart */}
          <div className="bg-theme-secondary card" style={{
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--border-primary)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📦 Wydatki z kopert
            </h3>
            <Suspense fallback={<div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Ładowanie wykresu...</div>}>
              <DonutChart
                data={envelopeChartData}
                category="value"
                index="name"
                colors={['blue', 'green', 'yellow', 'red', 'purple', 'orange', 'pink', 'indigo']}
                className="h-48"
              />
            </Suspense>
          </div>

          {/* Transfer chart */}
          <div className="bg-theme-secondary card" style={{
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--border-primary)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🔄 Transfery i przelewy
            </h3>
            <Suspense fallback={<div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Ładowanie wykresu...</div>}>
              <DonutChart
                data={transferChartData}
                category="value"
                index="name"
                colors={['cyan', 'teal', 'emerald', 'lime', 'amber', 'rose']}
                className="h-48"
              />
            </Suspense>
          </div>
        </div>

        {/* Interactive Explorer */}
        <div className="bg-theme-secondary card" style={{
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--border-primary)',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🔍 Interaktywny eksplorator wydatków
          </h3>
          <div className="space-y-6">
            {/* Koperty */}
            {monthData.envelopes.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  📦 Koperty ({monthData.envelopes.length})
                </h3>
                <div className="space-y-3">
                  {monthData.envelopes.map((envelope, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{envelope.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{envelope.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {envelope.categories.length} kategorii
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-red-600 dark:text-red-400">
                          {formatMoney(envelope.totalSpent)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {envelope.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transfery */}
            {monthData.transfers.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  🔄 Transfery ({monthData.transfers.length})
                </h3>
                <div className="space-y-3">
                  {monthData.transfers.map((transfer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{transfer.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{transfer.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {transfer.transactions.length} transakcji
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                          {formatMoney(transfer.amount)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {transfer.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
