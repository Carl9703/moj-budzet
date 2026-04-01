'use client'

import { useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import { TrendingUp, Loader2, Calendar } from 'lucide-react'

// Hooks
import { useAnnualReport } from '@/lib/hooks/useAnnualReport'
import { useAnalyticsFilters } from '@/lib/hooks/useAnalyticsFilters'
import { useQuery } from '@tanstack/react-query'
import { fetchAnalyticsData, fetchIncomeAnalytics, fetchAvailableYears } from '@/lib/api/analytics'
import { useAuth } from '@/lib/hooks/useAuth'

// Tabs
import { YearlyAnalysisTab } from '@/components/features/analytics/tabs/YearlyAnalysisTab'
import { CurrentAnalysisTab } from '@/components/features/analytics/tabs/CurrentAnalysisTab'

type AnalyticsTab = 'yearly' | 'current'

function AnalyticsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuth()

  // Tab state - CURRENT is default
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<AnalyticsTab>(
    tabParam === 'yearly' ? 'yearly' : 'current'
  )

  // Year selector for yearly tab
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)

  const { data: availableYearsData } = useQuery({
    queryKey: ['availableYears'],
    queryFn: fetchAvailableYears,
    enabled: isAuthenticated
  })

  const availableYears = availableYearsData || [currentYear]

  // Annual Report data
  const { data: yearlyData, isLoading: yearlyLoading, error: yearlyError } = useAnnualReport(selectedYear)
  const { data: previousYearData } = useAnnualReport(selectedYear - 1)

  // Current Analysis data
  const { dateRange, compareMode, period, setDateRange, setCompareMode } = useAnalyticsFilters()

  const { data: currentData, isLoading: currentLoading } = useQuery({
    queryKey: ['analytics', dateRange.from?.toISOString(), dateRange.to?.toISOString(), compareMode],
    queryFn: () => fetchAnalyticsData(dateRange, compareMode),
    enabled: isAuthenticated && activeTab === 'current' && !!dateRange.from && !!dateRange.to,
    placeholderData: (previousData) => previousData
  })

  // Current Income data
  const { data: currentIncomeData, isLoading: currentIncomeLoading } = useQuery({
    queryKey: ['analytics-income', dateRange.from?.toISOString(), dateRange.to?.toISOString()],
    queryFn: () => fetchIncomeAnalytics(dateRange),
    enabled: isAuthenticated && activeTab === 'current' && !!dateRange.from && !!dateRange.to,
    placeholderData: (previousData) => previousData
  })

  const handleTabChange = (tab: AnalyticsTab) => {
    setActiveTab(tab)
    router.push(`/analytics?tab=${tab}`, { scroll: false })
  }




  if (yearlyError && activeTab === 'yearly') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Błąd ładowania danych</h2>
          <p className="text-slate-400 mb-4">
            Nie udało się załadować danych. Spróbuj ponownie później.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
          >
            Odśwież stronę
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 md:pb-8">
      <div className="max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 pt-0">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6 flex flex-col pt-4"
        >
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-1">
            📊 Analizy Finansowe
          </h1>
          <p className="text-xs text-slate-500 font-medium tracking-wide">
            Kompleksowy przegląd Twoich finansów
          </p>
        </motion.div>

        {/* Tab Switcher - CURRENT FIRST */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-2 mb-8 p-1 bg-slate-800/50 rounded-2xl border border-slate-700/50 w-full sm:w-fit"
        >
          <button
            onClick={() => handleTabChange('current')}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'current'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
          >
            <TrendingUp size={18} />
            Bieżąca Analiza
          </button>
          <button
            onClick={() => handleTabChange('yearly')}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'yearly'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
          >
            <Calendar size={18} />
            Roczne
          </button>
        </motion.div>

        {/* Tab Content */}
        {activeTab === 'yearly' && (
          <YearlyAnalysisTab
            data={yearlyData}
            previousYearData={previousYearData}
            loading={yearlyLoading}
            selectedYear={selectedYear}
            availableYears={availableYears}
            onYearChange={setSelectedYear}
          />
        )}

        {activeTab === 'current' && (
          <CurrentAnalysisTab
            data={currentData}
            incomeData={currentIncomeData}
            loading={currentLoading || currentIncomeLoading}
            dateRange={dateRange}
            compareMode={compareMode}
            period={period}
            onDateRangeChange={setDateRange}
            onCompareModeChange={setCompareMode}
          />
        )}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen bg-slate-950">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
      </div>
    }>
      <AnalyticsContent />
    </Suspense>
  )
}
