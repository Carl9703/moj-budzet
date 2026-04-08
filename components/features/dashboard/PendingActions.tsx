'use client'

import { useState, useEffect } from 'react'
import { api, authorizedFetch } from '@/lib/api/client'
import { useToast } from '@/components/ui/feedback/Toast'
import { motion, AnimatePresence } from 'framer-motion'

interface PendingAction {
    id: string
    name: string
    amount: number
    type: 'expense' | 'transfer'
    envelope: {
        id: string
        name: string
        icon: string
    } | null
    fromEnvelope: {
        id: string
        name: string
        icon: string
    } | null
    toEnvelope: {
        id: string
        name: string
        icon: string
    } | null
    category: string
    dayOfMonth: number
}

interface PendingActionsProps {
    onSuccess?: () => void
}

export function PendingActions({ onSuccess }: PendingActionsProps) {
    const [actions, setActions] = useState<PendingAction[]>([])
    const [loading, setLoading] = useState(true)
    const { showToast } = useToast()

    const fetchActions = async () => {
        try {
            setLoading(true)
            const response = await authorizedFetch('/api/dashboard/actions')
            const data = await response.json()
            if (data.actions) {
                setActions(data.actions)
            }
        } catch (error) {
            console.error('Error fetching pending actions:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchActions()
    }, [])

    const handleApprove = async (actionId: string) => {
        try {
            const response = await authorizedFetch(`/api/dashboard/actions/${actionId}/approve`, {
                method: 'POST'
            })
            const data = await response.json()

            if (response.ok) {
                showToast(data.message || 'Transakcja zatwierdzona', 'success')
                fetchActions()
                window.dispatchEvent(new CustomEvent('dashboardRefresh'))
            } else {
                showToast(data.error || 'Błąd zatwierdzania', 'error')
            }
        } catch (error) {
            console.error('Error approving action:', error)
            showToast('Błąd zatwierdzania transakcji', 'error')
        }
    }

    const handleReject = async (actionId: string) => {
        try {
            const response = await authorizedFetch(`/api/dashboard/actions/${actionId}/reject`, {
                method: 'POST'
            })
            const data = await response.json()

            if (response.ok) {
                showToast(data.message || 'Transakcja odrzucona', 'success')
                fetchActions()
                window.dispatchEvent(new CustomEvent('dashboardRefresh'))
            } else {
                showToast(data.error || 'Błąd odrzucania', 'error')
            }
        } catch (error) {
            console.error('Error rejecting action:', error)
            showToast('Błąd odrzucania transakcji', 'error')
        }
    }

    if (loading || actions.length === 0) {
        return null
    }

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 p-1"
        >
            <div
                className="p-5 rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-xl overflow-hidden relative"
            >
                {/* Background glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <h3 className="relative z-10 text-sm font-bold text-amber-300 mb-4 flex items-center gap-2 uppercase tracking-wide">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/15 text-amber-300">🔔</span>
                    Oczekujące Płatności ({actions.length})
                </h3>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <AnimatePresence mode="popLayout">
                        {actions.map((action) => (
                            <motion.div
                                key={action.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                className="p-5 rounded-2xl border border-white/10 flex flex-col justify-between group bg-zinc-950/40 backdrop-blur-sm transition-all hover:bg-zinc-900/60 shadow-xl"
                            >
                                <div className="mb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-black text-white group-hover:text-amber-300 transition-colors tracking-tight">
                                            {action.name}
                                        </div>
                                        <div className="text-sm font-black text-amber-400 tabular-nums">
                                            {action.amount.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} <span className="text-[10px] opacity-50">zł</span>
                                        </div>
                                    </div>

                                    {action.type === 'transfer' ? (
                                        <div className="flex items-center gap-2 p-3 bg-zinc-900/50 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="text-base flex-shrink-0">{action.fromEnvelope?.icon || '💰'}</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 truncate">{action.fromEnvelope?.name || 'Główne'}</span>
                                            </div>
                                            <span className="text-zinc-700 text-xs">→</span>
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="text-base flex-shrink-0">{action.toEnvelope?.icon || '📦'}</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 truncate">{action.toEnvelope?.name || 'Koperta'}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 p-3 bg-zinc-900/50 rounded-2xl border border-white/5">
                                            <span className="text-base flex-shrink-0">{action.envelope?.icon || '📦'}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 truncate">{action.envelope?.name || 'Koperta'}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-2 border-t border-white/5">
                                    <button
                                        onClick={() => handleApprove(action.id)}
                                        className="flex-1 py-3 px-3 bg-amber-500/15 text-amber-400 border border-amber-500/25 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all active:scale-95 shadow-lg shadow-amber-600/10"
                                    >
                                        Zatwierdź
                                    </button>
                                    <button
                                        onClick={() => handleReject(action.id)}
                                        className="py-3 px-3 bg-zinc-800/50 text-zinc-500 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-all active:scale-95"
                                    >
                                        Odrzuć
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    )
}
