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
    bonusDistribution?: { envelopeId: string; amount: number }[]
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
    return async (incomeData: IncomeData): Promise<boolean> => {
        try {
            const result = await api.post<{ message?: string }>('/api/income', {
                type: incomeData.type || 'salary',
                date: incomeData.date || new Date().toISOString().split('T')[0],
                ...incomeData
            })
            refetch()
            triggerDashboardRefresh()
            showToast(result.message || 'Przychód zapisany pomyślnie!', 'success')
            return true
        } catch {
            showToast('Błąd podczas zapisywania przychodu', 'error')
            return false
        }
    }
}

export const createExpenseHandler = (refetch: () => void, showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void) => {
    return async (expenseData: ExpenseData): Promise<boolean> => {
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
            return true
        } catch {
            showToast('Błąd podczas zapisywania wydatku', 'error')
            return false
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
    }): Promise<boolean> => {
        try {
            await api.post('/api/transfer', transferData)
            refetch()
            triggerDashboardRefresh()
            showToast('Transfer wykonany pomyślnie!', 'success')
            return true
        } catch {
            showToast('Błąd podczas wykonywania transferu', 'error')
            return false
        }
    }
}
