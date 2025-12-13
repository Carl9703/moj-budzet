import { useState, useEffect } from 'react'
import { api } from '../api/client'

interface DashboardData {
    balance: number
    totalIncome: number
    totalExpenses: number
    allocatedToEnvelopes?: number
    emergencyFundAmount?: number
    monthlySurplus?: number
    monthlyReturns?: number
    monthlyTransfersToEnvelopes?: Array<{ name: string; icon: string; amount: number }>
    isMonthClosed?: boolean
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

export function useDashboard() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchData = async () => {
        try {
            setError(null)
            const json = await api.get<DashboardData>('/api/dashboard')
            setData(json)
        } catch (error) {
            setError(error as Error)
            setData(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        const handleRefresh = () => fetchData()
        window.addEventListener('dashboardRefresh', handleRefresh)
        return () => window.removeEventListener('dashboardRefresh', handleRefresh)
    }, [])

    return { data, loading, error, refetch: fetchData }
}