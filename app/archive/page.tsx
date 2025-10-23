'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArchivedMonthCard } from '@/components/shared/archive/ArchivedMonthCard'
import { authorizedFetch } from '@/lib/utils/api'
import { useAuth } from '@/lib/hooks/useAuth'

interface TransactionData {
    id: string
    type: string
    amount: number
    description: string
    date: string
    category: string
}

interface ArchiveCategory {
    name: string
    icon: string
    amount: number
    percentage: number
    transactions: TransactionData[]
}

interface ArchiveEnvelope {
    name: string
    icon: string
    totalSpent: number
    percentage: number
    categories: ArchiveCategory[]
}

interface MonthData {
    month: string
    year: number
    income: number
    expenses: number
    balance: number
    envelopes: ArchiveEnvelope[]
    transfers: ArchiveCategory[]
    transactions: TransactionData[]
}

export default function ArchivePage() {
    const { isAuthenticated, isCheckingAuth } = useAuth()
    const router = useRouter()
    const [monthsData, setMonthsData] = useState<MonthData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>('')

    useEffect(() => {
        if (isAuthenticated) {
            fetchMonthsData()
        }
    }, [isAuthenticated])
    
    if (isCheckingAuth) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Sprawdzanie autoryzacji...</p>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    const fetchMonthsData = async () => {
        try {
            setLoading(true)
            const response = await authorizedFetch('/api/archive', {
                cache: 'no-store'
            })

            if (response.ok) {
                const data = await response.json()
                console.log('Archive data:', data)
                setMonthsData(data)
            } else {
                const errorText = await response.text()
                setError(`Błąd API: ${response.status} - ${errorText}`)
                console.error('Archive API error:', response.status, errorText)
            }
        } catch (error) {
            console.error('Error fetching archive:', error)
            setError('Błąd połączenia z serwerem')
        } finally {
            setLoading(false)
        }
    }

    const handleMonthClick = (monthData: MonthData) => {
        const monthSlug = monthData.month.toLowerCase()
        router.push(`/archive/${monthData.year}/${monthSlug}`)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-theme-primary">
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh'
                }}>
                    <div className="text-theme-secondary" style={{
                        fontSize: '24px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                        <div>Ładowanie archiwum...</div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-theme-primary">
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh'
                }}>
                    <div className="bg-theme-secondary card" style={{
                        padding: '32px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        color: 'var(--accent-error)',
                        border: '1px solid var(--accent-error)',
                        maxWidth: '400px'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                        <p style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '600' }}>Błąd ładowania</p>
                        <p style={{ fontSize: '14px', marginBottom: '16px' }}>{error}</p>
                        <button
                            onClick={fetchMonthsData}
                            className="nav-button"
                            style={{
                                padding: '8px 16px',
                                backgroundColor: 'var(--accent-error)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            Spróbuj ponownie
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-theme-primary">
            <div style={{ 
                maxWidth: '1400px', 
                margin: '0 auto', 
                padding: '16px'
            }}>
                <h1 className="section-header" style={{ 
                    fontSize: '32px', 
                    fontWeight: 'bold', 
                    color: 'var(--text-primary)', 
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    🏆 Galeria Osiągnięć
                </h1>
                
                <p style={{
                    fontSize: '16px',
                    color: 'var(--text-secondary)',
                    marginBottom: '32px',
                    maxWidth: '600px'
                }}>
                    Przejrzyj swoje miesięczne osiągnięcia finansowe. Każda karta to podsumowanie 
                    miesiąca z kluczowymi wskaźnikami i możliwością głębokiej analizy.
                </p>

                {monthsData.length === 0 ? (
                    <div className="bg-theme-secondary card" style={{
                        padding: '48px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-primary)'
                    }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📂</div>
                        <p style={{ fontSize: '20px', marginBottom: '8px', fontWeight: '600' }}>
                            Brak danych archiwalnych
                        </p>
                        <p style={{ fontSize: '16px' }}>
                            Archiwum będzie dostępne po zamknięciu pierwszego miesiąca
                        </p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '24px'
                    }}>
                        {monthsData.map((monthData) => (
                            <ArchivedMonthCard
                                key={`${monthData.year}-${monthData.month}`}
                                monthData={monthData}
                                onClick={() => handleMonthClick(monthData)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}