import { api } from '../api/client'

// Funkcja do wywołania globalnego odświeżenia salda w sidebar
const triggerDashboardRefresh = () => {
    window.dispatchEvent(new CustomEvent('dashboardRefresh'))
}

interface IncomeData {
    amount: number
    description?: string
    includeInStats?: boolean
    type?: string
    date?: string
    toGifts?: number
    toInsurance?: number
    toFreedom?: number
}

interface BonusData {
    amount: number
    toGifts: number
    toInsurance: number
    toHolidays: number
    toFreedom: number
}

interface ExpenseData {
    amount: number
    description: string
    envelopeId: string | null
    category: string
    date: string
    includeInStats?: boolean
}

export const createIncomeHandler = (refetch: () => void, showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void) => {
    return async (incomeData: IncomeData) => {
        try {
            const result = await api.post<{ message?: string }>('/api/income', {
                type: incomeData.type || 'salary',
                date: incomeData.date || new Date().toISOString().split('T')[0],
                ...incomeData
            })
            refetch()
            triggerDashboardRefresh()
            showToast(result.message || 'Przychód zapisany pomyślnie!', 'success')
        } catch {
            showToast('Błąd podczas zapisywania przychodu', 'error')
        }
    }
}

export const createBonusHandler = (refetch: () => void, showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void) => {
    return async (bonusData: BonusData) => {
        try {
            await api.post('/api/income', { type: 'bonus', ...bonusData })
            refetch()
            triggerDashboardRefresh()
            showToast('Premia została rozdzielona na koperty roczne!', 'success')
        } catch {
            showToast('Błąd podczas zapisywania premii', 'error')
        }
    }
}

export const createExpenseHandler = (refetch: () => void, showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void) => {
    return async (expenseData: ExpenseData) => {
        try {
            await api.post('/api/transactions', {
                type: 'expense',
                amount: expenseData.amount,
                description: expenseData.description,
                envelopeId: expenseData.envelopeId,
                category: expenseData.category,
                date: expenseData.date,
                includeInStats: expenseData.includeInStats ?? true
            })
            refetch()
            triggerDashboardRefresh()
            showToast('Wydatek zapisany pomyślnie!', 'success')
        } catch {
            showToast('Błąd podczas zapisywania wydatku', 'error')
        }
    }
}

export const createTransferHandler = (refetch: () => void, showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void) => {
    return async (transferData: {
        fromEnvelopeId: string
        toEnvelopeId: string
        amount: number
        description: string
        date: string
        toCategory?: string
    }) => {
        try {
            await api.post('/api/transfer', transferData)
            refetch()
            triggerDashboardRefresh()
            showToast('Transfer wykonany pomyślnie!', 'success')
        } catch {
            showToast('Błąd podczas wykonywania transferu', 'error')
        }
    }
}
