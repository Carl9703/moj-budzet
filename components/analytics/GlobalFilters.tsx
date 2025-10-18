'use client'

import { useState } from 'react'
import { Calendar, CalendarDays, TrendingUp, CalendarRange } from 'lucide-react'

interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface GlobalFiltersProps {
  dateRange: DateRange
  compareMode: boolean
  onDateRangeChange: (range: DateRange) => void
  onCompareModeChange: (enabled: boolean) => void
  loading?: boolean
}

const PREDEFINED_PERIODS = [
  { 
    key: 'currentMonth', 
    label: 'Obecny miesiąc', 
    icon: Calendar,
    getDates: () => {
      const now = new Date()
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: now
      }
    }
  },
  { 
    key: 'previousMonth', 
    label: 'Poprzedni miesiąc', 
    icon: CalendarDays,
    getDates: () => {
      const now = new Date()
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      return {
        from: prevMonth,
        to: prevMonthEnd
      }
    }
  },
  { 
    key: 'last3Months', 
    label: 'Ostatnie 3 miesiące', 
    icon: TrendingUp,
    getDates: () => {
      const now = new Date()
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      return {
        from: threeMonthsAgo,
        to: now
      }
    }
  },
  { 
    key: 'last6Months', 
    label: 'Ostatnie 6 miesięcy', 
    icon: TrendingUp,
    getDates: () => {
      const now = new Date()
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
      return {
        from: sixMonthsAgo,
        to: now
      }
    }
  },
  { 
    key: 'currentYear', 
    label: 'Ten rok', 
    icon: CalendarRange,
    getDates: () => {
      const now = new Date()
      return {
        from: new Date(now.getFullYear(), 0, 1),
        to: now
      }
    }
  },
  { 
    key: 'previousYear', 
    label: 'Ubiegły rok', 
    icon: CalendarRange,
    getDates: () => {
      const now = new Date()
      const lastYear = now.getFullYear() - 1
      return {
        from: new Date(lastYear, 0, 1),
        to: new Date(lastYear, 11, 31)
      }
    }
  }
]

export function GlobalFilters({ 
  dateRange, 
  compareMode, 
  onDateRangeChange, 
  onCompareModeChange, 
  loading = false 
}: GlobalFiltersProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('currentMonth')
  const [isCustomRange, setIsCustomRange] = useState(false)

  const handlePeriodSelect = (periodKey: string) => {
    setSelectedPeriod(periodKey)
    setIsCustomRange(false)
    
    const period = PREDEFINED_PERIODS.find(p => p.key === periodKey)
    if (period) {
      const dates = period.getDates()
      onDateRangeChange(dates)
    }
  }

  const handleCustomRangeToggle = () => {
    setIsCustomRange(!isCustomRange)
    if (!isCustomRange) {
      setSelectedPeriod('custom')
    }
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return ''
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      padding: '24px',
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
          margin: '0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📅 Globalne Filtry
        </h2>
        
        {/* Przełącznik Porównania */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <label style={{
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <input
              type="checkbox"
              checked={compareMode}
              onChange={(e) => onCompareModeChange(e.target.checked)}
              disabled={loading}
              style={{
                width: '18px',
                height: '18px',
                accentColor: 'var(--accent-primary)',
                cursor: 'pointer'
              }}
            />
            Porównaj z poprzednim okresem
          </label>
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Predefiniowane okresy */}
        <div>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '12px'
          }}>
            Szybki wybór okresu
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {PREDEFINED_PERIODS.map(period => {
              const Icon = period.icon
              const isSelected = selectedPeriod === period.key && !isCustomRange
              
              return (
                <button
                  key={period.key}
                  onClick={() => handlePeriodSelect(period.key)}
                  disabled={loading}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: `2px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
                    backgroundColor: isSelected ? 'var(--accent-primary-alpha)' : 'var(--bg-tertiary)',
                    color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  <Icon size={16} />
                  {period.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Niestandardowy zakres dat */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <button
              onClick={handleCustomRangeToggle}
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: `1px solid ${isCustomRange ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
                backgroundColor: isCustomRange ? 'var(--accent-primary-alpha)' : 'transparent',
                color: isCustomRange ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: loading ? 0.6 : 1
              }}
            >
              Niestandardowy zakres
            </button>
          </div>

          {isCustomRange && (
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <label style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: 'var(--text-secondary)'
                }}>
                  Od
                </label>
                <input
                  type="date"
                  value={dateRange.from ? dateRange.from.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const fromDate = e.target.value ? new Date(e.target.value) : undefined
                    onDateRangeChange({ ...dateRange, from: fromDate })
                  }}
                  disabled={loading}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-primary)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    opacity: loading ? 0.6 : 1
                  }}
                />
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <label style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: 'var(--text-secondary)'
                }}>
                  Do
                </label>
                <input
                  type="date"
                  value={dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const toDate = e.target.value ? new Date(e.target.value) : undefined
                    onDateRangeChange({ ...dateRange, to: toDate })
                  }}
                  disabled={loading}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-primary)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    opacity: loading ? 0.6 : 1
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Podsumowanie wybranego okresu */}
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '8px',
          border: '1px solid var(--border-primary)'
        }}>
          <div style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            marginBottom: '4px'
          }}>
            Wybrany okres:
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
            {compareMode && (
              <span style={{
                marginLeft: '12px',
                fontSize: '14px',
                color: 'var(--accent-primary)',
                fontWeight: '500'
              }}>
                + Porównanie
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
