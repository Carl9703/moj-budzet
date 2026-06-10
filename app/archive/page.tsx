'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { authorizedFetch } from '@/lib/api/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import { Archive, AlertCircle, RefreshCw, ChevronDown, ChevronUp, ChevronRight, Calendar, TrendingUp, TrendingDown } from 'lucide-react'

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

interface YearGroup {
    year: number
    months: MonthData[]
    totalIncome: number
    totalExpenses: number
    totalBalance: number
}

// Month order for sorting
const MONTH_ORDER = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
    'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień']

const normalize = (str: string) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export default function ArchivePage() {
    const { isAuthenticated, isCheckingAuth } = useAuth()
    const router = useRouter()
    const [monthsData, setMonthsData] = useState<MonthData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>('')
    const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set())

    // Group months by year
    const yearGroups = useMemo<YearGroup[]>(() => {
        const groups: Record<number, MonthData[]> = {}
        monthsData.forEach(month => {
            if (!groups[month.year]) {
                groups[month.year] = []
            }
            groups[month.year].push(month)
        })

        return Object.entries(groups)
            .map(([year, months]) => ({
                year: parseInt(year),
                months: months.sort((a, b) => {
                    const aIdx = MONTH_ORDER.findIndex(m => normalize(m) === normalize(a.month))
                    const bIdx = MONTH_ORDER.findIndex(m => normalize(m) === normalize(b.month))
                    return bIdx - aIdx // Descending (newest month first)
                }),
                totalIncome: months.reduce((sum, m) => sum + m.income, 0),
                totalExpenses: months.reduce((sum, m) => sum + m.expenses, 0),
                totalBalance: months.reduce((sum, m) => sum + m.balance, 0)
            }))
            .sort((a, b) => b.year - a.year) // Descending (newest year first)
    }, [monthsData])

    // Auto-expand the most recent year on load
    useEffect(() => {
        if (yearGroups.length > 0 && expandedYears.size === 0) {
            setExpandedYears(new Set([yearGroups[0].year]))
        }
    }, [yearGroups])

    useEffect(() => {
        if (isAuthenticated) {
            fetchMonthsData()
        }
    }, [isAuthenticated])

    if (isCheckingAuth) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
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
                setError(`Błąd API: ${response.status}`)
            }
        } catch (error) {
            setError('Błąd połączenia z serwerem')
        } finally {
            setLoading(false)
        }
    }

    const toggleYear = (year: number) => {
        setExpandedYears(prev => {
            const next = new Set(prev)
            if (next.has(year)) {
                next.delete(year)
            } else {
                next.add(year)
            }
            return next
        })
    }

    const handleMonthClick = (monthData: MonthData) => {
        const clickedMonthNorm = normalize(monthData.month)
        const monthIndex = MONTH_ORDER.findIndex(m => normalize(m) === clickedMonthNorm)

        if (monthIndex === -1) {
            console.error('Could not parse month:', monthData.month)
            return
        }

        const pad = (n: number) => n.toString().padStart(2, '0')
        const fromDateStr = `${monthData.year}-${pad(monthIndex + 1)}-01`
        const lastDay = new Date(monthData.year, monthIndex + 1, 0).getDate()
        const toDateStr = `${monthData.year}-${pad(monthIndex + 1)}-${pad(lastDay)}`

        const params = new URLSearchParams({
            tab: 'current',
            period: 'custom',
            from: fromDateStr,
            to: toDateStr
        })

        router.push(`/analytics?${params.toString()}`)
    }

    // Format money with tabular figures alignment
    const formatMoney = (amount: number, showSign = false) => {
        const formatted = new Intl.NumberFormat('pl-PL', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Math.abs(amount))

        if (showSign) {
            return amount >= 0 ? `+${formatted}` : `-${formatted}`
        }
        return formatted
    }

    // Calculate savings rate capped between -100 and 100
    const getSavingsRate = (income: number, balance: number) => {
        if (income <= 0) return 0
        const raw = (balance / income) * 100
        return Math.max(-100, Math.min(100, Math.round(raw)))
    }

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-800 rounded-xl animate-pulse" />
                    <p className="text-zinc-400 text-sm animate-pulse">Ładowanie archiwum...</p>
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
                    <p className="text-sm mb-6 text-zinc-400">{error}</p>
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
        <div className="min-h-screen bg-zinc-950 flex flex-col">
            <div className="w-full px-4 sm:px-6 lg:px-8 pb-28 md:pb-4 pt-0 flex flex-col relative z-10 max-w-[1800px] mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-8 mb-6"
                >
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 tracking-tight">
                                📂 Archiwum Budżetu
                            </h1>
                            <p className="text-xs text-zinc-500 font-medium tracking-wide mt-1">
                                Kompaktowy przegląd historycznych danych finansowych
                            </p>
                        </div>
                    </div>
                </motion.div>

                {monthsData.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-16 rounded-2xl text-center bg-zinc-900/50 border border-zinc-700/50 flex flex-col items-center"
                    >
                        <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4 text-5xl">
                            📂
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">
                            Brak danych archiwalnych
                        </h2>
                        <p className="text-zinc-400 text-sm max-w-md">
                            Twoje archiwum jest puste. Dane pojawią się tutaj automatycznie, gdy tylko dodasz pierwsze transakcje i minie pierwszy miesiąc.
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {yearGroups.map((yearGroup, yearIndex) => {
                            const isExpanded = expandedYears.has(yearGroup.year)
                            const yearSavingsRate = getSavingsRate(yearGroup.totalIncome, yearGroup.totalBalance)

                            return (
                                <motion.div
                                    key={yearGroup.year}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: yearIndex * 0.05 }}
                                    className="rounded-xl border border-zinc-700/50 bg-zinc-900/30 overflow-hidden"
                                >
                                    {/* Year Header - Compact */}
                                    <button
                                        onClick={() => toggleYear(yearGroup.year)}
                                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Calendar size={18} className="text-amber-400" />
                                            <span className="text-xl font-bold text-white">{yearGroup.year}</span>
                                            <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full">
                                                {yearGroup.months.length} mies.
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {/* Year Summary - Desktop only */}
                                            <div className="hidden md:flex items-center gap-6 text-sm font-mono">
                                                <div className="text-right">
                                                    <span className="text-emerald-400">{formatMoney(yearGroup.totalIncome)} zł</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-zinc-400">{formatMoney(yearGroup.totalExpenses)} zł</span>
                                                </div>
                                                <div className="text-right min-w-[100px]">
                                                    <span className={`font-bold ${yearGroup.totalBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {formatMoney(yearGroup.totalBalance, true)} zł
                                                    </span>
                                                </div>
                                                <div className="w-20 flex items-center gap-2">
                                                    {yearSavingsRate >= 0 ? (
                                                        <>
                                                            <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${yearSavingsRate >= 30 ? 'bg-emerald-400' : 'bg-emerald-500/60'}`}
                                                                    style={{ width: `${Math.min(yearSavingsRate, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-zinc-400 w-8">{yearSavingsRate}%</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-rose-400 font-medium">{yearSavingsRate}%</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={`p-1.5 rounded transition-colors ${isExpanded ? 'bg-amber-500/15 text-amber-400' : 'text-zinc-500'}`}>
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </div>
                                        </div>
                                    </button>

                                    {/* Months Table */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="border-t border-zinc-700/50">
                                                    {/* Table Header */}
                                                    <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs text-zinc-500 uppercase tracking-wider font-bold border-b border-zinc-800/50 bg-zinc-900/50">
                                                        <div className="col-span-3">Miesiąc</div>
                                                        <div className="col-span-2 text-right">Przychody</div>
                                                        <div className="col-span-2 text-right">Wydatki</div>
                                                        <div className="col-span-2 text-right">Bilans</div>
                                                        <div className="col-span-2">Stopa %</div>
                                                        <div className="col-span-1"></div>
                                                    </div>

                                                    {/* Month Rows */}
                                                    {yearGroup.months.map((monthData, idx) => {
                                                        const savingsRate = getSavingsRate(monthData.income, monthData.balance)
                                                        const isDeficit = monthData.balance < 0
                                                        const hasData = monthData.income > 0 || monthData.expenses > 0

                                                        return (
                                                            <div
                                                                key={`${monthData.year}-${monthData.month}`}
                                                                onClick={() => handleMonthClick(monthData)}
                                                                className={`
                                                                    grid grid-cols-12 gap-2 px-4 py-3 items-center cursor-pointer
                                                                    transition-colors duration-150 group
                                                                    ${idx % 2 === 0 ? 'bg-zinc-900/20' : 'bg-transparent'}
                                                                    hover:bg-zinc-800/40
                                                                    ${!hasData ? 'opacity-40' : ''}
                                                                `}
                                                            >
                                                                {/* Month Name */}
                                                                <div className="col-span-3 flex items-center gap-2">
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${isDeficit ? 'bg-rose-400' :
                                                                        savingsRate >= 20 ? 'bg-emerald-400' :
                                                                            savingsRate >= 10 ? 'bg-amber-400' :
                                                                                'bg-zinc-500'
                                                                        }`} />
                                                                    <span className="text-sm font-medium text-zinc-200 capitalize">
                                                                        {monthData.month}
                                                                    </span>
                                                                </div>

                                                                {/* Income - tabular-nums for perfect alignment */}
                                                                <div className="col-span-2 text-right">
                                                                    {hasData ? (
                                                                        <span className="font-mono text-sm tabular-nums text-emerald-400">
                                                                            {formatMoney(monthData.income)}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-zinc-600">—</span>
                                                                    )}
                                                                </div>

                                                                {/* Expenses - brighter for contrast */}
                                                                <div className="col-span-2 text-right">
                                                                    {hasData ? (
                                                                        <span className="font-mono text-sm tabular-nums text-rose-300/80">
                                                                            {formatMoney(monthData.expenses)}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-zinc-600">—</span>
                                                                    )}
                                                                </div>

                                                                {/* Balance - Hero Metric */}
                                                                <div className="col-span-2 text-right">
                                                                    {hasData ? (
                                                                        <span className={`font-mono text-sm tabular-nums font-bold ${isDeficit ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                                            {formatMoney(monthData.balance, true)}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-zinc-600">—</span>
                                                                    )}
                                                                </div>

                                                                {/* Savings Rate with Progress Bar - consistent design for deficit */}
                                                                <div className="col-span-2 flex items-center gap-2">
                                                                    {hasData ? (
                                                                        <>
                                                                            <div className="flex-1 max-w-[80px] h-1.5 bg-zinc-700/50 rounded-full overflow-hidden">
                                                                                {!isDeficit && savingsRate > 0 && (
                                                                                    <div
                                                                                        className={`h-full rounded-full transition-all ${savingsRate >= 30 ? 'bg-emerald-400' :
                                                                                            savingsRate >= 20 ? 'bg-emerald-500/70' :
                                                                                                savingsRate >= 10 ? 'bg-amber-400/70' :
                                                                                                    'bg-zinc-500'
                                                                                            }`}
                                                                                        style={{ width: `${Math.min(savingsRate, 100)}%` }}
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                            <span className={`text-xs font-mono tabular-nums w-10 text-right ${isDeficit ? 'text-rose-400 font-bold' :
                                                                                savingsRate >= 20 ? 'text-emerald-400' :
                                                                                    savingsRate >= 10 ? 'text-amber-400' :
                                                                                        'text-zinc-500'
                                                                                }`}>
                                                                                {savingsRate}%
                                                                            </span>
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-zinc-600">—</span>
                                                                    )}
                                                                </div>

                                                                {/* Action Arrow */}
                                                                <div className="col-span-1 flex justify-end">
                                                                    <ChevronRight
                                                                        size={16}
                                                                        className="text-zinc-600 group-hover:text-amber-400 transition-colors"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
