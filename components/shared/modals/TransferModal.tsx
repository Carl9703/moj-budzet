'use client'

import { useState, useRef, useEffect } from 'react'
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
    onSave: (data: TransferData) => void
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

    const amountInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (amountInputRef.current) {
            amountInputRef.current.focus()
        }
    }, [])

    const handleSubmit = () => {
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

        onSave({
            fromEnvelopeId,
            toEnvelopeId,
            amount: amountNum,
            description: description.trim() || 'Transfer między kopertami',
            date,
            toCategory: toCategory || undefined
        })
        onClose()
    }

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

    const canSubmit = fromEnvelopeId && toEnvelopeId && Number(amount) > 0

    return (
        <Modal title="💸 Transfer Środków" onClose={onClose}>
            <div className="flex flex-col gap-3 p-3 md:p-4">

                {/* HERO AMOUNT */}
                <div className="bg-slate-800/30 py-2 md:py-3 rounded-xl border border-slate-700/50">
                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 text-center">
                        Kwota transferu
                    </label>
                    <div className="relative flex items-baseline justify-center">
                        <input
                            ref={amountInputRef}
                            type="number"
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            className="w-full bg-transparent text-3xl md:text-4xl font-black text-center text-white placeholder:text-slate-800 focus:outline-none"
                            autoFocus
                        />
                        <span className="absolute right-8 md:right-12 top-0.5 md:top-1 text-lg font-bold text-slate-600 pointer-events-none">PLN</span>
                    </div>
                </div>

                {/* VISUAL FLOW: FROM → TO (Vertical Layout) */}
                <div className="flex flex-col gap-2">

                    {/* FROM */}
                    <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Z konta / koperty</span>
                            {(fromEnvelope || fromEnvelopeId === 'MAIN_ACCOUNT') && (
                                <span className="text-[10px] font-bold text-emerald-400 font-mono">
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
                    <div className="flex justify-center py-1">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                            <ArrowRight size={16} className="rotate-90" />
                        </div>
                    </div>

                    {/* TO */}
                    <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Do koperty</span>
                            {toEnvelope && (
                                <span className="text-[10px] font-bold text-slate-400 font-mono">
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
                        className={`flex-1 py-2.5 md:py-3 rounded-xl font-bold text-white text-sm md:text-base transition-all shadow-lg flex items-center justify-center gap-2 ${canSubmit
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-900/20'
                            : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                            }`}
                    >
                        Transferuj
                    </button>
                </div>
            </div>
        </Modal>
    )
}
