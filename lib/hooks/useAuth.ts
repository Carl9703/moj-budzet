// lib/hooks/useAuth.ts - Hook do sprawdzania autoryzacji
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function useAuth() {
    const router = useRouter()
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isCheckingAuth, setIsCheckingAuth] = useState(true)

    useEffect(() => {
        // Sprawdź czy jesteśmy w przeglądarce (nie SSR)
        if (typeof window === 'undefined') return

        const token = localStorage.getItem('authToken')
        if (!token) {
            router.push('/auth/signin')
        } else {
            setIsAuthenticated(true)
        }
        setIsCheckingAuth(false)
    }, [router])

    return { isAuthenticated, isCheckingAuth }
}

