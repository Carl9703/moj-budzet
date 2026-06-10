import { useState, useEffect } from 'react'
import { api } from '../api/client'

interface DashboardData {
    balance: number
    totalIncome: number
    totalExpenses: number
    freeFunds?: number
    allocatedToEnvelopes?: number
    emergencyFundAmount?: number
    goalFundsAmount?: number
    monthlyReturns?: number

    monthlyEnvelopes: Array<{
        id: string
        name: string
        icon: string
        spent: number
        planned: number
        current: number
        activityCount: number
        group?: string
        isAccumulating?: boolean
        envelopeType?: string
    }>
    yearlyEnvelopes: Array<{
        id: string
        name: string
        icon: string
        spent: number
        planned: number
        current: number
        group?: string
        isAccumulating?: boolean
        envelopeType?: string
    }>
    transactions: Array<{
        id: string
        type: string
        amount: number
        description: string
        date: string
    }>
}

import { useQuery, useQueryClient } from '@tanstack/react-query'

export function useDashboard() {
    const queryClient = useQueryClient()

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['dashboard'],
        queryFn: async () => {
            return await api.get<DashboardData>('/api/dashboard')
        }
    })

    return { 
        data: data || null, 
        loading: isLoading, 
        error: error as Error | null, 
        refetch,
        invalidate: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
}