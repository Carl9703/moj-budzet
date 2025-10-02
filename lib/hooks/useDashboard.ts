import { useState, useEffect } from 'react'
import { authenticatedRequest } from '@/lib/utils/api'

interface DashboardData {
    balance: number
    totalIncome: number
    totalExpenses: number
    monthlyEnvelopes: Array<{
        id: string
        name: string
        icon: string
        spent: number
        planned: number
        current: number
    }>
    yearlyEnvelopes: Array<{
        id: string
        name: string
        icon: string
        spent: number
        planned: number
        current: number
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

    const fetchData = async () => {
        try {
            const data = await authenticatedRequest<DashboardData>('/api/dashboard')
            setData(data)
        } catch (error) {
            console.error('Error fetching dashboard:', error)
            setData(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    return { data, loading, refetch: fetchData }
}