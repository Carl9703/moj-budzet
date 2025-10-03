import { useState, useEffect } from 'react'
import { authorizedFetch } from '../utils/api'

interface PreviousMonthStatus {
    isClosed: boolean
    monthName: string
    monthStr: string
}

export function usePreviousMonth() {
    const [previousMonthStatus, setPreviousMonthStatus] = useState<PreviousMonthStatus>({
        isClosed: false,
        monthName: '',
        monthStr: ''
    })

    useEffect(() => {
        const checkPreviousMonth = async () => {
            try {
                const now = new Date()
                const currentMonth = now.getMonth()
                const currentYear = now.getFullYear()
                
                // Oblicz poprzedni miesiąc
                const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
                const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear
                const previousMonthStr = `${previousYear}-${String(previousMonth + 1).padStart(2, '0')}`
                const previousMonthStart = new Date(previousYear, previousMonth, 1)
                const previousMonthEnd = new Date(previousYear, previousMonth + 1, 0, 23, 59, 59)
                const monthName = previousMonthStart.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
                
                // Sprawdź czy poprzedni miesiąc był zamknięty
                const checkResponse = await authorizedFetch('/api/transactions', {
                    method: 'GET'
                }).then(res => res.json())
                
                const isClosed = checkResponse.some((t: any) => 
                    t.description?.includes('Zamknięcie miesiąca') && 
                    new Date(t.date) >= previousMonthStart && 
                    new Date(t.date) <= previousMonthEnd
                )
                
                setPreviousMonthStatus({
                    isClosed,
                    monthName,
                    monthStr: previousMonthStr
                })
            } catch {
                // ignore
            }
        }
        
        checkPreviousMonth()
    }, [])

    return { previousMonthStatus, setPreviousMonthStatus }
}
