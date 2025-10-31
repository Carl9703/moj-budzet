import { useState, useEffect } from 'react'
import { authorizedFetch } from '../utils/api'

interface PreviousMonthStatus {
    isClosed: boolean
    monthName: string
    monthStr: string
}

interface CurrentMonthStatus {
    isClosed: boolean
    monthName: string
}

export function usePreviousMonth() {
    const [previousMonthStatus, setPreviousMonthStatus] = useState<PreviousMonthStatus>({
        isClosed: false,
        monthName: '',
        monthStr: ''
    })
    const [currentMonthStatus, setCurrentMonthStatus] = useState<CurrentMonthStatus>({
        isClosed: false,
        monthName: ''
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
                // Szukaj transakcji zamknięcia zarówno w poprzednim miesiącu, jak i w pierwszych dniach bieżącego miesiąca
                // (bo można zamykać miesiąc w pierwszych 3 dniach nowego miesiąca)
                const checkResponse = await authorizedFetch('/api/transactions', {
                    method: 'GET'
                }).then(res => res.json())
                
                const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
                const firstDaysOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 3, 23, 59, 59)
                
                const isClosed = checkResponse.some((t: any) => {
                    if (!t.description?.includes('Zamknięcie miesiąca')) {
                        return false
                    }
                    
                    const transactionDate = new Date(t.date)
                    
                    // Sprawdź czy transakcja jest w poprzednim miesiącu
                    const inPreviousMonth = transactionDate >= previousMonthStart && transactionDate <= previousMonthEnd
                    
                    // Sprawdź czy transakcja jest w pierwszych 3 dniach bieżącego miesiąca
                    // (bo można zamykać miesiąc w pierwszych 3 dniach - wtedy zamknięcie dotyczy poprzedniego miesiąca)
                    const inFirstDaysOfCurrent = transactionDate >= currentMonthStart && transactionDate <= firstDaysOfCurrentMonth
                    
                    return inPreviousMonth || inFirstDaysOfCurrent
                })
                
                setPreviousMonthStatus({
                    isClosed,
                    monthName,
                    monthStr: previousMonthStr
                })

                // Sprawdź czy bieżący miesiąc jest zamknięty
                const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
                const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
                const currentMonthName = currentMonthStart.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
                
                const currentIsClosed = checkResponse.some((t: any) => {
                    if (!t.description?.includes('Zamknięcie miesiąca')) {
                        return false
                    }
                    
                    const transactionDate = new Date(t.date)
                    
                    // Sprawdź czy transakcja jest w bieżącym miesiącu
                    return transactionDate >= currentMonthStart && transactionDate <= currentMonthEnd
                })
                
                setCurrentMonthStatus({
                    isClosed: currentIsClosed,
                    monthName: currentMonthName
                })
            } catch {
                // ignore
            }
        }
        
        checkPreviousMonth()
    }, [])

    return { previousMonthStatus, currentMonthStatus, setPreviousMonthStatus }
}
