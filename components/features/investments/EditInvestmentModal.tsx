'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Info } from 'lucide-react'
import { api } from '@/lib/api/client'

interface EditInvestmentModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    investment: {
        id: string
        symbol: string
        quantity: number
        averagePurchasePrice: number
        totalContributed?: number
        manualCurrentValue?: number
        type: 'STOCK' | 'CRYPTO' | 'PPK'
        subPositions?: any[]
    } | null
}

export function EditInvestmentModal({ isOpen, onClose, onSuccess, investment }: EditInvestmentModalProps) {
    const [formData, setFormData] = useState({
        symbol: '',
        quantity: '',
        averagePurchasePrice: '',
        totalContributed: '',
        manualCurrentValue: '',
        type: 'STOCK' as 'STOCK' | 'CRYPTO' | 'PPK'
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (investment) {
            setFormData({
                symbol: investment.symbol,
                quantity: String(investment.quantity),
                averagePurchasePrice: String(investment.averagePurchasePrice),
                totalContributed: investment.totalContributed ? String(investment.totalContributed) : '',
                manualCurrentValue: investment.manualCurrentValue ? String(investment.manualCurrentValue) : '',
                type: investment.type
            })
        }
    }, [investment])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!investment) return

        setLoading(true)
        setError(null)

        try {
            const payload: any = {
                symbol: formData.symbol,
                type: formData.type,
            }

            if (formData.type === 'PPK') {
                payload.quantity = 1
                payload.manualCurrentValue = parseFloat(formData.manualCurrentValue)
                payload.totalContributed = parseFloat(formData.totalContributed)
                payload.averagePurchasePrice = parseFloat(formData.totalContributed) // Cost basis
            } else {
                payload.quantity = parseFloat(formData.quantity)
                payload.averagePurchasePrice = parseFloat(formData.averagePurchasePrice)
            }

            await api.patch(`/api/investments/${investment.id}`, payload)
            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.data?.error || err.message || 'Nie udało się zaktualizować inwestycji')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen || !investment) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
                >
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Edytuj Inwestycję</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-slate-400 text-sm font-medium mb-2">
                                {formData.type === 'PPK' ? 'Nazwa Funduszu' : 'Ticker'}
                            </label>
                            <input
                                type="text"
                                value={formData.symbol}
                                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
                                placeholder={formData.type === 'PPK' ? 'np. NN PPK' : 'BTC, AAPL, VWCE...'}
                                required
                            />
                        </div>

                        {formData.type === 'PPK' ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-400 text-sm font-medium mb-2">Aktualna Wartość</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.manualCurrentValue}
                                        onChange={(e) => setFormData({ ...formData, manualCurrentValue: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
                                        placeholder="10000"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-sm font-medium mb-2">Twoje Wpłaty</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.totalContributed}
                                        onChange={(e) => setFormData({ ...formData, totalContributed: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
                                        placeholder="5000"
                                        required
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-slate-400 text-sm font-medium mb-2">Ilość</label>
                                    <input
                                        type="number"
                                        step="0.00000001"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
                                        placeholder="0.5"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-400 text-sm font-medium mb-2">Średnia Cena Zakupu (PLN)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.averagePurchasePrice}
                                        onChange={(e) => setFormData({ ...formData, averagePurchasePrice: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
                                        placeholder="50000"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-slate-400 text-sm font-medium mb-2">Typ</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'STOCK' })}
                                    className={`px-4 py-3 rounded-xl font-bold transition-all border ${formData.type === 'STOCK'
                                        ? 'bg-indigo-600 border-indigo-500 text-white'
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                                        }`}
                                >
                                    Akcje/ETF
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'CRYPTO' })}
                                    className={`px-4 py-3 rounded-xl font-bold transition-all border ${formData.type === 'CRYPTO'
                                        ? 'bg-amber-600 border-amber-500 text-white'
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                                        }`}
                                >
                                    Krypto
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'PPK' })}
                                    className={`px-4 py-3 rounded-xl font-bold transition-all border ${formData.type === 'PPK'
                                        ? 'bg-emerald-600 border-emerald-500 text-white'
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                                        }`}
                                >
                                    PPK
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-bold transition-all active:scale-95"
                            >
                                Anuluj
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Zapisz'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
