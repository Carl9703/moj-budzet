import { api } from './client'

export interface DashboardResponse {
    success: boolean
    balance: number
    mainBalance: number
    availableFunds: number
    monthlyIncome: number
    monthlyExpenses: number
    savingsRate: number
    daysRemaining: number
    dailyBudget: number
    monthProgress: number
    totalDays: number
    monthlyEnvelopes: Envelope[]
    yearlyEnvelopes: Envelope[]
}

export interface Envelope {
    id: string
    name: string
    icon: string
    spent: number
    planned: number
    current: number
    group?: string
}

export interface PendingAction {
    id: string
    name: string
    amount: number
    type: 'expense' | 'transfer'
    envelope: { id: string; name: string; icon: string } | null
    fromEnvelope: { id: string; name: string; icon: string } | null
    toEnvelope: { id: string; name: string; icon: string } | null
    category: string
    dayOfMonth: number
}

export const dashboardApi = {
    get: () => api.get<DashboardResponse>('/api/dashboard'),

    getActions: () => api.get<{ actions: PendingAction[] }>('/api/dashboard/actions'),

    approveAction: (id: string) =>
        api.post<{ success: boolean; message: string }>(`/api/dashboard/actions/${id}/approve`),

    rejectAction: (id: string) =>
        api.post<{ success: boolean; message: string }>(`/api/dashboard/actions/${id}/reject`),
}

export const fetchDashboardData = dashboardApi.get
