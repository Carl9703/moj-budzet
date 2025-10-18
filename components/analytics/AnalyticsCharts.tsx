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
}

export function AnalyticsCharts({ data, total }: Props) {
  if (!data || data.length === 0) {
    return (
      <Card className="text-center">
        <Title>Podsumowanie wydatków</Title>
        <p className="mt-4 text-gray-500">Brak danych do wyświetlenia wykresu.</p>
      </Card>
    )
  }

  return (
    <Card>
      <Title>Podsumowanie wydatków: {formatMoneyWithSeparators(total)}</Title>
      <DonutChart
        className="mt-6"
        data={data}
        category="value"
        index="name"
        valueFormatter={(number: number) => formatMoneyWithSeparators(number)}
        colors={ANALYTICS_COLORS} // Używamy naszej palety
      />
    </Card>
  )
}
