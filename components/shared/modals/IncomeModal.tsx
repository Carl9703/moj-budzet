'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Modal } from '@/components/ui/layout/Modal'
import { api } from '@/lib/api/client'
import { useToast } from '@/components/ui/feedback/Toast'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
    onClose: () => void
    onSave: (data: IncomeData) => Promise<boolean>
    onSwitchToBonus?: () => void
}

interface IncomeData {
    amount: number
    description?: string
    includeInStats?: boolean
    type?: string
    date?: string
    bonusDistribution?: { envelopeId: string; amount: number }[]
}

export function IncomeModal({ onClose, onSave }: Props) {
    const { showToast } = useToast()
    const [incomeType, setIncomeType] = useState<'salary' | 'other' | 'bonus'>('salary')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [includeInStats, setIncludeInStats] = useState(true)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)

    const amountInputRef = useRef<HTMLInputElement>(null)

    // Focus on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            amountInputRef.current?.focus()
        }, 100)
        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Re-focus when switching income type
    const prevTypeRef = useRef(incomeType)
    useEffect(() => {
        if (prevTypeRef.current !== incomeType) {
            prevTypeRef.current = incomeType
            setTimeout(() => amountInputRef.current?.focus(), 50)
        }
    }, [incomeType])

    // Stany dla premii - załadowane z konfiguracji
    const [bonusDistribution, setBonusDistribution] = useState<Array<{ envelopeId: string; envelopeName: string; percentage: number }>>([])
    const [allEnvelopes, setAllEnvelopes] = useState<Array<{ id: string; name: string; icon: string | null }>>([])

    // Stany dla pensji (zmienne pomocnicze, logika ładowania domyślnych wartości jest zachowana w useEffect)
    // UWAGA: W oryginalnym kodzie zmienne toJoint, toSavings itp. były ładowane ale niewykorzystywane w UI bezpośrednio
    // poza logiką ładowania. Ponieważ IncomeModal teraz skupia się na Amount + Description, 
    // a domyślny podział jest prawdopodobnie robiony po stronie serwera lub w innym miejscu,
    // tutaj skupiam się na UI. Jeśli te wartości są potrzebne do "Autodystrybucji", to w oryginalnym kodzie
    // IncomeModal nie miał pól do ich edycji (poza "bonus"). 
    // Zakładam, że dla Salary/Other podajemy tylko kwotę, a backend/logika robi resztę (lub są to pola hidden).
    // W oryginalnym kodzie widzę tylko Input amount i logiczne ładowanie cfg.defaultSalary.

    useEffect(() => {
        let isMounted = true

        const loadDefaults = async () => {
            try {
                const data = await api.get<{ config?: { defaultSalary?: number; bonusDistribution?: string }; monthlyEnvelopes?: { id: string; name: string; icon: string | null }[]; yearlyEnvelopes?: { id: string; name: string; icon: string | null }[] }>('/api/config')
                const cfg = data?.config
                if (!cfg) return

                if (!isMounted) return

                const envelopes = [
                    ...(data?.monthlyEnvelopes || []),
                    ...(data?.yearlyEnvelopes || [])
                ]
                setAllEnvelopes(envelopes.map(e => ({
                    id: e.id,
                    name: e.name,
                    icon: e.icon
                })))

                if (incomeType === 'salary') {
                    setAmount(cfg.defaultSalary ? String(cfg.defaultSalary) : '')
                } else if (incomeType === 'bonus' && cfg.bonusDistribution) {
                    try {
                        setBonusDistribution(JSON.parse(cfg.bonusDistribution))
                    } catch {
                        setBonusDistribution([])
                    }
                    setAmount('')
                } else {
                    setAmount('')
                }
            } catch (err) {
                console.error('Error loading defaults:', err)
            }
        }

        loadDefaults()
        return () => { isMounted = false }
    }, [incomeType])

    useEffect(() => {
        const fetchSuggestions = async () => {
            setIsLoadingSuggestions(true)
            try {
                const catId = incomeType === 'other' ? 'income_other' : incomeType
                const data = await api.get<{ suggestions: string[] }>('/api/transactions/suggestions', {
                    categoryId: catId,
                    type: 'income'
                })
                setSuggestions(data.suggestions || [])
            } catch (error) {
                console.error('Failed to fetch suggestions', error)
            } finally {
                setIsLoadingSuggestions(false)
            }
        }
        fetchSuggestions()
    }, [incomeType])

    const totalBonusPercentage = bonusDistribution.reduce((sum, d) => sum + d.percentage, 0)

    const calculateAmount = (percentage: number) => {
        return Math.round((Number(amount) * percentage) / 100)
    }

    const getEnvelopeName = (envelopeId: string) => {
        const env = allEnvelopes.find(e => e.id === envelopeId)
        return env?.name || 'Nieznana koperta'
    }

    const getEnvelopeIcon = (envelopeId: string) => {
        const env = allEnvelopes.find(e => e.id === envelopeId)
        return env?.icon || '📦'
    }

    const handleSubmit = useCallback(async () => {
        const amountNum = Number(amount || 0)

        if (amountNum <= 0) {
            showToast('Wprowadź prawidłową kwotę!', 'warning')
            return
        }

        if (incomeType === 'bonus' && totalBonusPercentage !== 100) {
            showToast('Suma procentów musi wynosić 100%!', 'warning')
            return
        }

        if (incomeType === 'bonus' && bonusDistribution.some(d => !d.envelopeId)) {
            showToast('Wszystkie koperty muszą być wybrane!', 'warning')
            return
        }

        const saveData: IncomeData = {
            amount: amountNum,
            description: description || (incomeType === 'salary' ? 'Wypłata' : incomeType === 'bonus' ? 'Premia' : 'Inny przychód'),
            includeInStats,
            type: incomeType,
            date: date
        }

        if (incomeType === 'bonus') {
            saveData.bonusDistribution = bonusDistribution.map(d => ({
                envelopeId: d.envelopeId,
                amount: calculateAmount(d.percentage)
            }))
        }

        setIsSubmitting(true)
        try {
            const success = await onSave(saveData)
            if (success) onClose()
        } finally {
            setIsSubmitting(false)
        }
    }, [amount, description, incomeType, includeInStats, date, bonusDistribution, totalBonusPercentage, onSave, onClose, showToast, calculateAmount])

    const canSubmit = Number(amount || 0) > 0 && !isSubmitting

    return (
        <Modal title="💰 Dodaj Przychód" onClose={onClose}>
            <div className="flex flex-col gap-6">

                {/* HERO AMOUNT */}
                <div className="relative flex flex-col items-center justify-center py-6">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">
                        {incomeType === 'bonus' ? 'Kwota premii' : 'Kwota przychodu'}
                    </label>
                    <div className="relative flex items-baseline justify-center w-full px-4">
                        <input
                            ref={amountInputRef}
                            type="number"
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            className="w-full bg-transparent text-5xl font-black text-center text-white placeholder:text-zinc-800/50 focus:outline-none transition-all tracking-tighter"
                            autoFocus
                        />
                        <span className="absolute right-12 bottom-2 text-xl font-black text-zinc-700 pointer-events-none">PLN</span>
                    </div>
                </div>

                {/* INCOME TYPE SEGMENTED CONTROL */}
                <div className="bg-zinc-950/50 p-1.5 rounded-2xl border border-white/5 flex relative shadow-inner">
                    {[
                        { id: 'salary', label: 'Wypłata', icon: '💼' },
                        { id: 'other', label: 'Inne', icon: '💵' },
                        { id: 'bonus', label: 'Premia', icon: '🎁' },
                    ].map((type) => (
                        <button
                            key={type.id}
                            onClick={() => setIncomeType(type.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 relative z-10 
                            ${incomeType === type.id
                                    ? 'text-white'
                                    : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <span className="text-base">{type.icon}</span>
                            <span>{type.label}</span>
                            {incomeType === type.id && (
                                <motion.div
                                    layoutId="incomeTypeIndicator"
                                    className="absolute inset-0 bg-zinc-800 border border-white/5 rounded-xl -z-10 shadow-lg"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* DYNAMIC CONTENT based on type */}
                <AnimatePresence mode="wait">
                    {/* BONUS DETAILS */}
                    {incomeType === 'bonus' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-zinc-800/20 rounded-xl p-4 border border-zinc-700/30"
                        >
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Plan podziału</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${totalBonusPercentage === 100
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    }`}>
                                    Suma: {totalBonusPercentage}%
                                </span>
                            </div>

                            {bonusDistribution.length === 0 ? (
                                <div className="text-center py-4 text-zinc-500 text-sm">
                                    Brak reguł podziału w ustawieniach.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {bonusDistribution.map((dist, index) => (
                                        <div key={index} className="flex items-center gap-3 p-2 rounded-xl bg-zinc-900/30 border border-zinc-800">
                                            <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-lg shadow-inner">
                                                {getEnvelopeIcon(dist.envelopeId)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-zinc-300 break-words">{getEnvelopeName(dist.envelopeId)}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={dist.percentage}
                                                    onChange={(e) => {
                                                        const newDist = [...bonusDistribution]
                                                        newDist[index].percentage = parseInt(e.target.value) || 0
                                                        setBonusDistribution(newDist)
                                                    }}
                                                    className="w-12 bg-transparent text-right font-bold text-zinc-400 focus:text-white outline-none border-b border-transparent focus:border-amber-500 text-sm"
                                                />
                                                <span className="text-zinc-600 text-xs font-bold">%</span>
                                            </div>
                                            <div className="w-20 text-right font-mono font-bold text-emerald-400 text-sm">
                                                {calculateAmount(dist.percentage)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* OTHER DETAILS */}
                    {incomeType === 'other' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${includeInStats
                                ? 'bg-emerald-500/5 border-emerald-500/30'
                                : 'bg-zinc-800/30 border-zinc-700'
                                }`}>
                                <div className="flex-1">
                                    <div className={`font-bold text-sm ${includeInStats ? 'text-emerald-400' : 'text-zinc-400'}`}>
                                        Wliczaj do statystyk
                                    </div>
                                    <div className="text-[10px] text-zinc-500 mt-0.5">
                                        {includeInStats
                                            ? 'Wpłynie na bilans przychodów/wydatków'
                                            : 'Tylko zwiększy saldo konta (np. zwrot)'}
                                    </div>
                                </div>
                                <div className={`w-10 h-6 rounded-full relative transition-colors ${includeInStats ? 'bg-emerald-500' : 'bg-zinc-600'
                                    }`}>
                                    <input
                                        type="checkbox"
                                        checked={includeInStats}
                                        onChange={(e) => setIncludeInStats(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${includeInStats ? 'left-5' : 'left-1'
                                        }`} />
                                </div>
                            </label>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* SUGGESTIONS ROW */}
                <AnimatePresence>
                    {(suggestions.length > 0 || isLoadingSuggestions) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="flex gap-2 overflow-x-auto pb-2 px-1 custom-scrollbar snap-x no-scrollbar">
                                {isLoadingSuggestions ? (
                                    <div className="flex-shrink-0 px-3 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded-full text-[10px] font-bold text-zinc-500 animate-pulse">
                                        ⏳ Analizuję historię...
                                    </div>
                                ) : (
                                    suggestions.map((s, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setDescription(s)}
                                            className="flex-shrink-0 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-full text-[10px] font-bold text-emerald-300 transition-all active:scale-95 snap-start whitespace-nowrap"
                                        >
                                            {s}
                                        </button>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* DETAILS SECTION (Date & Desc) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-800/50">
                    <div className="bg-zinc-800/30 p-1 rounded-xl border border-zinc-700/50 flex flex-col justify-center">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-transparent text-zinc-300 text-sm font-medium focus:outline-none w-full px-3 py-2 text-center date-input-icon-fix"
                        />
                    </div>
                    <input
                        type="text"
                        placeholder="Opis"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-zinc-800/30 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50 transition-all font-medium"
                    />
                </div>

                {/* ACTIONS */}
                <div className="flex gap-4 pt-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-4 rounded-2xl bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 font-bold transition-all w-1/3 active:scale-95"
                    >
                        Anuluj
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className={`flex-1 py-4 rounded-2xl font-black text-white text-base uppercase tracking-widest transition-all shadow-xl active:scale-[0.98] ${canSubmit
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:scale-[1.02] shadow-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700/50 opacity-50'
                            }`}
                    >
                        {incomeType === 'bonus' ? 'Rozdziel Premię' : isSubmitting ? 'Zapisuję...' : `Dodaj ${amount || '0'} PLN`}
                    </button>
                </div>
            </div>
        </Modal>
    )
}