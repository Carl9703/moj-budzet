import { authorizedFetch } from '../utils/api'

interface IncomeData {
    amount: number
    toSavings: number
    toVacation: number
    toInvestment: number
    toJoint: number
    forExpenses: number
    description?: string
    includeInStats?: boolean
    type?: string
    date?: string
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
            const response = await authorizedFetch('/api/income', {
                method: 'POST',
                body: JSON.stringify({
                    type: incomeData.type || 'salary',
                    date: incomeData.date || new Date().toISOString().split('T')[0],
                    ...incomeData
                })
            })

            if (response.ok) {
                refetch()
                const result = await response.json()
                showToast(result.message || 'Przychód zapisany pomyślnie!', 'success')
            } else {
                showToast('Błąd podczas zapisywania przychodu', 'error')
            }
        } catch {
            showToast('Błąd podczas zapisywania przychodu', 'error')
        }
    }
}

export const createBonusHandler = (refetch: () => void, showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void) => {
    return async (bonusData: BonusData) => {
        try {
            const response = await authorizedFetch('/api/income', {
                method: 'POST',
                body: JSON.stringify({
                    type: 'bonus',
                    ...bonusData
                })
            })

            if (response.ok) {
                refetch()
                showToast('Premia została rozdzielona na koperty roczne!', 'success')
            } else {
                showToast('Błąd podczas zapisywania premii', 'error')
            }
        } catch {
            showToast('Błąd podczas zapisywania premii', 'error')
        }
    }
}

export const createExpenseHandler = (refetch: () => void, showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void) => {
    return async (expenseData: ExpenseData) => {
        try {
            const response = await authorizedFetch('/api/transactions', {
                method: 'POST',
                body: JSON.stringify({
                    type: 'expense',
                    amount: expenseData.amount,
                    description: expenseData.description,
                    envelopeId: expenseData.envelopeId,
                    category: expenseData.category,
                    date: expenseData.date,
                    includeInStats: expenseData.includeInStats ?? true
                })
            })

            if (response.ok) {
                refetch()
                showToast('Wydatek zapisany pomyślnie!', 'success')
            } else {
                showToast('Błąd podczas zapisywania wydatku', 'error')
            }
        } catch {
            showToast('Błąd podczas zapisywania wydatku', 'error')
        }
    }
}
