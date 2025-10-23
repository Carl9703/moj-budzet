import { useState, useEffect } from 'react'
import { authorizedFetch } from '../utils/api'

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
        activityCount: number
        group?: string
    }>
    yearlyEnvelopes: Array<{
        id: string
        name: string
        icon: string
        spent: number
        planned: number
        current: number
        group?: string
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
            const response = await authorizedFetch('/api/dashboard')
            const json = await response.json()
            setData(json)
        } catch (error) {
            console.error('Error fetching dashboard:', error)
            setError(error as Error)
            setData(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    return { data, loading, error, refetch: fetchData }
}