// Types moved here to avoid circular dependencies

export interface Transaction {
    id: string
    amount: number
    description: string
    date: string
}

export interface MonthlySummary {
    month: string
    monthNumber: number
    income: number
    expenses: number
    savings: number
    savingsRate: number
}

export interface YearSummary {
    income: number
    expenses: number
    savings: number
    savingsRate: number
    monthlyAverage: {
        income: number
        expenses: number
        savings: number
    }
}

export interface CategoryBreakdown {
    categoryId: string
    categoryName: string
    categoryIcon: string
    totalAmount: number
    percentage: number
    monthlyAverage: number
    transactionCount: number
    yearOverYear?: {
        previousYearAmount: number
        change: number
        changePercent: number
        previousYearMonthlyAverage: number
    }
    subcategories?: {
        envelopeName: string
        envelopeIcon: string
        amount: number
        percentage: number
    }[]
    monthlyTrend: {
        month: string
        amount: number
    }[]
    transactions?: Transaction[]
}

export interface EnvelopeBreakdown {
    envelopeId: string
    envelopeName: string
    envelopeIcon: string
    totalAmount: number
    percentage: number
    monthlyAverage: number
    transactionCount: number
    yearOverYear?: {
        previousYearAmount: number
        change: number
        changePercent: number
        previousYearMonthlyAverage: number
    }
    monthlyTrend: {
        month: string
        amount: number
    }[]
    transactions?: Transaction[]
    categories: {
        categoryId: string
        categoryName: string
        categoryIcon: string
        amount: number
        percentage: number
        monthlyTrend: {
            month: string
            amount: number
        }[]
        monthlyAverage: number
        transactionCount: number
        yearOverYear?: {
            previousYearAmount: number
            change: number
            changePercent: number
            previousYearMonthlyAverage: number
        }
        transactions?: Transaction[]
    }[]
}

export interface GroupBreakdown {
    groupName: string
    totalAmount: number
    percentage: number
    yearOverYear?: {
        previousYearAmount: number
        change: number
        changePercent: number
        previousYearMonthlyAverage: number
    }
    envelopes: EnvelopeBreakdown[]
}

export interface AnnualReportData {
    year: number
    previousYear: number
    summary: YearSummary
    previousYearSummary?: YearSummary
    monthlyData: MonthlySummary[]
    categoryBreakdown: CategoryBreakdown[]
    groupsBreakdown: GroupBreakdown[]
    incomeBreakdown: {
        categoryId: string
        categoryName: string
        categoryIcon: string
        amount: number
        percentage: number
    }[]
    totalTransactions: number
}

export async function fetchAnnualReport(year: number): Promise<AnnualReportData> {
    const token = localStorage.getItem('authToken')

    const response = await fetch(`/api/annual-report?year=${year}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })

    if (!response.ok) {
        throw new Error('Failed to fetch annual report')
    }

    return response.json()
}
