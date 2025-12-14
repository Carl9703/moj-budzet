'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Plus } from 'lucide-react'
import { ENVELOPE_TYPES } from '@/lib/constants/envelopeTypes'

interface AddEnvelopeModalProps {
    isOpen: boolean
    onClose: () => void
    onAdd: (data: any) => Promise<void>
    initialGroup?: string
}

export function AddEnvelopeModal({ isOpen, onClose, onAdd, initialGroup }: AddEnvelopeModalProps) {
    const [name, setName] = useState('')
    const [icon, setIcon] = useState('📦')
    const [type, setType] = useState<'monthly' | 'yearly'>('monthly')
    const [group, setGroup] = useState(initialGroup || 'needs')
    const [plannedAmount, setPlannedAmount] = useState('')
    const [isAccumulating, setIsAccumulating] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setLoading(true)
        try {
            await onAdd({
                name,
                icon,
                type,
                group,
                envelopeType: type === 'yearly' ? ENVELOPE_TYPES.GOAL : ENVELOPE_TYPES.BUDGET,
                isAccumulating,
                plannedAmount: Number(plannedAmount) || 0
            })
            onClose()
            setName('')
            setIcon('📦')
            setPlannedAmount('')
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="glass-card w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-white/10"
            >
                {/* Header */}
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">
                            {icon}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Nowa Koperta</h2>
                            <p className="text-xs text-slate-400">Utwórz nową kopertę budżetową</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-900/20">
                    <div className="space-y-4">
                        {/* Icon & Name */}
                        <div className="flex gap-3 items-start">
                            <div className="w-20">
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider text-center">Ikona</label>
                                <div className="bg-slate-800/30 p-1.5 rounded-xl border border-slate-700/50 flex justify-center">
                                    <input
                                        value={icon}
                                        onChange={e => setIcon(e.target.value)}
                                        className="w-full bg-transparent text-2xl text-center focus:outline-none"
                                        placeholder="📦"
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Nazwa koperty</label>
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-slate-800/30 border border-slate-700/50 rounded-xl px-3 py-3 text-base font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Limit */}
                        <div className={`py-3 px-4 rounded-xl border transition-all ${Number(plannedAmount) > 0
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-slate-800/30 border-slate-700/50'}`}>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-center">
                                {type === 'monthly' ? 'Miesięczny Limit' : 'Cel Oszczędności'}
                            </label>
                            <div className="relative flex items-baseline justify-center">
                                <input
                                    type="number"
                                    value={plannedAmount}
                                    onChange={e => setPlannedAmount(e.target.value)}
                                    className="w-full bg-transparent text-3xl font-black text-center text-white placeholder:text-slate-700 focus:outline-none"
                                    placeholder="0"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-600">PLN</span>
                            </div>
                        </div>

                        {/* Settings Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Group */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Grupa</label>
                                <div className="relative">
                                    <select
                                        value={group}
                                        onChange={e => setGroup(e.target.value)}
                                        className="w-full appearance-none bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-indigo-500/50"
                                    >
                                        <option value="needs">🏡 Potrzeby</option>
                                        <option value="lifestyle">🎉 Styl Życia</option>
                                        <option value="assets">💎 Cele i Majątek</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                                </div>
                            </div>

                            {/* Type - Segmented */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Typ</label>
                                <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 relative">
                                    <button
                                        type="button"
                                        onClick={() => setType('monthly')}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all relative z-10 ${type === 'monthly' ? 'text-white' : 'text-slate-400'}`}
                                    >
                                        Miesięczna
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType('yearly')}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all relative z-10 ${type === 'yearly' ? 'text-white' : 'text-slate-400'}`}
                                    >
                                        Roczna
                                    </button>
                                    <div className={`absolute top-1 bottom-1 rounded-xl bg-indigo-600 transition-all duration-300 ${type === 'monthly' ? 'left-1 right-[50%]' : 'left-[50%] right-1'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Accumulating Toggle */}
                        <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isAccumulating
                            ? 'bg-indigo-500/10 border-indigo-500/30'
                            : 'bg-slate-800/30 border-slate-700/50'}`}>
                            <div className="flex-1 pr-3">
                                <div className={`font-bold text-sm ${isAccumulating ? 'text-indigo-400' : 'text-slate-300'}`}>
                                    Koperta Akumulująca
                                </div>
                                <div className="text-[10px] text-slate-500">
                                    Środki przechodzą na kolejny miesiąc
                                </div>
                            </div>
                            <div className={`w-10 h-6 rounded-full relative transition-colors ${isAccumulating ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                                <input type="checkbox" checked={isAccumulating} onChange={e => setIsAccumulating(e.target.checked)} className="sr-only" />
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isAccumulating ? 'left-5' : 'left-1'}`} />
                            </div>
                        </label>

                        {/* Actions */}
                        <div className="pt-2 flex gap-2">
                            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 text-sm font-semibold transition-colors">
                                Anuluj
                            </button>
                            <button
                                type="submit"
                                disabled={!name.trim() || loading}
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
                                Stwórz kopertę
                            </button>
                        </div>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
