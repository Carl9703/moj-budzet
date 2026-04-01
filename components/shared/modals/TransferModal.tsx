'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Modal } from '@/components/ui/layout/Modal'
import { useToast } from '@/components/ui/feedback/Toast'
import { useCategories } from '@/lib/contexts/CategoryContext'
import { Input } from '@/components/ui/primitives/Input'
import { CustomSelect } from '@/components/ui/primitives/CustomSelect'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowRightCircle } from 'lucide-react'

interface Envelope {
    id: string
    name: string
    icon: string
    type: 'monthly' | 'yearly'
    currentAmount: number
    isAccumulating?: boolean
}

interface Props {
    onClose: () => void
    onSave: (data: TransferData) => Promise<boolean>
    envelopes: Envelope[]
    mainBalance?: number
}

interface TransferData {
    fromEnvelopeId: string
    toEnvelopeId: string
    amount: number
    description: string
    date: string
    toCategory?: string
}

export function TransferModal({ onClose, onSave, envelopes, mainBalance = 0 }: Props) {
    const { showToast } = useToast()
    const { getCategoriesForEnvelope } = useCategories()
    const [fromEnvelopeId, setFromEnvelopeId] = useState('')
    const [toEnvelopeId, setToEnvelopeId] = useState('')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [toCategory, setToCategory] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const amountInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const timer = setTimeout(() => {
            amountInputRef.current?.focus()
        }, 100)
        return () => clearTimeout(timer)
    }, [])

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

        const fromEnvelope = envelopes.find(e => e.id === fromEnvelopeId)
        if (fromEnvelope && fromEnvelopeId !== 'MAIN_ACCOUNT' && amountNum > fromEnvelope.currentAmount) {
            showToast(`Brak środków! Dostępne: ${fromEnvelope.currentAmount.toFixed(2)} zł`, 'error')
            return
        }

        setIsSubmitting(true)
        try {
            const success = await onSave({
                fromEnvelopeId,
                toEnvelopeId,
                amount: amountNum,
                description: description.trim() || 'Transfer między kopertami',
                date,
                toCategory: toCategory || undefined
            })
            if (success) onClose()
        } finally {
            setIsSubmitting(false)
        }
    }, [fromEnvelopeId, toEnvelopeId, amount, description, date, toCategory, envelopes, onSave, onClose, showToast])

    const fromEnvelope = envelopes.find(e => e.id === fromEnvelopeId)
    const toEnvelope = envelopes.find(e => e.id === toEnvelopeId)

    // Tylko koperty akumulujące mogą być w transferach (wg prośby użytkownika)
    // "chciałbym aby np w transferach były tylko koperty akumulujące"
    const accumulatingEnvelopes = envelopes.filter(e => e.isAccumulating)

    const sourceEnvelopes = accumulatingEnvelopes
    const targetEnvelopes = accumulatingEnvelopes.filter(e => e.id !== fromEnvelopeId)

    const availableCategories = toEnvelopeId ? getCategoriesForEnvelope(toEnvelope?.name || '') : []

    const fromOptions = [
        { label: 'Konto Główne', value: 'MAIN_ACCOUNT', icon: '🏦' },
        ...sourceEnvelopes.map(env => ({
            label: env.name,
            value: env.id,
            icon: env.icon
        }))
    ]

    const toOptions = targetEnvelopes.map(env => ({
        label: env.name,
        value: env.id,
        icon: env.icon
    }))

    const categoryOptions = availableCategories.map(cat => ({
        label: cat.name,
        value: cat.id,
        icon: cat.icon
    }))

    const canSubmit = fromEnvelopeId && toEnvelopeId && Number(amount) > 0 && !isSubmitting

    return (
        <Modal title="💸 Transfer Środków" onClose={onClose}>
            <div className="flex flex-col gap-3 p-3 md:p-4">

                {/* HERO AMOUNT */}
                <div className="bg-slate-950/50 py-6 rounded-3xl border border-white/5 transition-all focus-within:border-indigo-500/30">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 text-center">
                        Kwota transferu
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
                        <span className="absolute right-12 bottom-2 text-xl font-black text-slate-700 pointer-events-none">PLN</span>
                    </div>
                </div>

                {/* VISUAL FLOW: FROM → TO (Vertical Layout) */}
                <div className="flex flex-col gap-2">

                    {/* FROM */}
                    <div className="bg-slate-900/40 p-4 rounded-3xl border border-white/5">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Z konta / koperty</span>
                            {(fromEnvelope || fromEnvelopeId === 'MAIN_ACCOUNT') && (
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tight">
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
                        <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center text-indigo-400 shadow-xl shadow-black/50">
                            <ArrowRightCircle size={20} className="rotate-90" />
                        </div>
                    </div>

                    {/* TO */}
                    <div className="bg-slate-900/40 p-4 rounded-3xl border border-white/5">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Do koperty</span>
                            {toEnvelope && (
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                                    Obecnie: {toEnvelope.currentAmount.toFixed(2)} zł
                                </span>
                            )}
                        </div>
                        <CustomSelect
                            placeholder="Wybierz cel"
                            options={toOptions}
                            value={toEnvelopeId}
                            onChange={setToEnvelopeId}
                        />
                    </div>
                </div>

                {/* DETAILS (Date & Desc) */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/50">
                    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-transparent text-slate-300 text-xs font-medium focus:outline-none w-full px-2 py-2 text-center date-input-icon-fix"
                        />
                    </div>
                    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50">
                        <input
                            type="text"
                            placeholder="Opis (opcjonalny)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full h-full bg-transparent px-2 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none text-center"
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
                            className="bg-indigo-500/10 rounded-xl border border-indigo-500/20 px-3 py-2 flex justify-between items-center"
                        >
                            <div className="text-[10px] text-indigo-300 font-medium">Po operacji w celu:</div>
                            <div className="text-sm font-bold text-white font-mono">
                                {toEnvelope ? (toEnvelope.currentAmount + Number(amount)).toFixed(2) : '-'} PLN
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ACTIONS */}
                <div className="flex gap-4 pt-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-4 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 font-bold transition-all w-1/3 active:scale-95"
                    >
                        Anuluj
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className={`flex-1 py-4 rounded-2xl font-black text-white text-base uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] ${canSubmit
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:scale-[1.02] shadow-indigo-500/20'
                            : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700/50 opacity-50'
                            }`}
                    >
                        {isSubmitting ? 'Transferuję...' : 'Transferuj'}
                    </button>
                </div>
            </div>
        </Modal>
    )
}
