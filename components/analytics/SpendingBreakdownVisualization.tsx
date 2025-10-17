'use client'

import { DonutChart, Legend } from '@tremor/react'

interface ChartData {
  name: string
  value: number
  color: string
}

interface SpendingBreakdownVisualizationProps {
  data: ChartData[]
  onSegmentClick?: (segmentName: string) => void
  loading?: boolean
}

export function SpendingBreakdownVisualization({ 
  data, 
  onSegmentClick, 
  loading = false 
}: SpendingBreakdownVisualizationProps) {
  const valueFormatter = (number: number) =>
    `${new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(number)}`

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '50%',
          animation: 'pulse 2s infinite'
        }} />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            Brak danych do wyświetlenia
          </div>
          <div style={{ fontSize: '14px' }}>
            Dodaj transakcje, aby zobaczyć podział wydatków
          </div>
        </div>
      </div>
    )
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
      {/* Nagłówek */}
      <div style={{
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📊 Podział Wydatków
        </h3>
        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          margin: '0'
        }}>
          Kliknij na segment, aby zobaczyć szczegóły w eksploratorze poniżej
        </p>
      </div>

      {/* Wykres i legenda */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '32px',
        flexWrap: 'wrap',
        minHeight: '300px'
      }}>
        <div style={{ flex: '1', minWidth: '300px' }}>
          <DonutChart
            data={data}
            category="value"
            index="name"
            valueFormatter={valueFormatter}
            colors={data.map(item => item.color)}
            className="h-80 w-80"
            showAnimation
            onValueChange={(value) => {
              if (onSegmentClick && value) {
                onSegmentClick(value.name)
              }
            }}
          />
        </div>
        <div style={{ flex: '1', minWidth: '250px' }}>
          <Legend 
            categories={data.map(item => item.name)}
            className="max-w-full"
            style={{
              fontSize: '16px',
              color: 'var(--text-primary)',
              fontWeight: '500'
            }}
          />
        </div>
      </div>
    </div>
  )
}
