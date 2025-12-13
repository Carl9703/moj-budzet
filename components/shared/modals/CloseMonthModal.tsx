'use client'

import { Modal } from '@/components/ui/layout/Modal'
import { useState, useEffect } from 'react'
import { formatMoney, roundToCents } from '@/lib/utils/money'
import { api } from '@/lib/api/client'
import { motion, AnimatePresence } from 'framer-motion'

interface EnvelopeStatus {
    name: string
    icon: string
    current: number
    planned: number
    spent: number
}

interface Props {
    onClose: () => void
    onConfirm: () => void | Promise<void>
    surplus?: number
    transfers?: Array<{ name: string; icon: string; amount: number }>
    monthSummary: {
        income: number
        expenses: number
        savings: number
        returns?: number
    }
    monthName?: string
}

export function CloseMonthModal({ onClose, onConfirm, surplus, transfers = [], monthSummary, monthName }: Props) {
    const [envelopeStatus, setEnvelopeStatus] = useState<EnvelopeStatus[]>([])
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const displayMonth = monthName || new Date().toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
    // Nadwyżka jest obliczana w API (przychody - wydatki - alokacje - fundusz awaryjny)
    const balance = roundToCents(surplus ?? monthSummary.savings)
    const savingsRate = monthSummary.income > 0 ? Math.round((balance / monthSummary.income) * 100) : 0

    useEffect(() => {
        api.get<{ monthlyEnvelopes: EnvelopeStatus[] }>('/api/dashboard')
            .then(data => {
                const status = data.monthlyEnvelopes
                    ?.filter((e) => e.name !== 'Budowanie Przyszłości' && e.name !== 'Fundusz Awaryjny')
                    ?.map((e: EnvelopeStatus) => {
                        const remaining = e.planned - e.spent
                        return {
                            name: e.name,
                            icon: e.icon,
                            current: remaining,
                            planned: e.planned,
                            spent: e.spent
                        }
                    })
                setEnvelopeStatus(status || [])
                setLoading(false)
            })
            .catch(() => {
                setLoading(false)
            })
    }, [])

    return (
        <Modal title={`🔒 Zamknij Miesiąc - ${displayMonth}`} onClose={onClose}>
            <div className="flex flex-col gap-6">

                {/* INFO SECTION */}
                <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                    <p className="text-sm text-slate-400 mb-3 font-medium">
                        Potwierdź zamknięcie miesiąca. System wykona następujące operacje:
                    </p>
                    <ul className="space-y-2.5">
                        <li className="flex items-start gap-3 text-sm text-slate-300">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs mt-0.5">✓</span>
                            <span>Reset salda kopert miesięcznych do 0 zł</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-slate-300">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs mt-0.5">✓</span>
                            <span>
                                {balance > 0
                                    ? `Transfer nadwyżki ${formatMoney(balance, false)} zł do "Wolnych środków"`
                                    : balance < 0
                                        ? `Zapisanie deficytu ${formatMoney(Math.abs(balance), false)} zł w historii`
                                        : 'Bilans zerowy - brak transferów'}
                            </span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-slate-300">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs mt-0.5">✓</span>
                            <span>Archiwizacja podsumowania miesiąca</span>
                        </li>
                    </ul>
                </div>

                {/* MONTH SUMMARY CARD */}
                <div className={`p-5 rounded-xl border relative overflow-hidden ${balance >= 0
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-rose-950/20 border-rose-500/30'
                    }`}>
                    {/* Background glow */}
                    <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${balance >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                        }`} />

                    <h3 className="text-base font-bold text-slate-200 mb-4 relative z-10 flex items-center gap-2">
                        📊 Wyniki finansowe
                        {balance >= 0 && (
                            <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/20">
                                Dobra robota!
                            </span>
                        )}
                    </h3>

                    <div className="space-y-3 relative z-10">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Przychody</span>
                            <span className="font-bold text-emerald-400">+{formatMoney(monthSummary.income, false)} zł</span>
                        </div>

                        {/* Wiersz dla zwrotów - wyświetlaj tylko gdy są > 0 */}
                        {(monthSummary.returns || 0) > 0 && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Zwroty i refundacje</span>
                                <span className="font-bold text-blue-400">+{formatMoney(monthSummary.returns || 0, false)} zł</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Wydatki</span>
                            <span className="font-bold text-rose-400">-{formatMoney(monthSummary.expenses, false)} zł</span>
                        </div>

                        {/* Transfery zmniejszające saldo */}
                        {transfers.length > 0 && (
                            <div className="pt-2 border-t border-slate-700/50 space-y-2">
                                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Transfery do kopert</div>
                                {transfers.map((transfer, index) => (
                                    <div key={index} className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400 flex items-center gap-2">
                                            <span>{transfer.icon}</span>
                                            <span>{transfer.name}</span>
                                        </span>
                                        <span className="font-bold text-amber-400">-{formatMoney(transfer.amount, false)} zł</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={`mt-2 pt-3 border-t flex justify-between items-center ${balance >= 0 ? 'border-emerald-500/20' : 'border-rose-500/20'
                            }`}>
                            <div>
                                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Bilans Końcowy</div>
                                {balance > 0 && <div className="text-xs text-indigo-400">Stopa oszczędności: {savingsRate}%</div>}
                            </div>
                            <span className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                {balance > 0 ? '+' : ''}{formatMoney(balance, false)} zł
                            </span>
                        </div>
                    </div>
                </div>

                {/* ENVELOPE STATUS LIST */}
                {!loading && envelopeStatus.length > 0 && (
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/80 max-h-48 overflow-y-auto custom-scrollbar">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 sticky top-0 bg-slate-900/95 py-1 z-10">
                            Stan kopert do wyzerowania:
                        </h4>
                        <div className="space-y-2">
                            {envelopeStatus.map((e, i) => (
                                <div key={i} className="flex items-center justify-between text-xs py-1 hover:bg-slate-800/50 rounded px-1 transition-colors">
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <span>{e.icon}</span>
                                        <span>{e.name}</span>
                                    </div>
                                    <span className={`font-mono font-medium ${e.current > 0 ? 'text-emerald-500' :
                                        e.current < 0 ? 'text-rose-500' : 'text-slate-500'
                                        }`}>
                                        {formatMoney(e.current, false)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ACTIONS */}
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors disabled:opacity-50"
                    >
                        Anuluj
                    </button>
                    <button
                        onClick={async () => {
                            setIsSubmitting(true)
                            try {
                                // Wywołaj API zamknięcia miesiąca - przekaż obliczony bilans jako surplus
                                const response = await api.post('/api/close-month', {
                                    surplus: balance
                                })
                                if (response) {
                                    // API zwróciło sukces, teraz odśwież dashboard
                                    await onConfirm()
                                    onClose()
                                }
                            } catch (error) {
                                console.error('Błąd zamknięcia miesiąca:', error)
                            } finally {
                                setIsSubmitting(false)
                            }
                        }}
                        disabled={isSubmitting}
                        className={`flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${isSubmitting
                            ? 'bg-indigo-600/50 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
                            }`}
                    >
                        {isSubmitting ? '⏳ Przetwarzanie...' : '✓ Potwierdź i Zamknij'}
                    </button>
                </div>
            </div>
        </Modal>
    )
}