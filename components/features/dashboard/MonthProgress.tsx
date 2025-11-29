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
      padding: '16px',
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
        marginBottom: '12px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📅 Postęp Miesiąca
        </h3>
        <span style={{
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--text-primary)'
        }}>
          {currentDay}/{totalDays} dni ({progressData.monthProgress}%)
        </span>
      </div>

      {/* Pasek postępu */}
      <div style={{
        width: '100%',
        height: '12px',
        backgroundColor: 'var(--bg-tertiary)',
        borderRadius: '6px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          width: `${progressData.monthProgress}%`,
          height: '100%',
          backgroundColor: '#3b82f6',
          borderRadius: '6px',
          transition: 'width 0.3s ease',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)',
            borderRadius: '6px 6px 0 0'
          }} />
        </div>
      </div>
    </div>
  )
}
