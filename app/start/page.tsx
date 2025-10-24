'use client'

import { StartView } from '@/components/features/dashboard/StartView'
import { useAuth } from '@/lib/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function StartPage() {
    const { isAuthenticated, isCheckingAuth } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isCheckingAuth && !isAuthenticated) {
            router.push('/auth/signin')
        }
    }, [isAuthenticated, isCheckingAuth, router])

    if (isCheckingAuth) {
        return <LoadingSpinner />
    }

    if (!isAuthenticated) {
        return null
    }

    return (
        <div className="min-h-screen fade-in-up bg-theme-primary">
            <div className="container-wide" style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px' }}>
                <StartView />
            </div>
        </div>
    )
}
