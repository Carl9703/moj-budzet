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
    </Card>
  )
}
