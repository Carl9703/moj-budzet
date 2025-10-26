'use client'
import { useState } from 'react'
import { DonutChart, Card, Title, LineChart } from '@tremor/react'
import { formatMoneyWithSeparators } from '@/lib/utils/money'
import { ANALYTICS_COLORS } from '@/lib/constants/colors'

interface IncomeSource {
  source: string
  total: number
  count: number
  avgAmount: number
  percentage: number
  transactions: {
    id: string
    amount: number
    description: string
    date: string
  }[]
}

interface IncomeTrendData {
  period: string
  value: number
}

interface IncomeAnalyticsData {
  sources: IncomeSource[]
  trends: IncomeTrendData[]
  totalIncome: number
  period: string
  summary: {
    totalSources: number
    totalTransactions: number
    avgTransactionAmount: number
  }
}

interface IncomeAnalysisProps {
  data: IncomeAnalyticsData | null
  loading: boolean
}

export function IncomeAnalysis({ data, loading }: IncomeAnalysisProps) {
  const [selectedSource, setSelectedSource] = useState<string | null>(null)

  // Przygotowanie danych dla wykresu kołowego
  const chartData = data?.sources.map((source, index) => ({
    name: source.source,
    value: source.total,
    color: ANALYTICS_COLORS[index % ANALYTICS_COLORS.length]
  })) || []

  // Przygotowanie danych dla wykresu trendów
  const trendsData = data?.trends || []

  const handleSegmentClick = (segmentName: string) => {
    if (selectedSource === segmentName) {
      setSelectedSource(null)
    } else {
      setSelectedSource(segmentName)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded mb-4"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-600 rounded"></div>
            </div>
          </Card>
          <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded mb-4"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-600 rounded"></div>
            </div>
          </Card>
        </div>
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-600 rounded"></div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Brak danych przychodów</div>
          <div className="text-sm">Nie znaleziono transakcji przychodów w wybranym okresie</div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Wykresy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wykres kołowy źródeł przychodów */}
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <Title className="mb-4 text-gray-900 dark:text-white">Źródła Przychodów</Title>
          <div className="h-64">
            <DonutChart
              data={chartData}
              category="value"
              index="name"
              colors={chartData.map(item => item.color)}
              onValueChange={(value) => {
                if (value) {
                  handleSegmentClick(value.name)
                }
              }}
              className="h-full"
            />
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Całkowite przychody: {formatMoneyWithSeparators(data.totalIncome)}
          </div>
        </Card>

        {/* Wykres trendów przychodów */}
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <Title className="mb-4 text-gray-900 dark:text-white">Trend Przychodów</Title>
          <div className="h-64">
            <LineChart
              data={trendsData}
              index="period"
              categories={['value']}
              colors={['blue']}
              className="h-full"
            />
          </div>
        </Card>
      </div>

      {/* Lista źródeł przychodów */}
      <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <Title className="mb-4 text-gray-900 dark:text-white">Szczegółowa Analiza Źródeł</Title>
        <div className="space-y-4">
          {data.sources.map((source, index) => (
            <div
              key={source.source}
              className={`p-4 rounded-lg border transition-all cursor-pointer bg-white dark:bg-gray-800 ${
                selectedSource === source.source
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
              onClick={() => handleSegmentClick(source.source)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ANALYTICS_COLORS[index % ANALYTICS_COLORS.length] }}></div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{source.source}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {source.count} transakcji • Średnio {formatMoneyWithSeparators(source.avgAmount)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatMoneyWithSeparators(source.total)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {source.percentage}% całości
                  </div>
                </div>
              </div>

              {/* Rozwijane szczegóły transakcji */}
              {selectedSource === source.source && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Transakcje:</div>
                  <div className="space-y-2">
                    {source.transactions.map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center py-2 px-3 bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500 shadow-sm">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{transaction.description}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{transaction.date}</div>
                        </div>
                        <div className="text-sm font-medium text-green-600 dark:text-green-400">
                          +{formatMoneyWithSeparators(transaction.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Podsumowanie */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.summary.totalSources}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Źródeł przychodów</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.summary.totalTransactions}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Transakcji</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatMoneyWithSeparators(data.summary.avgTransactionAmount)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Średnia transakcja</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
