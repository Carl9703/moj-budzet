'use client'

import { useState, useEffect } from 'react'
import { TopNavigation } from '@/components/ui/TopNavigation'
import { AnalyticsFilters } from '@/components/analytics/AnalyticsFilters'
import { KeyMetrics } from '@/components/analytics/KeyMetrics'
import { SpendingBreakdownChart } from '@/components/analytics/SpendingBreakdownChart'
import { TrendsChart } from '@/components/analytics/TrendsChart'
import { DetailedDataTable } from '@/components/analytics/DetailedDataTable'
import { authorizedFetch } from '@/lib/utils/api'
import { useAuth } from '@/lib/hooks/useAuth'

interface DateRange {
    startDate: string
    endDate: string
}

interface AnalyticsData {
    mainMetrics: {
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
    spendingBreakdown: {
        byGroup: Array<{
            group: string
            amount: number
            percentage: number
            icon: string
            envelopes: Array<{
                name: string
                amount: number
                icon: string
                percentage: number
            }>
        }>
        byEnvelope: Array<{
            envelope: string
    amount: number
    percentage: number
            icon: string
            categories: Array<{
    categoryId: string
    categoryName: string
                amount: number
    icon: string
                percentage: number
            }>
        }>
        byCategory: Array<{
            category: string
    amount: number
    percentage: number
            icon: string
        }>
    }
    trends: Array<{
        period: string
        totalExpenses: number
    }>
}

export default function AnalyticsPage() {
    const { isAuthenticated, isCheckingAuth } = useAuth()
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        dateRange: { startDate: '', endDate: '' },
        compareMode: false,
        period: 'currentMonth'
    })
    const [selectedEnvelope, setSelectedEnvelope] = useState<string | undefined>()
    const [viewType, setViewType] = useState<'envelopes' | 'categories'>('envelopes')

    const fetchData = async (newFilters: typeof filters) => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (newFilters.dateRange.startDate && newFilters.dateRange.endDate) {
                params.append('startDate', newFilters.dateRange.startDate)
                params.append('endDate', newFilters.dateRange.endDate)
            } else {
                params.append('period', newFilters.period)
            }
            if (newFilters.compareMode) {
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
        fetchData(filters)
    }, [isAuthenticated])

    const handleFiltersChange = (newFilters: typeof filters) => {
        setFilters(newFilters)
        fetchData(newFilters)
    }
    
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

    if (loading) {
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
                        <div style={{ fontSize: '14px' }}>
                            Spróbuj odświeżyć stronę lub skontaktuj się z administratorem
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Przygotuj dane dla tabeli
    const tableData = viewType === 'envelopes' 
        ? data.spendingBreakdown.byEnvelope.map(item => ({
            name: item.envelope,
            amount: item.amount,
            percentage: item.percentage,
            icon: item.icon,
            comparison: filters.compareMode && data.mainMetrics.previousPeriod ? {
                previousAmount: 0, // TODO: Implement previous period data for envelopes
                change: 0,
                changePercent: 0
            } : undefined
        }))
        : data.spendingBreakdown.byCategory.map(item => ({
            name: item.category,
            amount: item.amount,
            percentage: item.percentage,
            icon: item.icon,
            comparison: filters.compareMode && data.mainMetrics.previousPeriod ? {
                previousAmount: 0, // TODO: Implement previous period data for categories
                change: 0,
                changePercent: 0
            } : undefined
        }))

    return (
        <div className="min-h-screen bg-theme-primary">
            <TopNavigation />
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px' }}>
                <h1 style={{
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

                {/* Globalne Filtry */}
                <AnalyticsFilters 
                    onFiltersChange={handleFiltersChange}
                    initialPeriod={filters.period}
                />

                {/* Kluczowe Wskaźniki */}
                <KeyMetrics
                    currentPeriod={data.mainMetrics.currentPeriod}
                    previousPeriod={data.mainMetrics.previousPeriod}
                    compareMode={filters.compareMode}
                    loading={loading}
                />

                {/* Główna Wizualizacja */}
                <SpendingBreakdownChart
                    data={data.spendingBreakdown}
                    onEnvelopeSelect={setSelectedEnvelope}
                    selectedEnvelope={selectedEnvelope}
                    loading={loading}
                />

                {/* Analiza Trendów */}
                <TrendsChart
                    data={data.trends}
                    selectedEnvelope={selectedEnvelope}
                    loading={loading}
                />


                {/* Szczegółowa Tabela */}
                <DetailedDataTable
                    data={tableData}
                    viewType={viewType}
                    compareMode={filters.compareMode}
                    loading={loading}
                    onViewTypeChange={setViewType}
                />
            </div>
        </div>
    )
}