// app/analytics/page.tsx - Z WŁASNYM PIĘKNYM WYKRESEM
'use client'

import { useState, useEffect } from 'react'
import { TopNavigation } from '@/components/ui/TopNavigation'

interface MonthlyData {
    month: string
    year: number
    income: number
    expenses: number
    savings: number
}

interface CategoryBreakdown {
    categoryId: string
    categoryName: string
    categoryIcon: string
    amount: number
    percentage: number
}

interface CategoryComparison {
    categoryId: string
    categoryName: string
    categoryIcon: string
    currentAmount: number
    previousAmount: number
    change: number
    changePercent: number
}

interface EnvelopeAnalysis {
    name: string
    icon: string
    plannedAmount: number
    totalSpent: number
    avgMonthlySpent: number
    categoryBreakdown: CategoryBreakdown[]
    monthlyComparison?: {
        currentMonth: string
        previousMonth: string
        currentTotal: number
        previousTotal: number
        totalChange: number
        totalChangePercent: number
        categoryComparisons: CategoryComparison[]
    }
}

interface TransferAnalysis {
    name: string
    amount: number
    percentage: number
}

interface AnalyticsData {
    monthlyTrends: MonthlyData[]
    envelopeAnalysis: EnvelopeAnalysis[]
    transfers: TransferAnalysis[]
    monthComparison: {
        incomeChange: number
        expenseChange: number
        savingsChange: number
        incomeChangePercent: number
        expenseChangePercent: number
    } | null
    movingAverages: {
        avgIncome: number
        avgExpenses: number
        avgSavings: number
    }
    summary: {
        totalRealExpenses: number
        totalTransfers: number
        expenseVsTransferRatio: number
    }
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [expandedEnvelopes, setExpandedEnvelopes] = useState<Set<string>>(new Set())
    const [selectedPeriod, setSelectedPeriod] = useState<string>('3months')

    const periodOptions = [
        { value: '1month', label: 'Ostatni miesiąc' },
        { value: '3months', label: 'Ostatnie 3 miesiące' },
        { value: '6months', label: 'Ostatnie 6 miesięcy' },
        { value: 'currentYear', label: 'Bieżący rok' }
    ]

    useEffect(() => {
        fetch(`/api/analytics?period=${selectedPeriod}`)
            .then(res => res.json())
            .then(data => {
                setData(data)
                setLoading(false)
            })
            .catch(err => {
                console.error('Analytics error:', err)
                setLoading(false)
            })
    }, [selectedPeriod])

    const formatMoney = (amount: number) => amount.toLocaleString('pl-PL') + ' zł'

    const formatChange = (change: number) => {
        const sign = change >= 0 ? '+' : ''
        return `${sign}${formatMoney(change)}`
    }

    const getChangeColor = (change: number, isExpense: boolean = true) => {
        if (change === 0) return '#6b7280'
        // Dla wydatków: zmniejszenie (ujemne) = dobre (zielone)
        // Dla przychodów: zwiększenie (dodatnie) = dobre (zielone)
        if (isExpense) {
            return change < 0 ? '#059669' : '#dc2626'
        } else {
            return change > 0 ? '#059669' : '#dc2626'
        }
    }

