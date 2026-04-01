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

        // Always parse as local time to avoid off-by-one-day bugs near midnight.
        // new Date("YYYY-MM-DD") treats the string as UTC, so we parse manually.
        // For ISO strings (with T) we extract only the date part.
        const parseDate = (s: string | null) => {
            if (!s) return null
            const datePart = s.includes('T') ? s.split('T')[0] : s
            const [y, m, d] = datePart.split('-').map(Number)
            return new Date(y, m - 1, d)
        }

        return {
            from: parseDate(fromParam) || new Date(now.getFullYear(), now.getMonth(), 1),
            to: parseDate(toParam) || now
        }
    })

    const [compareMode, setCompareMode] = useState(() => {
        return searchParams.get('compare') === 'true'
    })

    const [period, setPeriod] = useState(() => {
        return searchParams.get('period') || 'currentMonth'
    })

    // Update URL when filters change
    const updateUrl = useCallback((newRange: DateRange, newCompare: boolean, newPeriod: string) => {
        const params = new URLSearchParams(searchParams.toString())

        const formatDate = (date: Date | undefined) => {
            if (!date) return null
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        }

        const fromStr = formatDate(newRange.from)
        if (fromStr) params.set('from', fromStr)
        else params.delete('from')

        const toStr = formatDate(newRange.to)
        if (toStr) params.set('to', toStr)
        else params.delete('to')

        if (newCompare) params.set('compare', 'true')
        else params.delete('compare')

        if (newPeriod) params.set('period', newPeriod)
        else params.delete('period')

        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }, [pathname, router, searchParams])

    const handleDateRangeChange = (newRange: DateRange, newPeriod?: string) => {
        const updatedPeriod = newPeriod || 'custom'
        setDateRange(newRange)
        setPeriod(updatedPeriod)
        updateUrl(newRange, compareMode, updatedPeriod)
    }

    const handleCompareModeChange = (enabled: boolean) => {
        setCompareMode(enabled)
        updateUrl(dateRange, enabled, period)
    }

    return {
        dateRange,
        compareMode,
        period,
        setDateRange: handleDateRangeChange,
        setCompareMode: handleCompareModeChange
    }
}
