'use client'

import { useMemo } from 'react'

interface MonthProgressProps {
  totalIncome: number
  totalExpenses: number
  daysLeft: number
  currentDay: number
  totalDays: number
}

export function MonthProgress({ 
  totalIncome, 
  totalExpenses, 
  daysLeft, 
  currentDay, 
  totalDays 
}: MonthProgressProps) {
  const progressData = useMemo(() => {
    // Postęp miesiąca (dni)
    const monthProgress = Math.round((currentDay / totalDays) * 100)
    
    // Postęp wydatków w stosunku do przychodów
    const expenseProgress = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0
    
    // Średnie dzienne wydatki
    const avgDailyExpenses = currentDay > 0 ? totalExpenses / currentDay : 0
    
    // Prognoza wydatków na koniec miesiąca
    const projectedExpenses = avgDailyExpenses * totalDays
    
    // Status budżetu
    const budgetStatus = expenseProgress > 100 ? 'over' : 
                        expenseProgress > 80 ? 'warning' : 'good'
    
    return {
      monthProgress,
      expenseProgress,
      avgDailyExpenses,
      projectedExpenses,
      budgetStatus
    }
  }, [totalIncome, totalExpenses, daysLeft, currentDay, totalDays])

  const getStatusColor = () => {
    switch (progressData.budgetStatus) {
      case 'over': return '#dc2626'
      case 'warning': return '#f59e0b'
      default: return '#10b981'
    }
  }

  const getStatusIcon = () => {
    switch (progressData.budgetStatus) {
      case 'over': return '⚠️'
      case 'warning': return '⚡'
      default: return '✅'
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid var(--border-primary)',
      boxShadow: 'var(--shadow-md)',
      marginBottom: '16px'
    }}>
      {/* Nagłówek */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📅 Postęp Miesiąca
        </h3>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          fontWeight: '500',
          color: getStatusColor()
        }}>
          {getStatusIcon()}
          {progressData.budgetStatus === 'over' ? 'Przekroczono budżet' :
           progressData.budgetStatus === 'warning' ? 'Uwaga' : 'W normie'}
        </div>
      </div>

      {/* Postęp miesiąca (dni) */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--text-secondary)'
          }}>
            Postęp miesiąca
          </span>
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            {currentDay}/{totalDays} dni ({progressData.monthProgress}%)
          </span>
        </div>
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progressData.monthProgress}%`,
            height: '100%',
            backgroundColor: '#3b82f6',
            borderRadius: '4px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Postęp wydatków */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--text-secondary)'
          }}>
            Wydatki vs Przychody
          </span>
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            color: getStatusColor()
          }}>
            {progressData.expenseProgress}%
          </span>
        </div>
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.min(progressData.expenseProgress, 100)}%`,
            height: '100%',
            backgroundColor: getStatusColor(),
            borderRadius: '4px',
            transition: 'width 0.3s ease, background-color 0.3s ease'
          }} />
        </div>
      </div>

      {/* Statystyki */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        padding: '12px',
        backgroundColor: 'var(--bg-tertiary)',
        borderRadius: '8px',
        border: '1px solid var(--border-primary)'
      }}>
        <div>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginBottom: '4px'
          }}>
            Średnio dziennie
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            {formatMoney(progressData.avgDailyExpenses)}
          </div>
        </div>
        <div>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginBottom: '4px'
          }}>
            Prognoza na koniec
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: progressData.projectedExpenses > totalIncome ? '#dc2626' : 'var(--text-primary)'
          }}>
            {formatMoney(progressData.projectedExpenses)}
          </div>
        </div>
      </div>

      {/* Wskazówka */}
      {progressData.budgetStatus !== 'good' && (
        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          backgroundColor: progressData.budgetStatus === 'over' ? '#fef2f2' : '#fffbeb',
          border: `1px solid ${progressData.budgetStatus === 'over' ? '#fecaca' : '#fed7aa'}`,
          borderRadius: '6px',
          fontSize: '12px',
          color: progressData.budgetStatus === 'over' ? '#dc2626' : '#d97706'
        }}>
          {progressData.budgetStatus === 'over' 
            ? '⚠️ Wydatki przekroczyły przychody. Rozważ ograniczenie wydatków.'
            : '⚡ Wydatki zbliżają się do przychodów. Uważaj na budżet.'}
        </div>
      )}
    </div>
  )
}
