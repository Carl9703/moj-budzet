// NOWY PLIK: components/analytics/AnalyticsCharts.tsx

'use client' // <-- TO JEST KLUCZ DO ROZWIĄZANIA PROBLEMU

import { DonutChart, Card, Title } from '@tremor/react'
import { formatMoneyWithSeparators } from '@/lib/utils/money'
import { ANALYTICS_COLORS } from '@/lib/constants/colors' // Upewnij się, że ten import jest poprawny

// Oczekujemy na dane w formacie { name: string, value: number }
interface ChartData {
  name: string
  value: number
}

interface Props {
  data: ChartData[] // Przekazujemy dane jako props
  total: number
  onSegmentClick?: (segmentName: string, segmentValue: number) => void
}

export function AnalyticsCharts({ data, total, onSegmentClick }: Props) {
  if (!data || data.length === 0) {
    return (
      <Card className="text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <Title className="text-gray-900 dark:text-white">Podsumowanie wydatków</Title>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Brak danych do wyświetlenia wykresu.</p>
      </Card>
    )
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-8">
      {/* Nagłówek z lepszym designem */}
      <div className="mb-8">
        <Title className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          📊 Podsumowanie Wydatków
        </Title>
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
          {formatMoneyWithSeparators(total)}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Kliknij na segment, aby zobaczyć szczegóły
        </p>
      </div>

      {/* Wykres kołowy - rozsądny rozmiar */}
      <div className="flex justify-center">
        <DonutChart
          className="h-80 w-80"
          data={data}
          category="value"
          index="name"
          valueFormatter={(number: number) => formatMoneyWithSeparators(number)}
          colors={ANALYTICS_COLORS}
          showAnimation={true}
          showTooltip={true}
          showLabel={true}
          onValueChange={(value) => {
            if (value && onSegmentClick) {
              onSegmentClick(value.name, value.value)
            }
          }}
        />
      </div>

      {/* Legenda z pełnymi kwotami */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.map((item, index) => (
          <div 
            key={item.name}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
            onClick={() => onSegmentClick?.(item.name, item.value)}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: ANALYTICS_COLORS[index % ANALYTICS_COLORS.length] }}
              />
              <span className="font-medium text-gray-900 dark:text-white text-sm">
                {item.name}
              </span>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-900 dark:text-white text-sm">
                {formatMoneyWithSeparators(item.value)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {((item.value / total) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
