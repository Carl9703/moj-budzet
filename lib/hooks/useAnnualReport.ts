import { useQuery } from '@tanstack/react-query'
import { fetchAnnualReport, AnnualReportData } from '@/lib/api/annual-report'

export function useAnnualReport(year: number) {
    return useQuery<AnnualReportData>({
        queryKey: ['annual-report', year],
        queryFn: () => fetchAnnualReport(year),
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2
    })
}
