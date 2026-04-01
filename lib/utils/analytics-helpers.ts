import { DateRange } from '@/lib/types'

// Helper to map API period (YYYY-MM) to trend format { month, year, amount }
export const formatTrendData = (trendArray: any[]) => {
    const monthNames = [
        'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
        'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ]
    if (!Array.isArray(trendArray)) return []

    return trendArray.map(t => {
        const [yearStr, monthStr] = t.period.split('-')
        const year = parseInt(yearStr)
        const monthIndex = parseInt(monthStr) - 1
        const monthName = (!isNaN(monthIndex) && monthIndex >= 0 && monthIndex < 12) ? monthNames[monthIndex] : 'Mies'
        return {
            month: monthName,
            year,
            amount: t.value
        }
    })
}

// Helper to calculate trend for a specific source based on its transactions
export const calculateSourceTrend = (transactions: any[], globalTrends: any[]) => {
    if (!globalTrends || !Array.isArray(globalTrends)) return []
    if (!transactions || !Array.isArray(transactions)) return []

    const monthlyMap = new Map<string, number>()

    // Initialize map with 0 for all months present in global trends to keep x-axis consistent
    globalTrends.forEach(t => {
        if (t && t.period) monthlyMap.set(t.period, 0)
    })

    transactions.forEach(trx => {
        if (!trx || !trx.date) return

        // Robust date handling: support both Date objects and strings
        let period = ''
        if (trx.date instanceof Date) {
            period = trx.date.toISOString().substring(0, 7) // YYYY-MM
        } else {
            period = String(trx.date).substring(0, 7) // YYYY-MM
        }

        // Allow adding new keys if they don't exist in global trends
        const currentVal = monthlyMap.get(period) || 0
        const amountVal = Number(trx.amount) || 0
        monthlyMap.set(period, currentVal + amountVal)
    })

    // Convert map back to array sorted by period
    const sourceTrendArray = Array.from(monthlyMap.entries())
        .map(([period, value]) => ({
            period,
            value
        }))
        .sort((a, b) => a.period.localeCompare(b.period))

    return formatTrendData(sourceTrendArray)
}

// Helper to calculate previous date range (Year over Year)
export const getPreviousDateRange = (range: DateRange): DateRange => {
    if (!range.from || !range.to) return { from: undefined, to: undefined }

    const prevFrom = new Date(range.from)
    prevFrom.setFullYear(prevFrom.getFullYear() - 1)

    const prevTo = new Date(range.to)
    prevTo.setFullYear(prevTo.getFullYear() - 1)

    return { from: prevFrom, to: prevTo }
}
