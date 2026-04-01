import { useQuery } from '@tanstack/react-query'
import type { DateRange } from '@/lib/types'
import { fetchIncomeAnalytics } from '@/lib/api/analytics'

export function useIncomeAnalytics(dateRange: DateRange) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['income-analytics', dateRange.from?.toISOString(), dateRange.to?.toISOString()],
    queryFn: () => fetchIncomeAnalytics(dateRange),
    enabled: !!dateRange.from && !!dateRange.to
  })

  return {
    data,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Błąd pobierania danych przychodów') : null,
    refetch
  }
}
