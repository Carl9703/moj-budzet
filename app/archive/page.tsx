'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArchivedMonthCard } from '@/components/shared/archive/ArchivedMonthCard'
import { authorizedFetch } from '@/lib/api/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import { Archive, AlertCircle, RefreshCw } from 'lucide-react'

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
            <div className="flex justify-center items-center h-screen">
                <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    const fetchMonthsData = async () => {
        try {
            setLoading(true)
            const response = await authorizedFetch('/api/archive', { cache: 'no-store' })

            if (response.ok) {
                const data = await response.json()
                setMonthsData(data)
            } else {
                const errorText = await response.text()
                setError(`Błąd API: ${response.status}`)
            }
        } catch (error) {
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
            <div className="min-h-screen flex justify-center items-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-xl animate-pulse" />
                    <p className="text-slate-400 text-sm animate-pulse">Ładowanie archiwum...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex justify-center items-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-8 rounded-2xl text-center glass-card max-w-md border-rose-500/30"
                >
                    <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                        <AlertCircle size={32} />
                    </div>
                    <p className="text-xl mb-2 font-bold text-white">Błąd ładowania</p>
                    <p className="text-sm mb-6 text-slate-400">{error}</p>
                    <button
                        onClick={fetchMonthsData}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={16} /> Spróbuj ponownie
                    </button>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pb-20">
            <div className="max-w-[1400px] mx-auto p-4 md:p-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                            <Archive size={32} />
                        </span>
                        <span className="gradient-text">Galeria Osiągnięć</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl">
                        Przejrzyj swoje miesięczne osiągnięcia finansowe. Każda karta to podsumowanie
                        miesiąca z kluczowymi wskaźnikami.
                    </p>
                </motion.div>

                {monthsData.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-16 rounded-3xl text-center glass-card flex flex-col items-center"
                    >
                        <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 text-6xl shadow-inner">
                            📂
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Brak danych archiwalnych
                        </h2>
                        <p className="text-slate-400 max-w-md">
                            Twoje archiwum jest puste. Dane pojawią się tutaj automatycznie po zamknięciu pierwszego miesiąca.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        initial="hidden"
                        animate="show"
                        variants={{
                            hidden: { opacity: 0 },
                            show: {
                                opacity: 1,
                                transition: { staggerChildren: 0.1 }
                            }
                        }}
                    >
                        {monthsData.map((monthData) => (
                            <motion.div
                                key={`${monthData.year}-${monthData.month}`}
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    show: { opacity: 1, y: 0 }
                                }}
                            >
                                <ArchivedMonthCard
                                    monthData={monthData}
                                    onClick={() => handleMonthClick(monthData)}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    )
}
