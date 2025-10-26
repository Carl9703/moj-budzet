'use client'

import { LineChart, Card, Title } from '@tremor/react'
import { ANALYTICS_COLORS } from '@/lib/constants/colors'

interface TrendData {
  period: string
  value: number
}

interface TrendsVisualizationProps {
  data: TrendData[]
  selectedItem?: string
  onPeriodClick?: (period: string) => void
  loading?: boolean
}

export function TrendsVisualization({ 
  data, 
  selectedItem,
  onPeriodClick, 
  loading = false 
}: TrendsVisualizationProps) {
  const valueFormatter = (number: number) => {
    const formatted = new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number)
    return formatted
  }

  // Formatowanie okresu na czytelny format
  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-')
    const monthNames = [
      'Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze',
      'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'
    ]
    return `${monthNames[parseInt(month) - 1]} ${year.slice(-2)}`
  }

  // Przygotowanie danych dla wykresu (tylko bieżący rok)
  const currentYear = new Date().getFullYear().toString()
  const chartData = data
    .filter(item => item.period.split('-')[0] === currentYear)
    .map(item => ({
    period: formatPeriod(item.period),
    wydatki: item.value
  }))

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        </div>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📈</div>
          <Title className="text-gray-900 dark:text-white mb-2">Brak danych trendów</Title>
          <p className="text-gray-500 dark:text-gray-400">
            Dodaj transakcje z różnych okresów, aby zobaczyć trendy
          </p>
          <div className="mt-4 text-xs text-gray-400">
            Debug: data={JSON.stringify(data)}, selectedItem={selectedItem}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      {/* Nagłówek */}
      <div className="mb-5">
        <Title className="text-gray-900 dark:text-white flex items-center gap-2 mb-1">
          📈 Trend Wydatków
        </Title>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {selectedItem 
            ? `📈 Trend dla: ${selectedItem}` 
            : '📈 Trend całkowitych wydatków w czasie'
          }
        </p>
      </div>

      {/* Wykres */}
      <div className="h-80 w-full" style={{ paddingLeft: '20px' }}>
        <LineChart
          data={chartData}
          index="period"
          categories={['wydatki']}
          colors={[selectedItem ? ANALYTICS_COLORS[0] : ANALYTICS_COLORS[1]]}
          valueFormatter={valueFormatter}
          className="h-full w-full"
          showAnimation={true}
          showTooltip={true}
          showGridLines={true}
          yAxisWidth={80}
          showLegend={false}
          onValueChange={(value) => {
            if (onPeriodClick && value) {
              // Znajdź oryginalny okres na podstawie sformatowanego
              const originalPeriod = data.find(item => formatPeriod(item.period) === value.period)?.period
              if (originalPeriod) {
                onPeriodClick(originalPeriod)
              }
            }
          }}
        />
      </div>

    </Card>
  )
}
