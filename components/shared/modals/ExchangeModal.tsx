'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Modal } from '@/components/ui/layout/Modal'
import { useToast } from '@/components/ui/feedback/Toast'
import { handleMoneyInput } from '@/lib/utils/input'
import { api } from '@/lib/api/client'

const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP']

interface Props {
    envelopeId: string
    envelopeName: string
    envelopeBalance: number
    onClose: () => void
    onSave: () => void
}

export function ExchangeModal({ envelopeId, envelopeName, envelopeBalance, onClose, onSave }: Props) {
    const { showToast } = useToast()
    const [foreignAmount, setForeignAmount] = useState('')
    const [foreignCurrency, setForeignCurrency] = useState('EUR')
    const [costBasisPln, setCostBasisPln] = useState(envelopeBalance > 0 ? envelopeBalance.toFixed(2) : '')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const amountInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const timer = setTimeout(() => amountInputRef.current?.focus(), 100)
        return () => clearTimeout(timer)
    }, [])

    const parsedForeignAmount = parseFloat(foreignAmount.replace(',', '.'))
    const parsedCostBasis = parseFloat(String(costBasisPln).replace(',', '.'))

    const impliedRate = parsedForeignAmount > 0 && parsedCostBasis > 0
        ? (parsedCostBasis / parsedForeignAmount).toFixed(4)
        : null

    const canSubmit = !!(
        foreignAmount &&
        parsedForeignAmount > 0 &&
        costBasisPln &&
        parsedCostBasis > 0 &&
        parsedCostBasis <= envelopeBalance &&
        !isSubmitting
    )

    const handleSubmit = useCallback(async () => {
        if (!canSubmit) return

        if (parsedCostBasis > envelopeBalance) {
            showToast(`Brak środków! Dostępne: ${envelopeBalance.toFixed(2)} zł`, 'warning')
            return
        }

        setIsSubmitting(true)
        try {
            await api.post(`/api/envelopes/${envelopeId}/exchange`, {
                foreignAmount: parsedForeignAmount,
                foreignCurrency,
                costBasisPln: parsedCostBasis,
                date,
            })
            showToast(`Zarejestrowano: ${parsedForeignAmount} ${foreignCurrency} @ ${impliedRate} PLN/${foreignCurrency}`, 'success')
            onSave()
            onClose()
        } catch (error: any) {
            showToast(error?.message || 'Błąd rejestracji wymiany', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }, [canSubmit, parsedForeignAmount, parsedCostBasis, foreignCurrency, date, envelopeId, envelopeBalance, impliedRate, onSave, onClose, showToast])

    return (
        <Modal title="💱 Wymień Walutę" onClose={onClose}>
            <div className="p-3 md:p-4 bg-zinc-900/20">
                <div className="space-y-3">

                    {/* Info */}
                    <div className="bg-zinc-950/50 rounded-2xl border border-amber-500/20 px-4 py-3 text-xs text-zinc-400">
                        Rejestruj zakup waluty w kopercie <span className="text-amber-400 font-bold">{envelopeName}</span>.
                        Saldo PLN nie zmienia się — wartość jest &quot;zarezerwowana&quot; jako lot walutowy.
                    </div>

                    {/* Kwota w walucie obcej */}
                    <div className="bg-zinc-950/50 py-6 rounded-3xl border border-white/5 transition-all focus-within:border-amber-500/30">
                        <label className="block text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 text-center">
                            Kwota w walucie obcej
                        </label>
                        <div className="flex justify-center gap-2 mb-4">
                            {SUPPORTED_CURRENCIES.map(c => (
                                <button type="button"
                                    key={c}
                                    onClick={() => setForeignCurrency(c)}
                                    className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${foreignCurrency === c ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                        <div className="relative flex items-baseline justify-center w-full px-4">
                            <input
                                ref={amountInputRef}
                                type="number"
                                inputMode="decimal"
                                value={foreignAmount}
                                onChange={(e) => handleMoneyInput(e.target.value, setForeignAmount)}
                                placeholder="0"
                                className="w-full bg-transparent text-5xl font-black text-center text-white placeholder:text-zinc-800/50 focus:outline-none transition-all tracking-tighter"
                            />
                            <span className="absolute right-10 bottom-1 text-xl font-black text-zinc-600 pointer-events-none">{foreignCurrency}</span>
                        </div>
                        {impliedRate && (
                            <p className="mt-3 text-center text-xs text-amber-400 font-bold">
                                Kurs: {impliedRate} PLN/{foreignCurrency}
                            </p>
                        )}
                    </div>

                    {/* Koszt w PLN */}
                    <div className="bg-zinc-950/50 rounded-3xl border border-white/5 px-4 py-4 space-y-2 transition-all focus-within:border-amber-500/30">
                        <label className="block text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">
                            Koszt nabycia (PLN)
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                inputMode="decimal"
                                value={costBasisPln}
                                onChange={(e) => handleMoneyInput(e.target.value, setCostBasisPln)}
                                placeholder="0.00"
                                className="flex-1 bg-transparent text-2xl font-black text-white placeholder:text-zinc-800/50 focus:outline-none tracking-tighter"
                            />
                            <span className="text-zinc-500 font-black text-lg">PLN</span>
                        </div>
                        <p className="text-xs text-zinc-600">
                            Dostępne w kopercie: <span className="text-zinc-400">{envelopeBalance.toFixed(2)} zł</span>
                            {parsedCostBasis > envelopeBalance && (
                                <span className="text-red-400 ml-2">Przekroczono saldo!</span>
                            )}
                        </p>
                    </div>

                    {/* Data */}
                    <div className="bg-zinc-950/50 p-1.5 rounded-2xl border border-white/10 shadow-inner transition-all focus-within:border-amber-500/30">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-transparent text-zinc-300 text-xs font-black uppercase tracking-widest focus:outline-none w-full px-2 py-2 text-center date-input-icon-fix"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 pt-2">
                        <button type="button"
                            onClick={onClose}
                            className="px-6 py-4 rounded-2xl bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-500 font-black text-xs uppercase tracking-[0.2em] transition-all w-1/3 active:scale-95 shadow-lg"
                        >
                            Anuluj
                        </button>
                        <button type="button"
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className={`flex-1 py-4 rounded-2xl font-black text-white text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98] ${canSubmit
                                ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:scale-[1.02] shadow-amber-500/20'
                                : 'bg-zinc-900 text-zinc-700 cursor-not-allowed border border-white/5 opacity-50'
                                }`}
                        >
                            {isSubmitting
                                ? 'Zapisuję...'
                                : foreignAmount && parsedForeignAmount > 0
                                    ? `Zarejestruj ${parsedForeignAmount} ${foreignCurrency}`
                                    : 'Zarejestruj wymianę'
                            }
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    )
}
