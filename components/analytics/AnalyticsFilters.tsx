'use client'

import { useState } from 'react'

interface DateRange {
    startDate: string
    endDate: string
}

interface AnalyticsFiltersProps {
    onFiltersChange: (filters: {
        dateRange: DateRange
        compareMode: boolean
        period: string
    }) => void
    initialPeriod?: string
}

const periodOptions = [
    { value: 'currentMonth', label: 'Bieżący miesiąc' },
    { value: 'previousMonth', label: 'Poprzedni miesiąc' },
    { value: 'thisQuarter', label: 'Ten kwartał' },
    { value: 'thisYear', label: 'Ten rok' },
    { value: 'custom', label: 'Niestandardowy zakres' }
]

export function AnalyticsFilters({ onFiltersChange, initialPeriod = 'currentMonth' }: AnalyticsFiltersProps) {
    const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod)
    const [compareMode, setCompareMode] = useState(false)
    const [customDateRange, setCustomDateRange] = useState<DateRange>({
        startDate: '',
        endDate: ''
    })

    const handlePeriodChange = (period: string) => {
        setSelectedPeriod(period)
        
        let dateRange: DateRange
        
        if (period === 'custom') {
            dateRange = customDateRange
        } else {
            dateRange = getDateRangeForPeriod(period)
        }
        
        onFiltersChange({
            dateRange,
            compareMode,
            period
        })
    }

    const handleCompareToggle = (enabled: boolean) => {
        setCompareMode(enabled)
        onFiltersChange({
            dateRange: selectedPeriod === 'custom' ? customDateRange : getDateRangeForPeriod(selectedPeriod),
            compareMode: enabled,
            period: selectedPeriod
        })
    }

    const handleCustomDateChange = (field: 'startDate' | 'endDate', value: string) => {
        const newRange = { ...customDateRange, [field]: value }
        setCustomDateRange(newRange)
        
        if (selectedPeriod === 'custom') {
            onFiltersChange({
                dateRange: newRange,
                compareMode,
                period: selectedPeriod
            })
        }
    }

    const getDateRangeForPeriod = (period: string): DateRange => {
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth()
        
        switch (period) {
            case 'currentMonth':
                return {
                    startDate: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
                    endDate: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
                }
            case 'previousMonth':
                return {
                    startDate: new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0],
                    endDate: new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]
                }
            case 'thisQuarter':
                const quarterStart = Math.floor(currentMonth / 3) * 3
                return {
                    startDate: new Date(currentYear, quarterStart, 1).toISOString().split('T')[0],
                    endDate: new Date(currentYear, quarterStart + 3, 0).toISOString().split('T')[0]
                }
            case 'thisYear':
                return {
                    startDate: new Date(currentYear, 0, 1).toISOString().split('T')[0],
                    endDate: new Date(currentYear, 11, 31).toISOString().split('T')[0]
                }
            default:
                return {
                    startDate: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
                    endDate: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
                }
        }
    }

    return (
        <div style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-md)',
            marginBottom: '24px'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <h2 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: 0
                }}>
                    🔍 Filtry Analiz
                </h2>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                alignItems: 'end'
            }}>
                {/* Selektor Zakresu Dat */}
                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: 'var(--text-primary)',
                        marginBottom: '8px'
                    }}>
                        📅 Zakres Dat
                    </label>
                    <select
                        value={selectedPeriod}
                        onChange={(e) => handlePeriodChange(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {periodOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Niestandardowy Zakres Dat */}
                {selectedPeriod === 'custom' && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px'
                    }}>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '12px',
                                fontWeight: '500',
                                color: 'var(--text-secondary)',
                                marginBottom: '4px'
                            }}>
                                Data początkowa
                            </label>
                            <input
                                type="date"
                                value={customDateRange.startDate}
                                onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    border: '1px solid var(--border-primary)',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '12px',
                                fontWeight: '500',
                                color: 'var(--text-secondary)',
                                marginBottom: '4px'
                            }}>
                                Data końcowa
                            </label>
                            <input
                                type="date"
                                value={customDateRange.endDate}
                                onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    border: '1px solid var(--border-primary)',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Przełącznik Porównania */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-primary)'
                }}>
                    <label style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flex: 1
                    }}>
                        <input
                            type="checkbox"
                            checked={compareMode}
                            onChange={(e) => handleCompareToggle(e.target.checked)}
                            style={{
                                width: '18px',
                                height: '18px',
                                cursor: 'pointer',
                                accentColor: 'var(--accent-primary)'
                            }}
                        />
                        <span>📊 Porównaj z poprzednim okresem</span>
                    </label>
                </div>
            </div>

            {/* Podgląd Aktywnych Filtrów */}
            <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '8px',
                border: '1px solid var(--border-primary)'
            }}>
                <div style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px',
                    fontWeight: '500'
                }}>
                    Aktywne filtry:
                </div>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px'
                }}>
                    <span style={{
                        padding: '4px 8px',
                        backgroundColor: 'var(--accent-primary)',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                    }}>
                        {periodOptions.find(p => p.value === selectedPeriod)?.label}
                    </span>
                    {compareMode && (
                        <span style={{
                            padding: '4px 8px',
                            backgroundColor: 'var(--accent-success)',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500'
                        }}>
                            Tryb porównawczy
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
