'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Info } from 'lucide-react'
import { api } from '@/lib/api/client'

interface AddInvestmentModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function AddInvestmentModal({ isOpen, onClose, onSuccess }: AddInvestmentModalProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        symbol: '',
        quantity: '',
        averagePurchasePrice: '',
        totalContributed: '',
        manualCurrentValue: '',
        type: 'STOCK' as 'STOCK' | 'CRYPTO' | 'PPK'
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // Prepare payload based on type
            const payload: any = {
                symbol: formData.symbol,
                type: formData.type,
            }

            if (formData.type === 'PPK') {
                payload.quantity = 1
                payload.manualCurrentValue = parseFloat(formData.manualCurrentValue)
                payload.totalContributed = parseFloat(formData.totalContributed)
                // For PPK, cost basis is totalContributed
                payload.averagePurchasePrice = parseFloat(formData.totalContributed)
            } else {
                payload.quantity = parseFloat(formData.quantity)
                payload.averagePurchasePrice = parseFloat(formData.averagePurchasePrice)
            }

            await api.post('/api/investments', formData)
            onSuccess()
            onClose()
            setFormData({
                symbol: '',
                quantity: '',
                averagePurchasePrice: '',
                totalContributed: '',
                manualCurrentValue: '',
                type: 'STOCK'
            })
        } catch (err: any) {
            setError(err.data?.error || err.message || 'Failed to add investment')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90dvh]"
                >
                    <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Nowe Aktywo</h2>
                        <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm flex items-center gap-2">
                                <Info size={16} />
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Typ Aktywa</label>
                            <div className="flex gap-2 p-1 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'STOCK' })}
                                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${formData.type === 'STOCK' ? 'bg-amber-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    Stock / ETF
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'CRYPTO' })}
                                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${formData.type === 'CRYPTO' ? 'bg-amber-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    Krypto
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'PPK' })}
                                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${formData.type === 'PPK' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    PPK
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                                {formData.type === 'PPK' ? 'Nazwa Funduszu' : 'Ticker / Symbol'}
                            </label>
                            <input
                                required
                                type="text"
                                placeholder={formData.type === 'PPK' ? 'np. NN PPK' : formData.type === 'STOCK' ? 'np. AAPL, VWCE.DE' : 'np. BTC, ETH'}
                                value={formData.symbol}
                                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                            />
                        </div>

                        {formData.type === 'PPK' ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Aktualna Wartość</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.manualCurrentValue}
                                        onChange={(e) => setFormData({ ...formData, manualCurrentValue: e.target.value })}
                                        className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Twoje Wpłaty</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.totalContributed}
                                        onChange={(e) => setFormData({ ...formData, totalContributed: e.target.value })}
                                        className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Ilość</label>
                                    <input
                                        required
                                        type="number"
                                        step="any"
                                        placeholder="0.00"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                        className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Średnia Cena (PLN)</label>
                                    <input
                                        required
                                        type="number"
                                        step="any"
                                        placeholder="0.00"
                                        value={formData.averagePurchasePrice}
                                        onChange={(e) => setFormData({ ...formData, averagePurchasePrice: e.target.value })}
                                        className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-amber-600/20 active:scale-95 flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Dodaj do Portfela'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    , document.body)
}
