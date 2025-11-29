'use client'

import { TrendingUp, TrendingDown, Minus, DollarSign, CreditCard, Target, PiggyBank } from 'lucide-react'

interface MetricData {
  income: number
  expense: number
  balance: number
  savingsRate: number
}

interface KeyMetricsCardsProps {
  currentPeriod: MetricData
  previousPeriod?: MetricData
  compareMode: boolean
  loading?: boolean
}

export function KeyMetricsCards({ 
  currentPeriod, 
  previousPeriod, 
  compareMode, 
  loading = false 
}: KeyMetricsCardsProps) {
  const formatMoney = (amount: number | undefined) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '0 zł'
    return amount.toLocaleString('pl-PL') + ' zł'
  }
  
  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    
    // Ogranicz procenty do rozsądnych wartości
    if (Math.abs(value) > 999) {
      return `${sign}999%+`
    }
    
    return `${sign}${value.toFixed(1)}%`
  }

  const getChangeColor = (change: number, isExpense: boolean = true) => {
    if (change === 0) return 'var(--text-secondary)'
    if (isExpense) {
      return change < 0 ? 'var(--accent-success)' : 'var(--accent-error)'
    } else {
      return change > 0 ? 'var(--accent-success)' : 'var(--accent-error)'
    }
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp size={16} />
    if (change < 0) return <TrendingDown size={16} />
    return <Minus size={16} />
  }

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const metrics = [
    {
      title: 'Całkowity Przychód',
      value: currentPeriod.income,
      icon: DollarSign,
      color: 'var(--accent-success)',
      bgColor: 'var(--bg-success)',
      change: compareMode && previousPeriod ? calculateChange(currentPeriod.income, previousPeriod.income) : undefined,
      isExpense: false
    },
    {
      title: 'Całkowity Wydatek',
      value: currentPeriod.expense,
      icon: CreditCard,
      color: 'var(--accent-error)',
      bgColor: 'var(--bg-error)',
      change: compareMode && previousPeriod ? calculateChange(currentPeriod.expense, previousPeriod.expense) : undefined,
      isExpense: true
    },
    {
      title: 'Bilans',
      value: currentPeriod.balance,
      icon: Target,
      color: currentPeriod.balance >= 0 ? 'var(--accent-success)' : 'var(--accent-error)',
      bgColor: currentPeriod.balance >= 0 ? 'var(--bg-success)' : 'var(--bg-error)',
      change: compareMode && previousPeriod ? calculateChange(currentPeriod.balance, previousPeriod.balance) : undefined
    },
    {
      title: 'Stopa Oszczędności',
      value: currentPeriod.savingsRate,
      icon: PiggyBank,
      color: currentPeriod.savingsRate >= 0 ? 'var(--accent-success)' : 'var(--accent-error)',
      bgColor: currentPeriod.savingsRate >= 0 ? 'var(--bg-success)' : 'var(--bg-error)',
      change: compareMode && previousPeriod ? calculateChange(currentPeriod.savingsRate, previousPeriod.savingsRate) : undefined,
      isPercentage: true
    }
  ]

  if (loading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '140px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '50%',
              marginBottom: '12px',
              animation: 'pulse 2s infinite'
            }} />
            <div style={{
              width: '80%',
              height: '16px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '4px',
              animation: 'pulse 2s infinite'
            }} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      marginBottom: '24px'
    }}>
      {metrics.map(metric => {
        const Icon = metric.icon
        
        return (
          <div key={metric.title} style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '140px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Tło z kolorem */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              backgroundColor: metric.color
            }} />
            
            {/* Ikona */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: metric.bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              color: metric.color
            }}>
              <Icon size={24} />
            </div>
            
            {/* Tytuł */}
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: '8px',
              textAlign: 'center'
            }}>
              {metric.title}
            </h3>
            
            {/* Wartość */}
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: metric.color,
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              {metric.isPercentage ? `${(metric.value * 100).toFixed(1)}%` : formatMoney(metric.value)}
            </div>
            
            {/* Porównanie */}
            {compareMode && previousPeriod && metric.change !== undefined && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 12px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '8px',
                border: '1px solid var(--border-primary)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: getChangeColor(metric.change, metric.isExpense)
                }}>
                  {getChangeIcon(metric.change)}
                  {formatPercentage(metric.change)}
                </div>
                <div style={{
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  textAlign: 'center'
                }}>
                  {metric.isPercentage 
                    ? `Poprzednio: ${((previousPeriod?.savingsRate || 0) * 100).toFixed(1)}%`
                    : `Poprzednio: ${formatMoney(
                        metric.title === 'Całkowity Przychód' ? previousPeriod?.income :
                        metric.title === 'Całkowity Wydatek' ? previousPeriod?.expense :
                        metric.title === 'Bilans' ? previousPeriod?.balance :
                        0
                      )}`
                  }
                </div>
              </div>
            )}

            {/* Wskaźnik postępu dla stopy oszczędności */}
            {metric.title === 'Stopa Oszczędności' && (
              <div style={{
                width: '100%',
                height: '6px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '3px',
                marginTop: '12px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.max(0, Math.min(100, metric.value * 100))}%`,
                  height: '100%',
                  backgroundColor: metric.color,
                  borderRadius: '3px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
