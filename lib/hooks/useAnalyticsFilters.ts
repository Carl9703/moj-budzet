import { useState, useCallback, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { DateRange } from '@/lib/types'

export function useAnalyticsFilters() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Initialize state from URL params
    const [dateRange, setDateRange] = useState<DateRange>(() => {
        const fromParam = searchParams.get('from')
        const toParam = searchParams.get('to')
        const now = new Date()

        return {
            from: fromParam ? new Date(fromParam) : new Date(now.getFullYear(), now.getMonth(), 1),
            to: toParam ? new Date(toParam) : now
        }
    })

    const [compareMode, setCompareMode] = useState(() => {
        return searchParams.get('compare') === 'true'
    })

    // Update URL when filters change
    const updateUrl = useCallback((newRange: DateRange, newCompare: boolean) => {
        const params = new URLSearchParams(searchParams.toString())

        if (newRange.from) params.set('from', newRange.from.toISOString())
        else params.delete('from')

        if (newRange.to) params.set('to', newRange.to.toISOString())
        else params.delete('to')

        if (newCompare) params.set('compare', 'true')
        else params.delete('compare')

        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }, [pathname, router, searchParams])

    const handleDateRangeChange = (newRange: DateRange) => {
        setDateRange(newRange)
        updateUrl(newRange, compareMode)
    }

    const handleCompareModeChange = (enabled: boolean) => {
        setCompareMode(enabled)
        updateUrl(dateRange, enabled)
    }

    return {
        dateRange,
        compareMode,
        setDateRange: handleDateRangeChange,
        setCompareMode: handleCompareModeChange
    }
}
