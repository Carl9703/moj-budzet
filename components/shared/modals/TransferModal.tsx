'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Modal } from '@/components/ui/layout/Modal'
import { useToast } from '@/components/ui/feedback/Toast'
import { handleMoneyInput } from '@/lib/utils/input'
import { useCategories } from '@/lib/contexts/CategoryContext'
import { CustomSelect } from '@/components/ui/primitives/CustomSelect'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRightCircle } from 'lucide-react'

interface Envelope {
    id: string
    name: string
    icon: string
    type: 'monthly' | 'yearly'
    currentAmount: number
    isAccumulating?: boolean
    currencyCode?: string
}

interface Props {
    onClose: () => void
    onSave: (data: TransferData) => Promise<boolean>
    envelopes: Envelope[]
    mainBalance?: number
}

export interface TransferData {
    fromEnvelopeId: string
    toEnvelopeId: string
    amount: number
    description: string
    date: string
    toCategory?: string
    destinationAmount?: number
}

export function TransferModal({ onClose, onSave, envelopes, mainBalance = 0 }: Props) {
    const { showToast } = useToast()
    const { getCategoriesForEnvelope } = useCategories()
    const [fromEnvelopeId, setFromEnvelopeId] = useState('MAIN_ACCOUNT')
    const [toEnvelopeId, setToEnvelopeId] = useState('')
    const [amount, setAmount] = useState('')
    const [destinationAmount, setDestinationAmount] = useState('')
    const [description, setDescription] = useState('')
    const [toCategory, setToCategory] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const amountInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const timer = setTimeout(() => amountInputRef.current?.focus(), 100)
        return () => clearTimeout(timer)
    }, [])

    const fromEnvelope = fromEnvelopeId === 'MAIN_ACCOUNT'
        ? null
        : envelopes.find(e => e.id === fromEnvelopeId)
    const toEnvelope = envelopes.find(e => e.id === toEnvelopeId)

    const toCurrency = toEnvelope?.currencyCode ?? 'PLN'
    const isCrossCurrency = toCurrency !== 'PLN'

    // Kurs wymiany (informacyjny) — wyliczany z obu pól kwot
    const impliedRate = isCrossCurrency && Number(amount) > 0 && Number(destinationAmount) > 0
        ? (Number(amount) / Number(destinationAmount)).toFixed(4)
        : null

    const handleSubmit = useCallback(async () => {
        if (!fromEnvelopeId || !toEnvelopeId) {
            showToast('Wybierz koperty źródłową i docelową!', 'warning')
            return
        }
        if (fromEnvelopeId === toEnvelopeId) {
            showToast('Nie można transferować do tej samej koperty!', 'warning')
            return
        }

        const amountNum = Number(amount)
        if (!amountNum || amountNum <= 0) {
            showToast('Kwota musi być większa od 0!', 'warning')
            return
        }

        if (isCrossCurrency && (!destinationAmount || Number(destinationAmount) <= 0)) {
            showToast(`Podaj kwotę docelową w ${toCurrency}!`, 'warning')
            return
        }

        const fromBal = fromEnvelopeId === 'MAIN_ACCOUNT' ? mainBalance : (fromEnvelope?.currentAmount ?? 0)
        if (fromEnvelopeId !== 'MAIN_ACCOUNT' && amountNum > fromBal) {
            showToast(`Brak środków! Dostępne: ${fromBal.toFixed(2)} PLN`, 'error')
            return
        }

        setIsSubmitting(true)
        try {
            const success = await onSave({
                fromEnvelopeId,
                toEnvelopeId,
                amount: amountNum,
                description: description.trim() || (isCrossCurrency ? `Wymiana PLN → ${toCurrency}` : 'Transfer między kopertami'),
                date,
                toCategory: toCategory || undefined,
                destinationAmount: isCrossCurrency ? Number(destinationAmount) : undefined,
            })
            if (success) onClose()
        } finally {
            setIsSubmitting(false)
        }
    }, [fromEnvelopeId, toEnvelopeId, amount, destinationAmount, description, date, toCategory,
        envelopes, mainBalance, fromEnvelope, isCrossCurrency, toCurrency, onSave, onClose, showToast])

    // Koperty akumulujące + wszystkie koperty walutowe (sub-koperty) mogą być celem transferu
    const accumulatingOrCurrency = envelopes.filter(e => e.isAccumulating || (e.currencyCode && e.currencyCode !== 'PLN'))

    const sourceEnvelopes = envelopes.filter(e => e.isAccumulating)
    const targetEnvelopes = accumulatingOrCurrency.filter(e => e.id !== fromEnvelopeId)

    const availableCategories = toEnvelopeId ? getCategoriesForEnvelope(toEnvelope?.name || '') : []

    const fromOptions = [
        { label: 'Konto Główne', value: 'MAIN_ACCOUNT', icon: '🏦' },
        ...sourceEnvelopes.map(env => ({ label: env.name, value: env.id, icon: env.icon }))
    ]

    const toOptions = targetEnvelopes.map(env => ({
        label: env.currencyCode && env.currencyCode !== 'PLN'
            ? `${env.name} (${env.currencyCode})`
            : env.name,
        value: env.id,
        icon: env.icon
    }))

    const categoryOptions = availableCategories.map(cat => ({
        label: cat.name,
        value: cat.id,
        icon: cat.icon
    }))

    const canSubmit = !!(
        fromEnvelopeId && toEnvelopeId &&
        Number(amount) > 0 &&
        (!isCrossCurrency || Number(destinationAmount) > 0) &&
        !isSubmitting
    )

    return (
        <Modal title="Transfer Środków" onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex flex-col gap-3 p-3 md:p-4">

                {/* HERO AMOUNT */}
                <div className="bg-zinc-950/50 py-6 rounded-3xl border border-white/5 transition-all focus-within:border-amber-500/30">
                    <label className="block text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 text-center">
                        Kwota transferu (PLN)
                    </label>
                    <div className="relative flex items-baseline justify-center w-full px-4">
                        <input
                            ref={amountInputRef}
                            type="number"
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => handleMoneyInput(e.target.value, setAmount)}
                            placeholder="0"
                            className="w-full bg-transparent text-5xl font-black text-center text-white placeholder:text-zinc-800/50 focus:outline-none transition-all tracking-tighter"
                            autoFocus
                        />
                        <span className="absolute right-12 bottom-2 text-xl font-black text-zinc-700 pointer-events-none">PLN</span>
                    </div>
                </div>

                {/* CROSS-CURRENCY: kwota docelowa */}
                <AnimatePresence>
                    {isCrossCurrency && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl py-5 px-4">
                                <label className="block text-xs font-black text-amber-500 uppercase tracking-[0.2em] mb-3 text-center">
                                    Kwota otrzymana ({toCurrency})
                                </label>
                                <div className="relative flex items-baseline justify-center">
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        value={destinationAmount}
                                        onChange={(e) => setDestinationAmount(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-transparent text-4xl font-black text-center text-amber-300 placeholder:text-zinc-800/50 focus:outline-none tracking-tighter"
                                    />
                                    <span className="absolute right-8 bottom-1 text-lg font-black text-amber-700 pointer-events-none">{toCurrency}</span>
                                </div>
                                {impliedRate && (
                                    <p className="text-xs text-center text-zinc-500 mt-2 font-mono">
                                        kurs: <span className="text-zinc-300 font-black">{impliedRate} PLN/{toCurrency}</span>
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* VISUAL FLOW: FROM → TO */}
                <div className="flex flex-col gap-2">
                    {/* FROM */}
                    <div className="bg-zinc-900/40 p-4 rounded-3xl border border-white/5">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Z konta / koperty</span>
                            {(fromEnvelope || fromEnvelopeId === 'MAIN_ACCOUNT') && (
                                <span className="text-xs font-black text-emerald-500 uppercase tracking-tight">
                                    Dostępne: {fromEnvelopeId === 'MAIN_ACCOUNT'
                                        ? `${mainBalance.toFixed(2)} zł`
                                        : `${fromEnvelope?.currentAmount.toFixed(2)} zł`
                                    }
                                </span>
                            )}
                        </div>
                        <CustomSelect
                            placeholder="Wybierz źródło"
                            options={fromOptions}
                            value={fromEnvelopeId}
                            onChange={(val) => {
                                setFromEnvelopeId(val)
                                if (val === toEnvelopeId) setToEnvelopeId('')
                            }}
                        />
                    </div>

                    {/* CONNECTOR */}
                    <div className="flex justify-center -my-4 relative z-10">
                        <div className="w-10 h-10 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center text-amber-400 shadow-xl shadow-black/50">
                            <ArrowRightCircle size={20} className="rotate-90" />
                        </div>
                    </div>

                    {/* TO */}
                    <div className="bg-zinc-900/40 p-4 rounded-3xl border border-white/5">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Do koperty</span>
                            {toEnvelope && (
                                <span className="text-xs font-black text-zinc-500 uppercase tracking-tight">
                                    Obecnie: {toEnvelope.currentAmount.toFixed(2)} {toCurrency}
                                </span>
                            )}
                        </div>
                        <CustomSelect
                            placeholder="Wybierz cel"
                            options={toOptions}
                            value={toEnvelopeId}
                            onChange={(val) => {
                                setToEnvelopeId(val)
                                setDestinationAmount('')
                            }}
                        />
                    </div>
                </div>

                {/* DETAILS */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/50">
                    <div className="bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-transparent text-zinc-300 text-xs font-medium focus:outline-none w-full px-2 py-2 text-center date-input-icon-fix"
                        />
                    </div>
                    <div className="bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                        <input
                            type="text"
                            placeholder="Opis (opcjonalny)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full h-full bg-transparent px-2 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none text-center"
                        />
                    </div>
                </div>

                {/* PREVIEW */}
                <AnimatePresence>
                    {canSubmit && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-amber-500/10 rounded-xl border border-amber-500/20 px-3 py-2 flex justify-between items-center"
                        >
                            <div className="text-xs text-amber-300 font-medium">Po operacji w celu:</div>
                            <div className="text-sm font-bold text-white font-mono">
                                {toEnvelope
                                    ? isCrossCurrency
                                        ? `${(toEnvelope.currentAmount + Number(destinationAmount)).toFixed(2)} ${toCurrency}`
                                        : `${(toEnvelope.currentAmount + Number(amount)).toFixed(2)} PLN`
                                    : '-'
                                }
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ACTIONS */}
                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-4 rounded-2xl bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 font-bold transition-all w-1/3 active:scale-95"
                    >
                        Anuluj
                    </button>
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className={`flex-1 py-4 rounded-2xl font-black text-white text-base uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] ${canSubmit
                            ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:scale-[1.02] shadow-amber-500/20'
                            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700/50 opacity-50'
                        }`}
                    >
                        {isSubmitting ? 'Transferuję...' : isCrossCurrency ? `Wymień ${toCurrency}` : 'Transferuj'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
