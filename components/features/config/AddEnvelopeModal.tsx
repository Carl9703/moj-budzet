'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, Plus } from 'lucide-react'
import { ENVELOPE_TYPES } from '@/lib/constants/envelopeTypes'

const SUPPORTED_CURRENCIES = ['PLN', 'EUR', 'GBP', 'USD', 'CHF', 'NOK', 'CZK', 'HUF'] as const
const CURRENCY_FLAGS: Record<string, string> = {
    PLN: '🇵🇱', EUR: '🇪🇺', GBP: '🇬🇧', USD: '🇺🇸',
    CHF: '🇨🇭', NOK: '🇳🇴', CZK: '🇨🇿', HUF: '🇭🇺',
}

interface ParentEnvelope {
    id: string
    name: string
    icon: string | null
}

interface AddEnvelopeModalProps {
    isOpen: boolean
    onClose: () => void
    onAdd: (data: any) => Promise<void>
    initialGroup?: string
    parentEnvelopes?: ParentEnvelope[]
}

export function AddEnvelopeModal({ isOpen, onClose, onAdd, initialGroup, parentEnvelopes = [] }: AddEnvelopeModalProps) {
    const [name, setName] = useState('')
    const [icon, setIcon] = useState('📦')
    const [type, setType] = useState<'monthly' | 'yearly'>('monthly')
    const [group, setGroup] = useState(initialGroup || 'needs')
    const [plannedAmount, setPlannedAmount] = useState('')
    const [isAccumulating, setIsAccumulating] = useState(false)
    const [currencyCode, setCurrencyCode] = useState('PLN')
    const [parentEnvelopeId, setParentEnvelopeId] = useState('')
    const [loading, setLoading] = useState(false)

    const isForeignCurrency = currencyCode !== 'PLN'

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
                plannedAmount: Number(plannedAmount) || 0,
                currencyCode,
                parentEnvelopeId: isForeignCurrency && parentEnvelopeId ? parentEnvelopeId : undefined,
            })
            onClose()
            setName('')
            setIcon('📦')
            setPlannedAmount('')
            setCurrencyCode('PLN')
            setParentEnvelopeId('')
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="glass-card w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-white/10"
            >
                {/* Header */}
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">
                            {icon}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Nowa Koperta</h2>
                            <p className="text-xs text-zinc-400">
                                {isForeignCurrency ? `Sub-koperta walutowa (${currencyCode})` : 'Utwórz nową kopertę budżetową'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-zinc-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-zinc-900/20">
                    <div className="space-y-4">
                        {/* Icon & Name */}
                        <div className="flex gap-3 items-start">
                            <div className="w-20">
                                <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider text-center">Ikona</label>
                                <div className="bg-zinc-800/30 p-1.5 rounded-xl border border-zinc-700/50 flex justify-center">
                                    <input
                                        value={icon}
                                        onChange={e => setIcon(e.target.value)}
                                        className="w-full bg-transparent text-2xl text-center focus:outline-none"
                                        placeholder="📦"
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Nazwa koperty</label>
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-zinc-800/30 border border-zinc-700/50 rounded-xl px-3 py-3 text-base font-bold text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 transition-all"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Limit */}
                        <div className={`py-3 px-4 rounded-xl border transition-all ${Number(plannedAmount) > 0
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-zinc-800/30 border-zinc-700/50'}`}>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 text-center">
                                {type === 'monthly' ? 'Miesięczny Limit' : 'Cel Oszczędności'}
                            </label>
                            <div className="relative flex items-baseline justify-center">
                                <input
                                    type="number"
                                    value={plannedAmount}
                                    onChange={e => setPlannedAmount(e.target.value)}
                                    className="w-full bg-transparent text-3xl font-black text-center text-white placeholder:text-zinc-700 focus:outline-none"
                                    placeholder="0"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-600">
                                    {currencyCode}
                                </span>
                            </div>
                        </div>

                        {/* Settings Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Group */}
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Grupa</label>
                                <div className="relative">
                                    <select
                                        value={group}
                                        onChange={e => setGroup(e.target.value)}
                                        className="w-full appearance-none bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-amber-500/50"
                                    >
                                        <option value="needs">🏡 Potrzeby</option>
                                        <option value="lifestyle">🎉 Styl Życia</option>
                                        <option value="assets">💎 Cele i Majątek</option>
                                        <option value="Portfele Walutowe">💱 Portfele Walutowe</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-xs">▼</div>
                                </div>
                            </div>

                            {/* Type - Segmented */}
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Typ</label>
                                <div className="flex bg-zinc-800/50 p-1 rounded-xl border border-zinc-700/50 relative">
                                    <button
                                        type="button"
                                        onClick={() => setType('monthly')}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all relative z-10 ${type === 'monthly' ? 'text-white' : 'text-zinc-400'}`}
                                    >
                                        Miesięczna
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType('yearly')}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all relative z-10 ${type === 'yearly' ? 'text-white' : 'text-zinc-400'}`}
                                    >
                                        Roczna
                                    </button>
                                    <div className={`absolute top-1 bottom-1 rounded-xl bg-amber-600 transition-all duration-300 ${type === 'monthly' ? 'left-1 right-[50%]' : 'left-[50%] right-1'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Currency Selector */}
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Waluta koperty</label>
                            <div className="flex flex-wrap gap-2">
                                {SUPPORTED_CURRENCIES.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => {
                                            setCurrencyCode(c)
                                            if (c === 'PLN') setParentEnvelopeId('')
                                        }}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                                            currencyCode === c
                                                ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                                                : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                                        }`}
                                    >
                                        <span>{CURRENCY_FLAGS[c]}</span>
                                        <span>{c}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Parent Envelope (only for foreign currency) */}
                        {isForeignCurrency && parentEnvelopes.length > 0 && (
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">
                                    Koperta nadrzędna (PLN) — opcjonalnie
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setParentEnvelopeId('')}
                                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                                            !parentEnvelopeId
                                                ? 'bg-zinc-600/30 border-zinc-500/50 text-zinc-300'
                                                : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-500 hover:border-zinc-600'
                                        }`}
                                    >
                                        Brak
                                    </button>
                                    {parentEnvelopes.map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setParentEnvelopeId(p.id)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                                                parentEnvelopeId === p.id
                                                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                                                    : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                                            }`}
                                        >
                                            <span>{p.icon || '📦'}</span>
                                            <span>{p.name}</span>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-zinc-600 mt-1.5 px-1">
                                    Łączy tę kopertę z kopertą PLN do analityki i transferów.
                                </p>
                            </div>
                        )}

                        {/* Accumulating Toggle */}
                        <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isAccumulating
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-zinc-800/30 border-zinc-700/50'}`}>
                            <div className="flex-1 pr-3">
                                <div className={`font-bold text-sm ${isAccumulating ? 'text-amber-400' : 'text-zinc-300'}`}>
                                    Koperta Akumulująca
                                </div>
                                <div className="text-[10px] text-zinc-500">
                                    Środki przechodzą na kolejny miesiąc
                                </div>
                            </div>
                            <div className={`w-10 h-6 rounded-full relative transition-colors ${isAccumulating ? 'bg-amber-500' : 'bg-zinc-700'}`}>
                                <input type="checkbox" checked={isAccumulating} onChange={e => setIsAccumulating(e.target.checked)} className="sr-only" />
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isAccumulating ? 'left-5' : 'left-1'}`} />
                            </div>
                        </label>

                        {/* Actions */}
                        <div className="pt-2 flex gap-2">
                            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 text-sm font-semibold transition-colors">
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
        </div>,
        document.body
    )
}
