import { api } from './client'

export interface Transaction {
    id: string
    type: 'income' | 'expense' | 'transfer'
    amount: number
    description: string | null
    date: string
    category?: string
    envelopeId?: string
    envelope?: { id: string; name: string; icon: string }
}

export interface TransactionFilters {
    startDate?: string
    endDate?: string
    type?: string
    envelopeId?: string
    search?: string
}

export interface TransactionsResponse {
    success: boolean
    transactions: Transaction[]
    pagination?: {
        page: number
        limit: number
        total: number
    }
}

export const transactionsApi = {
    getAll: (filters?: TransactionFilters) =>
        api.get<TransactionsResponse>('/api/transactions', filters as Record<string, string>),

    getById: (id: string) =>
        api.get<{ success: boolean; transaction: Transaction }>(`/api/transactions/${id}`),

    create: (data: Partial<Transaction>) =>
        api.post<{ success: boolean; transaction: Transaction }>('/api/transactions', data),

    update: (id: string, data: Partial<Transaction>) =>
        api.put<{ success: boolean; transaction: Transaction }>(`/api/transactions/${id}`, data),

    delete: (id: string) =>
        api.delete<{ success: boolean }>(`/api/transactions/${id}`),
}
