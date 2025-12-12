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
                if (onSuccess) onSuccess()
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
                className="p-5 rounded-2xl border border-indigo-500/30 overflow-hidden relative"
                style={{
                    background: 'rgba(99, 102, 241, 0.05)',
                    backdropFilter: 'blur(10px)',
                }}
            >
                {/* Background glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <h3 className="relative z-10 text-sm font-bold text-indigo-300 mb-4 flex items-center gap-2 uppercase tracking-wide">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300">🔔</span>
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
                                className="p-4 rounded-xl border border-indigo-500/20 flex flex-col justify-between group hover:border-indigo-500/40 transition-colors"
                                style={{
                                    background: 'rgba(15, 23, 42, 0.6)',
                                }}
                            >
                                <div className="mb-3">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                                            {action.name}
                                        </div>
                                        <div className="text-sm font-bold text-indigo-400">
                                            {action.amount.toFixed(2)} zł
                                        </div>
                                    </div>

                                    {action.type === 'transfer' ? (
                                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-2 p-2 bg-slate-900/50 rounded-xl">
                                            <div className="flex items-center gap-1">
                                                <span>{action.fromEnvelope?.icon || '💰'}</span>
                                                <span className="truncate max-w-[80px]">{action.fromEnvelope?.name || 'Główne'}</span>
                                            </div>
                                            <span className="text-slate-600">→</span>
                                            <div className="flex items-center gap-1">
                                                <span>{action.toEnvelope?.icon || '📦'}</span>
                                                <span className="truncate max-w-[80px]">{action.toEnvelope?.name || 'Koperta'}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-2 p-2 bg-slate-900/50 rounded-xl">
                                            <span>{action.envelope?.icon || '📦'}</span>
                                            <span>{action.envelope?.name || 'Koperta'}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => handleApprove(action.id)}
                                        className="flex-1 py-2 px-3 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 transition-all active:scale-95"
                                    >
                                        Zatwierdź
                                    </button>
                                    <button
                                        onClick={() => handleReject(action.id)}
                                        className="py-2 px-3 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl text-xs font-semibold hover:bg-rose-900/20 hover:text-rose-400 hover:border-rose-900/50 transition-all active:scale-95"
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
