'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Calendar, ArrowRight } from 'lucide-react'
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
  }>
  transfers: Array<{
    name: string
    icon: string
    amount: number
    percentage: number
  }>
}

interface ArchivedMonthCardProps {
  monthData: MonthData
  onClick: () => void
}

export function ArchivedMonthCard({ monthData, onClick }: ArchivedMonthCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const savingsRate = monthData.income > 0 ? Math.round((monthData.balance / monthData.income) * 100) : 0
  const isPositiveBalance = monthData.balance >= 0
  const isGoodSavings = savingsRate >= 20
  const isWarningSavings = savingsRate >= 10 && savingsRate < 20
  
  const getStatusColor = () => {
    if (isGoodSavings) return 'var(--accent-success)'
    if (isWarningSavings) return 'var(--accent-warning)'
    return 'var(--accent-error)'
  }
  
  const getStatusIcon = () => {
    if (isGoodSavings) return '🎉'
    if (isWarningSavings) return '⚡'
    return '⚠️'
  }
  
  const getStatusText = () => {
    if (isGoodSavings) return 'Świetny miesiąc!'
    if (isWarningSavings) return 'Dobry miesiąc'
    return 'Wymaga uwagi'
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '16px',
        border: '1px solid var(--border-primary)',
        boxShadow: isHovered ? 'var(--shadow-lg)' : 'var(--shadow-md)',
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: `linear-gradient(90deg, ${getStatusColor()}, ${getStatusColor()}88)`,
        borderRadius: '16px 16px 0 0'
      }} />
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '20px'
      }}>
        <div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: '0 0 4px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Calendar size={20} />
            {monthData.month} {monthData.year}
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            color: getStatusColor(),
            fontWeight: '600'
          }}>
            <span>{getStatusIcon()}</span>
            {getStatusText()}
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: 'var(--text-secondary)',
          fontSize: '14px',
          opacity: isHovered ? 1 : 0.7,
          transition: 'opacity 0.2s ease'
        }}>
          <span>Zobacz szczegóły</span>
          <ArrowRight size={16} style={{
            transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
            transition: 'transform 0.2s ease'
          }} />
        </div>
      </div>

      {/* Main metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {/* Income */}
        <div style={{
          backgroundColor: 'var(--bg-tertiary)',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid var(--border-primary)',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginBottom: '8px',
            color: 'var(--accent-success)'
          }}>
            <TrendingUp size={16} />
            <span style={{ fontSize: '12px', fontWeight: '600' }}>Przychody</span>
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: 'var(--accent-success)'
          }}>
            +{formatMoney(monthData.income)}
          </div>
        </div>

        {/* Expenses */}
        <div style={{
          backgroundColor: 'var(--bg-tertiary)',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid var(--border-primary)',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginBottom: '8px',
            color: 'var(--accent-error)'
          }}>
            <TrendingDown size={16} />
            <span style={{ fontSize: '12px', fontWeight: '600' }}>Wydatki</span>
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: 'var(--accent-error)'
          }}>
            -{formatMoney(monthData.expenses)}
          </div>
        </div>
      </div>

      {/* Balance and savings */}
      <div style={{
        backgroundColor: 'var(--bg-tertiary)',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            <DollarSign size={14} />
            Bilans
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            color: isPositiveBalance ? 'var(--accent-success)' : 'var(--accent-error)'
          }}>
            {isPositiveBalance ? '+' : ''}{formatMoney(monthData.balance)}
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            fontWeight: '500'
          }}>
            Oszczędności
          </span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{
              fontSize: '16px',
              fontWeight: '700',
              color: getStatusColor()
            }}>
              {savingsRate}%
            </span>
            {savingsRate >= 20 && <span style={{ fontSize: '12px' }}>🎯</span>}
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-primary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>📦</span>
          <span>{monthData.envelopes.length} kopert</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>🔄</span>
          <span>{monthData.transfers.length} transferów</span>
        </div>
      </div>
    </div>
  )
}
