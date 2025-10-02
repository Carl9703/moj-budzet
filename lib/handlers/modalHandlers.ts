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
    envelopeId: string
    category: string
    date: string
    includeInStats?: boolean
}

export const createIncomeHandler = (refetch: () => void) => {
    return async (incomeData: IncomeData) => {
        try {
            const response = await fetch('/api/income', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: incomeData.type || 'salary',
                    date: incomeData.date || new Date().toISOString().split('T')[0],
                    ...incomeData
                })
            })

            if (response.ok) {
                refetch()
                const result = await response.json()
                alert(result.message || 'Zapisano!')
            } else {
                alert('Błąd podczas zapisywania')
            }
        } catch {
            alert('Błąd podczas zapisywania')
        }
    }
}

export const createBonusHandler = (refetch: () => void) => {
    return async (bonusData: BonusData) => {
        try {
            const response = await fetch('/api/income', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'bonus',
                    ...bonusData
                })
            })

            if (response.ok) {
                refetch()
                alert('Premia została rozdzielona na koperty roczne!')
            } else {
                alert('Błąd podczas zapisywania')
            }
        } catch {
            alert('Błąd podczas zapisywania')
        }
    }
}

export const createExpenseHandler = (refetch: () => void) => {
    return async (expenseData: ExpenseData) => {
        try {
            await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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

            refetch()
            alert('Wydatek zapisany!')
        } catch {
            alert('Błąd podczas zapisywania')
        }
    }
}