    const toggleEnvelope = (envelopeName: string) => {
        const newExpanded = new Set(expandedEnvelopes)
        if (newExpanded.has(envelopeName)) {
            newExpanded.delete(envelopeName)
        } else {
            newExpanded.add(envelopeName)
        }
        setExpandedEnvelopes(newExpanded)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh'
                }}>
                    <div style={{ fontSize: '24px', color: '#6b7280' }}>
                        📊 Ładowanie analiz...
                    </div>
                </div>
            </div>
        )
    }

    if (!data) {
        return <div>Błąd ładowania danych</div>
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <TopNavigation />
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px' }}>
                <h1 className="text-3xl font-bold text-gray-900" style={{ marginBottom: '24px' }}>
                    📊 Analizy Budżetowe
                </h1>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* PODSUMOWANIE */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '24px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                    }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
                            📈 Podsumowanie finansowe
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                                <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '4px' }}>Rzeczywiste wydatki</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
                                    {formatMoney(data.summary.totalRealExpenses)}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#dbeafe', borderRadius: '8px' }}>
                                <div style={{ fontSize: '14px', color: '#1e40af', marginBottom: '4px' }}>Transfery i oszczędności</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                                    {formatMoney(data.summary.totalTransfers)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* WŁASNY PIĘKNY WYKRES CSS + SVG */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '24px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                    }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📈 Trendy Miesięczne (ostatnie 6 miesięcy)
                        </h2>

                        {/* WYKRES */}
                        <div style={{ width: '100%', height: '350px', marginBottom: '20px', position: 'relative' }}>
                            {(() => {
                                const chartData = data.monthlyTrends.slice(-6)
                                if (chartData.length === 0) {
                                    return (
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            height: '100%',
                                            color: '#6b7280',
                                            fontSize: '16px'
                                        }}>
                                            📊 Brak danych do wyświetlenia
                                        </div>
                                    )
                                }

                                // Zabezpieczenie przed pustymi danymi
                                const validData = chartData.filter(m => m.income >= 0 && m.expenses >= 0)
                                if (validData.length < 2) {
                                    return (
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            height: '100%',
                                            color: '#6b7280',
                                            fontSize: '16px'
                                        }}>
                                            📈 Potrzeba więcej danych do wyświetlenia wykresu (minimum 2 miesiące)
                                        </div>
                                    )
                                }

                                const maxIncome = Math.max(...validData.map(m => m.income))
                                const maxExpense = Math.max(...validData.map(m => m.expenses))
                                const maxValue = Math.max(maxIncome, maxExpense, 1000) * 1.1 // 10% margines, minimum 1000

                                const chartWidth = 800
                                const chartHeight = 280
                                const padding = { top: 40, right: 40, bottom: 40, left: 60 }
                                const plotWidth = chartWidth - padding.left - padding.right
                                const plotHeight = chartHeight - padding.top - padding.bottom

                                // POPRAWIONE funkcje do konwersji danych na pozycje
                                const getX = (index: number) => {
                                    if (validData.length <= 1) return padding.left + plotWidth / 2
                                    return padding.left + (index * plotWidth) / (validData.length - 1)
                                }

                                const getY = (value: number) => {
                                    if (maxValue <= 0) return padding.top + plotHeight / 2
                                    return padding.top + (1 - Math.max(0, value) / maxValue) * plotHeight
                                }

                                // Stwórz punkty dla linii - ZABEZPIECZONE
                                const incomePoints = validData.map((m, i) => {
                                    const x = getX(i)
                                    const y = getY(m.income)
                                    return `${isNaN(x) ? 0 : x},${isNaN(y) ? 0 : y}`
                                }).join(' ')

                                const expensePoints = validData.map((m, i) => {
                                    const x = getX(i)
                                    const y = getY(m.expenses)
                                    return `${isNaN(x) ? 0 : x},${isNaN(y) ? 0 : y}`
                                }).join(' ')

                                // Stwórz obszary pod liniami
                                const baseY = getY(0)
                                const incomeArea = `M ${getX(0)},${baseY} L ${incomePoints} L ${getX(validData.length - 1)},${baseY} Z`
                                const expenseArea = `M ${getX(0)},${baseY} L ${expensePoints} L ${getX(validData.length - 1)},${baseY} Z`

                                return (
                                    <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ overflow: 'visible' }}>
                                        {/* Gradients */}
                                        <defs>
                                            <linearGradient id="incomeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                                                <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                                            </linearGradient>
                                            <linearGradient id="expenseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                                                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
                                            </linearGradient>
                                        </defs>

                                        {/* Siatka */}
                                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                                            const gridY = padding.top + ratio * plotHeight
                                            const labelValue = Math.round((maxValue * (1 - ratio)) / 1000)
                                            return (
                                                <g key={`grid-${i}`}>
                                                    <line
                                                        x1={padding.left}
                                                        y1={gridY}
                                                        x2={padding.left + plotWidth}
                                                        y2={gridY}
                                                        stroke="#f1f5f9"
                                                        strokeDasharray="3,3"
                                                    />
                                                    <text
                                                        x={padding.left - 10}
                                                        y={gridY + 4}
                                                        textAnchor="end"
                                                        fontSize="12"
                                                        fill="#64748b"
                                                    >
                                                        {labelValue}k
                                                    </text>
                                                </g>
                                            )
                                        })}

                                        {/* Obszary pod liniami */}
                                        <path d={incomeArea} fill="url(#incomeGradient)" opacity="0.6" />
                                        <path d={expenseArea} fill="url(#expenseGradient)" opacity="0.6" />

                                        {/* Linie */}
                                        <polyline
                                            points={incomePoints}
                                            fill="none"
                                            stroke="#10b981"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <polyline
                                            points={expensePoints}
                                            fill="none"
                                            stroke="#ef4444"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />

                                        {/* Punkty na liniach - ZABEZPIECZONE PRZED NaN */}
                                        {validData.map((month, i) => {
                                            const incomeX = getX(i)
                                            const incomeY = getY(month.income)
                                            const expenseX = getX(i)
                                            const expenseY = getY(month.expenses)

                                            // Sprawdź czy wartości są prawidłowe
                                            if (isNaN(incomeX) || isNaN(incomeY) || isNaN(expenseX) || isNaN(expenseY)) {
                                                console.warn(`NaN detected for month ${i}:`, { incomeX, incomeY, expenseX, expenseY })
                                                return null
                                            }

                                            return (
                                                <g key={`points-${i}`}>
                                                    {/* Punkt przychodów */}
                                                    <circle
                                                        cx={incomeX}
                                                        cy={incomeY}
                                                        r="6"
                                                        fill="white"
                                                        stroke="#10b981"
                                                        strokeWidth="3"
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                    {/* Punkt wydatków */}
                                                    <circle
                                                        cx={expenseX}
                                                        cy={expenseY}
                                                        r="6"
                                                        fill="white"
                                                        stroke="#ef4444"
                                                        strokeWidth="3"
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                </g>
                                            )
                                        })}

                                        {/* Etykiety miesięcy */}
                                        {validData.map((month, i) => {
                                            const labelX = getX(i)
                                            if (isNaN(labelX)) return null

                                            return (
                                                <text
                                                    key={`label-${i}`}
                                                    x={labelX}
                                                    y={chartHeight - 10}
                                                    textAnchor="middle"
                                                    fontSize="12"
                                                    fill="#64748b"
                                                    fontWeight="500"
                                                >
                                                    {month.month.slice(0, 3)}
                                                </text>
                                            )
                                        })}
                                    </svg>
                                )
                            })()}
                        </div>

                        {/* LEGENDA */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', fontSize: '14px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '16px',
                                    height: '16px',
                                    backgroundColor: '#10b981',
                                    borderRadius: '50%',
                                    border: '3px solid white',
                                    boxShadow: '0 0 0 2px #10b981'
                                }} />
                                <span style={{ color: '#374151', fontWeight: '500' }}>💰 Przychody</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '16px',
                                    height: '16px',
                                    backgroundColor: '#ef4444',
                                    borderRadius: '50%',
                                    border: '3px solid white',
                                    boxShadow: '0 0 0 2px #ef4444'
                                }} />
                                <span style={{ color: '#374151', fontWeight: '500' }}>💸 Wydatki</span>
                            </div>
                        </div>

                        {/* INTERAKTYWNE TOOLTIPS */}
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(data.monthlyTrends.slice(-6).length, 6)}, 1fr)`, gap: '8px', marginBottom: '20px' }}>
                            {data.monthlyTrends.slice(-6).map((month, index) => (
                                <div
                                    key={`tooltip-${index}`}
                                    style={{
                                        padding: '8px',
                                        backgroundColor: '#f8fafc',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0',
                                        textAlign: 'center',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#f1f5f9'
                                        e.currentTarget.style.transform = 'translateY(-2px)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#f8fafc'
                                        e.currentTarget.style.transform = 'translateY(0)'
                                    }}
                                >
                                    <div style={{ fontWeight: '600', marginBottom: '4px', color: '#1e293b' }}>
                                        {month.month.slice(0, 3)} {month.year}
                                    </div>
                                    <div style={{ color: '#10b981', fontWeight: '500' }}>
                                        💰 {formatMoney(month.income)}
                                    </div>
                                    <div style={{ color: '#ef4444', fontWeight: '500' }}>
                                        💸 {formatMoney(month.expenses)}
                                    </div>
                                    <div style={{
                                        color: month.savings >= 0 ? '#3b82f6' : '#dc2626',
                                        fontWeight: '600',
                                        marginTop: '2px',
                                        fontSize: '12px'
                                    }}>
                                        ⚖️ {month.savings >= 0 ? '+' : ''}{formatMoney(month.savings)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* MINI STATYSTYKI */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '16px',
                            paddingTop: '20px',
                            borderTop: '1px solid #f1f5f9'
                        }}>
                            {(() => {
                                const trend6Months = data.monthlyTrends.slice(-6)
                                const avgIncome = trend6Months.reduce((sum, m) => sum + m.income, 0) / trend6Months.length
                                const avgExpenses = trend6Months.reduce((sum, m) => sum + m.expenses, 0) / trend6Months.length
                                const avgSavings = trend6Months.reduce((sum, m) => sum + m.savings, 0) / trend6Months.length

                                return (
                                    <>
                                        <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '12px', color: '#166534', marginBottom: '4px' }}>Średnie przychody</div>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#15803d' }}>
                                                {formatMoney(Math.round(avgIncome))}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#22c55e', marginTop: '2px' }}>
                                                ostatnie 6 miesięcy
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '12px', color: '#991b1b', marginBottom: '4px' }}>Średnie wydatki</div>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}>
                                                {formatMoney(Math.round(avgExpenses))}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '2px' }}>
                                                ostatnie 6 miesięcy
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '12px', color: '#1e40af', marginBottom: '4px' }}>Średni bilans</div>
                                            <div style={{
                                                fontSize: '18px',
                                                fontWeight: 'bold',
                                                color: avgSavings >= 0 ? '#2563eb' : '#dc2626'
                                            }}>
                                                {avgSavings >= 0 ? '+' : ''}{formatMoney(Math.round(avgSavings))}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '2px' }}>
                                                ostatnie 6 miesięcy
                                            </div>
                                        </div>
                                    </>
                                )
                            })()}
                        </div>
                    </div>

                    {/* WYDATKI WG KOPERT Z WYBOREM OKRESU */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '24px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                💸 Wydatki wg kopert
                            </h2>

                            {/* SELECTOR OKRESU */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '14px', color: '#6b7280' }}>📅</span>
                                <select
                                    value={selectedPeriod}
                                    onChange={(e) => setSelectedPeriod(e.target.value)}
                                    style={{
                                        padding: '6px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        backgroundColor: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {periodOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {data.envelopeAnalysis.map((envelope, index) => {
                                const isExpanded = expandedEnvelopes.has(envelope.name)
                                const totalExpenses = data.summary.totalRealExpenses
                                const envelopePercentage = totalExpenses > 0 ? Math.round((envelope.totalSpent / totalExpenses) * 100) : 0

                                return (
                                    <div key={envelope.name} style={{
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        backgroundColor: '#f9fafb'
                                    }}>
                                        {/* GŁÓWNY RZĄD KOPERTY */}
                                        <div
                                            onClick={() => toggleEnvelope(envelope.name)}
                                            style={{
                                                padding: '16px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                borderRadius: '8px',
                                                backgroundColor: 'white',
                                                transition: 'background-color 0.2s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ fontSize: '24px' }}>{envelope.icon}</span>
                                                <div>
                                                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                                                        #{index + 1} {envelope.name}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                        {selectedPeriod === '1month'
                                                            ? `W tym miesiącu`
                                                            : `Średnio: ${formatMoney(envelope.avgMonthlySpent)}/miesiąc`
                                                        }
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}>
                                                        {formatMoney(envelope.totalSpent)}
                                                    </div>
                                                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                                        {envelopePercentage}% wszystkich wydatków
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '18px', color: '#6b7280' }}>
                                                    {isExpanded ? '▼' : '▶'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* SZCZEGÓŁY KATEGORII + PORÓWNANIE */}
                                        {isExpanded && (
                                            <div style={{ padding: '0 16px 16px' }}>

                                                {/* PORÓWNANIE MIESIĘCZNE */}
                                                {envelope.monthlyComparison && (
                                                    <div style={{
                                                        marginBottom: '16px',
                                                        padding: '12px',
                                                        backgroundColor: '#f0f9ff',
                                                        borderRadius: '6px',
                                                        border: '1px solid #bae6fd'
                                                    }}>
                                                        <h4 style={{
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            marginBottom: '8px',
                                                            color: '#0c4a6e',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}>
                                                            📊 Porównanie: {envelope.monthlyComparison.previousMonth} vs {envelope.monthlyComparison.currentMonth}
                                                        </h4>

                                                        {/* PORÓWNANIE KATEGORII */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            {envelope.monthlyComparison.categoryComparisons.map((comparison) => (
                                                                <div key={comparison.categoryId} style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    fontSize: '12px'
                                                                }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                        <span>{comparison.categoryIcon}</span>
                                                                        <span style={{ fontWeight: '500' }}>{comparison.categoryName}:</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        <span style={{ color: '#6b7280' }}>
                                                                            {formatMoney(comparison.previousAmount)}→{formatMoney(comparison.currentAmount)}
                                                                        </span>
                                                                        <span style={{
                                                                            fontWeight: '600',
                                                                            color: getChangeColor(comparison.change, true)
                                                                        }}>
                                                                            ({formatChange(comparison.change)})
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}

                                                            {/* SUMA PORÓWNANIA */}
                                                            <div style={{
                                                                borderTop: '1px solid #bae6fd',
                                                                paddingTop: '6px',
                                                                marginTop: '4px',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                fontSize: '13px',
                                                                fontWeight: '600'
                                                            }}>
                                                                <span>📈 Razem:</span>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <span style={{ color: '#6b7280' }}>
                                                                        {formatMoney(envelope.monthlyComparison.previousTotal)}→{formatMoney(envelope.monthlyComparison.currentTotal)}
                                                                    </span>
                                                                    <span style={{
                                                                        fontWeight: 'bold',
                                                                        color: getChangeColor(envelope.monthlyComparison.totalChange, true)
                                                                    }}>
                                                                        ({formatChange(envelope.monthlyComparison.totalChange)})
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* BREAKDOWN KATEGORII */}
                                                {envelope.categoryBreakdown.length > 0 && (
                                                    <div>
                                                        <h4 style={{
                                                            fontSize: '12px',
                                                            color: '#6b7280',
                                                            marginBottom: '8px',
                                                            fontWeight: '500'
                                                        }}>
                                                            🏷️ Szczegóły wydatków ({periodOptions.find(p => p.value === selectedPeriod)?.label.toLowerCase()}):
                                                        </h4>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            {envelope.categoryBreakdown.map((category) => (
                                                                <div key={category.categoryId} style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    padding: '8px 12px',
                                                                    backgroundColor: '#f3f4f6',
                                                                    borderRadius: '4px',
                                                                    marginLeft: '20px',
                                                                    fontSize: '14px'
                                                                }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        <span style={{ color: '#9ca3af' }}>├─</span>
                                                                        <span style={{ fontSize: '16px' }}>{category.categoryIcon}</span>
                                                                        <span style={{ fontWeight: '500' }}>{category.categoryName}</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                        <span style={{ color: '#dc2626', fontWeight: '600' }}>
                                                                            {formatMoney(category.amount)}
                                                                        </span>
                                                                        <span style={{
                                                                            fontSize: '12px',
                                                                            color: '#6b7280',
                                                                            minWidth: '40px',
                                                                            textAlign: 'right'
                                                                        }}>
                                                                            {category.percentage}%
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* TRANSFERY I OSZCZĘDNOŚCI */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '24px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                    }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🔄 Transfery i oszczędności
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                            {data.transfers.map((transfer, index) => (
                                <div key={transfer.name} style={{
                                    padding: '16px',
                                    backgroundColor: '#f0f9ff',
                                    borderRadius: '6px',
                                    border: '1px solid #e0f2fe'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: '500' }}>
                                            #{index + 1} {transfer.name}
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#0369a1' }}>{transfer.percentage}%</span>
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#0c4a6e', marginBottom: '6px' }}>
                                        {formatMoney(transfer.amount)}
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '4px',
                                        backgroundColor: '#e0f2fe',
                                        borderRadius: '2px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${transfer.percentage}%`,
                                            height: '100%',
                                            backgroundColor: '#0369a1',
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* PORÓWNANIA OKRESOWE */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '24px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                    }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📊 Porównania Okresowe
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>

                            {/* Miesiąc vs miesiąc */}
                            {data.monthComparison && (
                                <div style={{
                                    padding: '16px',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '6px',
                                    border: '1px solid #f3f4f6'
                                }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                                        📅 Miesiąc do miesiąca
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                                        <div>
                                            <span style={{ color: '#6b7280' }}>Przychody: </span>
                                            <span style={{
                                                fontWeight: '600',
                                                color: getChangeColor(data.monthComparison.incomeChange, false)
                                            }}>
                                                {formatChange(data.monthComparison.incomeChange)}
                                                ({data.monthComparison.incomeChangePercent >= 0 ? '+' : ''}{data.monthComparison.incomeChangePercent}%)
                                            </span>
                                        </div>
                                        <div>
                                            <span style={{ color: '#6b7280' }}>Wydatki: </span>
                                            <span style={{
                                                fontWeight: '600',
                                                color: getChangeColor(data.monthComparison.expenseChange, true)
                                            }}>
                                                {formatChange(data.monthComparison.expenseChange)}
                                                ({data.monthComparison.expenseChangePercent >= 0 ? '+' : ''}{data.monthComparison.expenseChangePercent}%)
                                            </span>
                                        </div>
                                        <div>
                                            <span style={{ color: '#6b7280' }}>Bilans: </span>
                                            <span style={{
                                                fontWeight: '600',
                                                color: getChangeColor(data.monthComparison.savingsChange, false)
                                            }}>
                                                {formatChange(data.monthComparison.savingsChange)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Średnie ruchome */}
                            <div style={{
                                padding: '16px',
                                backgroundColor: '#f9fafb',
                                borderRadius: '6px',
                                border: '1px solid #f3f4f6'
                            }}>
                                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                                    📈 Średnie ruchome (3 miesiące)
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                                    <div>
                                        <span style={{ color: '#6b7280' }}>Śr. przychody: </span>
                                        <span style={{ fontWeight: '600', color: '#059669' }}>
                                            {formatMoney(data.movingAverages.avgIncome)}
                                        </span>
                                    </div>
                                    <div>
                                        <span style={{ color: '#6b7280' }}>Śr. wydatki: </span>
                                        <span style={{ fontWeight: '600', color: '#dc2626' }}>
                                            {formatMoney(data.movingAverages.avgExpenses)}
                                        </span>
                                    </div>
                                    <div>
                                        <span style={{ color: '#6b7280' }}>Śr. bilans: </span>
                                        <span style={{
                                            fontWeight: '600',
                                            color: data.movingAverages.avgSavings >= 0 ? '#059669' : '#dc2626'
                                        }}>
                                            {formatMoney(data.movingAverages.avgSavings)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Prognoza */}
                            <div style={{
                                padding: '16px',
                                backgroundColor: '#f0f9ff',
                                borderRadius: '6px',
                                border: '1px solid #e0f2fe'
                            }}>
                                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#0369a1' }}>
                                    🔮 Prognoza (6 miesięcy)
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                                    <div>
                                        <span style={{ color: '#6b7280' }}>Przy obecnym tempie: </span>
                                        <span style={{ fontWeight: '600', color: '#0369a1' }}>
                                            {formatMoney(data.movingAverages.avgSavings * 6)}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                                        Przewidywany bilans za 6 miesięcy
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}