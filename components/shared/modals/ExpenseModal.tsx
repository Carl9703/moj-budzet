'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/layout/Modal'
import { trackCategoryUsage, trackEnvelopeUsage } from '@/lib/constants/categories'
import { useCategories } from '@/lib/contexts/CategoryContext'
import { useToast } from '@/components/ui/feedback/Toast'
import { Input } from '@/components/ui/primitives/Input'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
    onClose: () => void
    onSave: (data: ExpenseData) => void
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

    const amountInputRef = useRef<HTMLInputElement>(null)

    const selectedEnvelopeData = envelopes?.find(e => e.id === selectedEnvelope)
    const envelopeCategories = selectedEnvelopeData
        ? getCategoriesForEnvelope(selectedEnvelopeData.name)
        : []

    const allExpenseCategories = categories
    const displayCategories = showAllCategories ? allExpenseCategories : envelopeCategories

    useEffect(() => {
        if (amountInputRef.current) {
            amountInputRef.current.focus()
        }
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

    const handleSubmit = () => {
        if (!amount || !selectedEnvelope || !selectedCategory) {
            showToast('Wypełnij wszystkie pola!', 'warning')
            return
        }

        onSave({
            amount: Number(amount),
            description,
            envelopeId: selectedEnvelope,
            category: selectedCategory,
            date
        })
        onClose()
    }

    const selectedCategoryData = envelopeCategories.find(c => c.id === selectedCategory)
    const canSubmit = amount && selectedCategory && selectedEnvelope

    return (
        <Modal title="💸 Dodaj Wydatek" onClose={onClose}>
            <div className="p-3 md:p-4 bg-slate-900/20">
                <div className="space-y-2 md:space-y-3">

                    {/* HERO AMOUNT */}
                    <div className="bg-slate-800/30 py-2 md:py-3 rounded-xl border border-slate-700/50 transition-all focus-within:bg-slate-800/50 focus-within:border-indigo-500/50">
                        <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 md:mb-2 text-center">
                            Kwota wydatku
                        </label>
                        <div className="relative flex items-baseline justify-center group">
                            <input
                                ref={amountInputRef}
                                type="number"
                                inputMode="decimal"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                className="w-full bg-transparent text-3xl md:text-4xl font-black text-center text-white placeholder:text-slate-800 focus:outline-none transition-all"
                            />
                            <span className="absolute right-8 md:right-12 top-1 md:top-2 text-lg md:text-xl font-bold text-slate-600 pointer-events-none">PLN</span>
                        </div>
                    </div>

                    {/* CATEGORY & ENVELOPE SELECTION */}
                    <div className="space-y-2 md:space-y-3">
                        {/* Category Selection - Horizontal & Modern */}
                        <div className="space-y-1 md:space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider">Kategoria</label>
                                <button
                                    onClick={() => setShowAllCategories(!showAllCategories)}
                                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wide"
                                >
                                    {showAllCategories ? 'Mniej' : 'Więcej'}
                                </button>
                            </div>

                            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar snap-x">
                                {displayCategories.length === 0 && (
                                    <div className="text-xs md:text-sm text-slate-500 italic w-full text-center py-2 md:py-4 bg-slate-800/30 rounded-xl border border-dashed border-slate-700/50">
                                        Brak kategorii.
                                    </div>
                                )}
                                {displayCategories.map((cat) => {
                                    const isSelected = selectedCategory === cat.id
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => handleCategorySelect(cat.id)}
                                            className={`flex-shrink-0 flex flex-col items-center justify-center p-1.5 md:p-2 min-w-[60px] md:min-w-[70px] rounded-xl transition-all snap-start border ${isSelected
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 border-indigo-500 scale-105'
                                                : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-800 hover:text-slate-200 hover:border-slate-600'
                                                }`}
                                        >
                                            <span className={`text-lg md:text-xl filter ${isSelected ? '' : 'grayscale opacity-70'}`}>{cat.icon}</span>
                                            <span className="text-[9px] md:text-[10px] font-bold leading-tight text-center w-full truncate">
                                                {cat.name}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Envelope Selection - Even Grid */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Z koperty
                                </label>
                                <button
                                    onClick={() => setShowAllEnvelopes(!showAllEnvelopes)}
                                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wide"
                                >
                                    {showAllEnvelopes ? 'Tylko miesięczne' : 'Pokaż wszystkie'}
                                </button>
                            </div>

                            <div className="grid grid-cols-3 md:grid-cols-5 gap-1.5 md:gap-2">
                                {(() => {
                                    const filteredEnvelopes = showAllEnvelopes
                                        ? envelopes
                                        : envelopes.filter(e => e.type === 'monthly' || e.id === selectedEnvelope)

                                    const sortedEnvelopes = [...(filteredEnvelopes || [])].sort((a, b) => {
                                        if (a.id === selectedEnvelope) return -1
                                        if (b.id === selectedEnvelope) return 1
                                        if (a.type !== b.type) return a.type === 'monthly' ? -1 : 1
                                        return a.name.localeCompare(b.name)
                                    })

                                    if (sortedEnvelopes.length === 0) {
                                        return (
                                            <div className="col-span-full text-center py-6 text-slate-500 text-sm">
                                                Brak kopert
                                            </div>
                                        )
                                    }

                                    return sortedEnvelopes.map(env => {
                                        const isSelected = selectedEnvelope === env.id
                                        const isYearly = env.type === 'yearly'

                                        return (
                                            <button
                                                key={env.id}
                                                onClick={() => handleEnvelopeSelect(env.id)}
                                                className={`
                                                    flex flex-col items-center justify-center gap-0.5 p-2 rounded-xl h-[56px] md:h-[60px] transition-all duration-150
                                                    ${isSelected
                                                        ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                                                        : isYearly
                                                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                                                            : 'bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/60 hover:border-slate-600'
                                                    }
                                                `}
                                            >
                                                <span className="text-base md:text-lg">{env.icon}</span>
                                                <span className="text-[9px] md:text-[10px] font-medium text-center leading-tight line-clamp-2 w-full">{env.name}</span>
                                            </button>
                                        )
                                    })
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* DETAILS SECTION (Date & Desc) */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/50">
                        <div className="bg-slate-800/30 p-1 rounded-xl border border-slate-700/50 flex flex-col justify-center">
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-transparent text-slate-300 text-xs md:text-sm font-medium focus:outline-none w-full px-2 md:px-3 py-2 text-center date-input-icon-fix"
                            />
                        </div>
                        <input
                            type="text"
                            placeholder="Opis (opcjonalny)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-slate-800/30 border border-slate-700/50 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
                        />
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 md:py-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 font-semibold transition-colors w-1/3 text-sm"
                        >
                            Anuluj
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className={`flex-1 py-2.5 md:py-3 rounded-xl font-bold text-white text-sm md:text-base transition-all shadow-lg ${canSubmit
                                ? 'bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 shadow-rose-900/20 transform hover:-translate-y-0.5'
                                : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                                }`}
                        >
                            Wydaj {canSubmit ? amount : ''} PLN
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    )
}