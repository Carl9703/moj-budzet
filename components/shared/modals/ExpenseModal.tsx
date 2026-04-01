'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Modal } from '@/components/ui/layout/Modal'
import { api } from '@/lib/api/client'
import { trackCategoryUsage, trackEnvelopeUsage } from '@/lib/constants/categories'
import { useCategories } from '@/lib/contexts/CategoryContext'
import { useToast } from '@/components/ui/feedback/Toast'
import { Input } from '@/components/ui/primitives/Input'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
    onClose: () => void
    onSave: (data: ExpenseData) => Promise<boolean>
    envelopes: { id: string; name: string; icon: string; type: string }[]
}

interface ExpenseData {
    amount: number
    description: string
    envelopeId: string | null
    category: string
    date: string
}

export function ExpenseModal({ onClose, onSave, envelopes }: Props) {
    const { showToast } = useToast()
    const { categories, getCategoriesForEnvelope } = useCategories()
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')
    const [selectedEnvelope, setSelectedEnvelope] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [showAllCategories, setShowAllCategories] = useState(false)
    const [showAllEnvelopes, setShowAllEnvelopes] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)

    const amountInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (selectedCategory) {
            const fetchSuggestions = async () => {
                setIsLoadingSuggestions(true)
                try {
                    const data = await api.get<{ suggestions: string[] }>('/api/transactions/suggestions', {
                        categoryId: selectedCategory,
                        type: 'expense'
                    })
                    setSuggestions(data.suggestions || [])
                } catch (error) {
                    console.error('Failed to fetch suggestions', error)
                } finally {
                    setIsLoadingSuggestions(false)
                }
            }
            fetchSuggestions()
        } else {
            setSuggestions([])
        }
    }, [selectedCategory])

    const selectedEnvelopeData = envelopes?.find(e => e.id === selectedEnvelope)
    const envelopeCategories = selectedEnvelopeData
        ? getCategoriesForEnvelope(selectedEnvelopeData.name)
        : []

    const allExpenseCategories = categories
    const displayCategories = showAllCategories ? allExpenseCategories : envelopeCategories

    useEffect(() => {
        const timer = setTimeout(() => {
            amountInputRef.current?.focus()
        }, 100)
        return () => clearTimeout(timer)
    }, [])

    const handleEnvelopeSelect = (envelopeId: string) => {
        setSelectedEnvelope(envelopeId)
        setSelectedCategory('')
        trackEnvelopeUsage(envelopeId)
    }

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategory(categoryId)
        trackCategoryUsage(categoryId)

        if (!selectedEnvelope) {
            const category = categories.find(c => c.id === categoryId)
            if (category && category.defaultEnvelope) {
                const envelope = envelopes?.find(e => e.name === category.defaultEnvelope)
                if (envelope) {
                    setSelectedEnvelope(envelope.id)
                }
            }
        }
    }

    const handleSubmit = useCallback(async () => {
        if (!amount || !selectedEnvelope || !selectedCategory) {
            showToast('Wypełnij wszystkie pola!', 'warning')
            return
        }

        setIsSubmitting(true)
        try {
            const success = await onSave({
                amount: Number(amount),
                description,
                envelopeId: selectedEnvelope,
                category: selectedCategory,
                date
            })
            if (success) onClose()
        } finally {
            setIsSubmitting(false)
        }
    }, [amount, selectedEnvelope, selectedCategory, description, date, onSave, onClose, showToast])

    const selectedCategoryData = envelopeCategories.find(c => c.id === selectedCategory)
    const canSubmit = amount && selectedCategory && selectedEnvelope && !isSubmitting

    return (
        <Modal title="💸 Dodaj Wydatek" onClose={onClose}>
            <div className="p-3 md:p-4 bg-slate-900/20">
                <div className="space-y-2 md:space-y-3">

                    {/* HERO AMOUNT */}
                    <div className="bg-slate-950/50 py-6 rounded-3xl border border-white/5 transition-all focus-within:border-indigo-500/30 group">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 text-center">
                            Kwota wydatku
                        </label>
                        <div className="relative flex items-baseline justify-center w-full px-4">
                            <input
                                ref={amountInputRef}
                                type="number"
                                inputMode="decimal"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                className="w-full bg-transparent text-5xl font-black text-center text-white placeholder:text-slate-800/50 focus:outline-none transition-all tracking-tighter"
                                autoFocus
                            />
                            <span className="absolute right-12 bottom-2 text-xl font-black text-slate-500 pointer-events-none">PLN</span>
                        </div>
                    </div>

                    {/* CATEGORY & ENVELOPE SELECTION */}
                    <div className="space-y-4 md:space-y-6">
                        {/* Envelope Selection - Even Grid */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                                    Z koperty
                                </label>
                                <button
                                    onClick={() => setShowAllEnvelopes(!showAllEnvelopes)}
                                    className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-[0.2em]"
                                >
                                    {showAllEnvelopes ? 'Tylko miesięczne' : 'Pokaż wszystkie'}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                {(() => {
                                    const filteredEnvelopes = showAllEnvelopes
                                        ? envelopes
                                        : envelopes.filter(e => e.type === 'monthly' || e.id === selectedEnvelope)

                                    const usage = typeof window !== 'undefined'
                                        ? JSON.parse(localStorage.getItem('envelopeUsage') || '{}')
                                        : {}

                                    const sortedEnvelopes = [...(filteredEnvelopes || [])].sort((a, b) => {
                                        if (a.id === selectedEnvelope) return -1
                                        if (b.id === selectedEnvelope) return 1
                                        const usageA = usage[a.id] || 0
                                        const usageB = usage[b.id] || 0
                                        if (usageB !== usageA) return usageB - usageA
                                        if (a.type !== b.type) return a.type === 'monthly' ? -1 : 1
                                        return a.name.localeCompare(b.name)
                                    })

                                    if (sortedEnvelopes.length === 0) {
                                        return (
                                            <div className="col-span-full text-center py-6 text-slate-500 text-[10px] uppercase font-bold tracking-widest bg-slate-900/40 rounded-3xl border border-white/5 border-dashed">
                                                Brak kopert
                                            </div>
                                        )
                                    }

                                    return sortedEnvelopes.map(env => {
                                        const isSelected = selectedEnvelope === env.id
                                        const isYearly = env.type === 'yearly'

                                        return (
                                            <motion.button
                                                key={env.id}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleEnvelopeSelect(env.id)}
                                                className={`
                                                    flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl h-[72px] transition-all duration-200 border
                                                    ${isSelected
                                                        ? 'bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/10 text-emerald-300'
                                                        : isYearly
                                                            ? 'bg-amber-500/5 border-amber-500/20 text-amber-400 hover:bg-amber-500/10'
                                                            : 'bg-slate-900/40 border-white/5 text-slate-400 hover:bg-slate-800'
                                                    }
                                                `}
                                            >
                                                <span className={`text-xl transition-opacity ${isSelected ? 'opacity-100' : 'opacity-80'}`}>{env.icon}</span>
                                                <span className="text-[9px] font-black uppercase tracking-tighter text-center leading-[1.1] w-full mt-auto">{env.name}</span>
                                            </motion.button>
                                        )
                                    })
                                })()}
                            </div>
                        </div>

                        {/* Category Selection - Horizontal & Modern */}
                        <div className="space-y-1 md:space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Kategoria</label>
                                <button
                                    onClick={() => setShowAllCategories(!showAllCategories)}
                                    className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-[0.2em]"
                                >
                                    {showAllCategories ? 'Mniej opcji' : 'Więcej opcji'}
                                </button>
                            </div>

                            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar snap-x no-scrollbar">
                                {displayCategories.length === 0 && (
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic w-full text-center py-4 bg-slate-900/40 rounded-2xl border border-dashed border-white/5">
                                        Wybierz kopertę...
                                    </div>
                                )}
                                {displayCategories.map((cat) => {
                                    const isSelected = selectedCategory === cat.id
                                    return (
                                        <motion.button
                                            key={cat.id}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleCategorySelect(cat.id)}
                                            className={`flex-shrink-0 flex flex-col items-center justify-center p-2 min-w-[80px] rounded-2xl transition-all duration-200 snap-start border ${isSelected
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 border-indigo-500 scale-105'
                                                : 'bg-slate-900/40 text-slate-400 border-white/5 hover:bg-slate-800 hover:text-slate-300'
                                                }`}
                                        >
                                            <span className={`text-xl transition-all ${isSelected ? 'scale-110 opacity-100' : 'opacity-80'}`}>{cat.icon}</span>
                                            <span className="text-[9px] font-black uppercase tracking-tighter leading-[1.1] text-center w-full mt-1.5 break-words">
                                                {cat.name}
                                            </span>
                                        </motion.button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

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
                                        <div className="flex-shrink-0 px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-full text-[10px] font-bold text-slate-500 animate-pulse">
                                            ⏳ Analizuję historię...
                                        </div>
                                    ) : (
                                        suggestions.map((s, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setDescription(s)}
                                                className="flex-shrink-0 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[10px] font-bold text-indigo-300 transition-all active:scale-95 snap-start whitespace-nowrap"
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
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="bg-slate-950/50 p-1.5 rounded-2xl border border-white/10 shadow-inner flex flex-col justify-center transition-all focus-within:border-indigo-500/30">
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-transparent text-slate-300 text-xs md:text-sm font-black uppercase tracking-widest focus:outline-none w-full px-2 md:px-3 py-2 text-center date-input-icon-fix"
                            />
                        </div>
                        <div className="bg-slate-950/50 p-1.5 rounded-2xl border border-white/10 shadow-inner transition-all focus-within:border-indigo-500/30">
                            <input
                                type="text"
                                placeholder="OPIS (OPCJONALNY)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-transparent border-none px-3 py-2 text-xs text-white font-black uppercase tracking-widest placeholder:text-slate-700 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-4 rounded-2xl bg-slate-900 border border-white/5 hover:bg-slate-800 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] transition-all w-1/3 active:scale-95 shadow-lg"
                        >
                            Anuluj
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className={`flex-1 py-4 rounded-2xl font-black text-white text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98] ${canSubmit
                                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:scale-[1.02] shadow-indigo-500/20'
                                : 'bg-slate-900 text-slate-700 cursor-not-allowed border border-white/5 opacity-50'
                                }`}
                        >
                            {isSubmitting ? 'Zapisuję...' : `Wydaj ${amount || ''} PLN`}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    )
}