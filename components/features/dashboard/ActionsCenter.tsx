'use client'

import { useState, useEffect } from 'react'
import { Check, X, CreditCard, AlertCircle, ArrowRight } from 'lucide-react'
import { api, authorizedFetch } from '@/lib/api/client'
import { useCategories } from '@/lib/contexts/CategoryContext'

interface Action {
    id: string
    name: string
    amount: number
    type: 'expense' | 'transfer'
    envelope?: {
        id: string
        name: string
        icon: string
    }
    fromEnvelope?: {
        id: string
        name: string
        icon: string
    }
    toEnvelope?: {
        id: string
        name: string
        icon: string
    }
    category?: string
    dayOfMonth: number
}

interface ActionsCenterProps {
    onActionCompleted?: () => void
}

export function ActionsCenter({ onActionCompleted }: ActionsCenterProps) {
    const { getCategoryIcon, getCategoryName } = useCategories()
    const [actions, setActions] = useState<Action[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        const fetchActions = async () => {
            try {
                setLoading(true)
                const response = await authorizedFetch('/api/dashboard/actions')
                const data = await response.json()

                if (data.actions) {
                    setActions(data.actions)
                }
            } catch (error) {
                console.error('Error fetching actions:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchActions()
    }, [])

    const handleApprove = async (actionId: string) => {
        setProcessing(actionId)
        try {
            const response = await authorizedFetch(`/api/dashboard/actions/${actionId}/approve`, {
                method: 'POST'
            })
            const data = await response.json()

            if (data.success) {
                setMessage({ type: 'success', text: 'Akcja została wykonana!' })
                setActions(prev => prev.filter(action => action.id !== actionId))
                onActionCompleted?.()
            } else {
                setMessage({ type: 'error', text: data.error || 'Błąd wykonania akcji' })
            }
        } catch (error) {
            console.error('Error approving action:', error)
            setMessage({ type: 'error', text: 'Błąd wykonania akcji' })
        } finally {
            setProcessing(null)
        }
    }

    const handleDismiss = async (actionId: string) => {
        setProcessing(actionId)
        try {
            const response = await authorizedFetch(`/api/dashboard/actions/${actionId}/reject`, {
                method: 'POST'
            })
            const data = await response.json()

            if (data.success) {
                setMessage({ type: 'success', text: 'Akcja została odłożona' })
                setActions(prev => prev.filter(action => action.id !== actionId))
            } else {
                setMessage({ type: 'error', text: data.error || 'Błąd odłożenia akcji' })
            }
        } catch (error) {
            console.error('Error dismissing action:', error)
            setMessage({ type: 'error', text: 'Błąd odłożenia akcji' })
        } finally {
            setProcessing(null)
        }
    }

    if (loading) {
        return (
            <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg mb-6 p-8 flex items-center justify-center">
                <div className="spinner" />
            </div>
        )
    }

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg mb-6 overflow-hidden relative">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-4 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                        <AlertCircle size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-100 leading-tight">
                            Centrum Akcji
                        </h3>
                        <p className="text-sm text-slate-400 font-medium mt-0.5">
                            {actions.length} {actions.length === 1 ? 'zadanie' : 'zadań'} do wykonania
                        </p>
                    </div>
                </div>
                <div className="bg-indigo-600 text-white py-1.5 px-3 rounded-full text-xs font-bold shadow-lg shadow-indigo-600/30">
                    {actions.length}
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`py-2 px-4 border-b border-slate-700 text-sm font-medium flex items-center gap-2 ${message.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-red-500/10 text-red-400'
                    }`}>
                    <span>{message.type === 'success' ? '✅' : '❌'}</span>
                    {message.text}
                </div>
            )}

            {/* Actions list */}
            <div className="p-4">
                {actions.length === 0 ? (
                    <div className="text-center py-8 px-4 text-slate-400">
                        <div className="text-5xl mb-4 opacity-50">🎉</div>
                        <h4 className="text-base font-semibold text-slate-100 mb-2">
                            Wszystko gotowe!
                        </h4>
                        <p className="text-sm text-slate-400">
                            Brak zaplanowanych akcji na dziś. Dobrej pracy!
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {actions.map((action) => (
                            <div
                                key={action.id}
                                className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex items-start justify-between gap-4 hover:-translate-y-0.5 hover:shadow-lg transition-all"
                            >
                                {/* Left side - Content */}
                                <div className="flex-1 min-w-0">
                                    {/* Title row */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${action.type === 'transfer' ? 'bg-blue-500' : 'bg-amber-500'
                                            }`}>
                                            {action.type === 'transfer' ? (
                                                <span className="text-base">🔄</span>
                                            ) : (
                                                <CreditCard size={16} className="text-white" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-base font-semibold text-slate-100 leading-tight">
                                                {action.name}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-sm text-slate-400 font-medium">
                                                    {action.type === 'transfer' ? 'Transfer' : 'Wydatek'}
                                                </span>
                                                <span className="text-slate-600">•</span>
                                                <span className="text-sm text-slate-400">
                                                    Dzień {action.dayOfMonth}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details row */}
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {/* Amount */}
                                        <div className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-800 rounded-full border border-slate-700">
                                            <span className="text-sm font-bold text-indigo-400">
                                                {action.amount.toFixed(2)} zł
                                            </span>
                                        </div>

                                        {/* Transfer/expense details */}
                                        {action.type === 'transfer' ? (
                                            <div className="flex items-center gap-2 py-1.5 px-3 bg-blue-500/10 rounded-full border border-blue-500/30">
                                                <span className="text-sm">{action.fromEnvelope?.icon}</span>
                                                <span className="text-sm font-medium text-blue-400">
                                                    {action.fromEnvelope?.name}
                                                </span>
                                                <ArrowRight size={12} className="text-slate-500" />
                                                <span className="text-sm">{action.toEnvelope?.icon}</span>
                                                <span className="text-sm font-medium text-blue-400">
                                                    {action.toEnvelope?.name}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 py-1.5 px-3 bg-amber-500/10 rounded-full border border-amber-500/30">
                                                <span className="text-sm">{action.envelope?.icon}</span>
                                                <span className="text-sm font-medium text-amber-400">
                                                    {action.envelope?.name}
                                                </span>
                                                <span className="text-slate-600">•</span>
                                                <span className="text-sm text-slate-400">
                                                    {getCategoryIcon(action.category || '')} {getCategoryName(action.category || '')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right side - Actions */}
                                <div className="flex gap-2 flex-shrink-0 items-start">
                                    <button
                                        onClick={() => handleApprove(action.id)}
                                        disabled={processing === action.id}
                                        className={`flex items-center gap-1.5 py-2.5 px-4 bg-emerald-500 text-white border-none rounded-md text-sm font-semibold min-w-[100px] justify-center shadow-lg shadow-emerald-500/30 transition-all ${processing === action.id
                                            ? 'cursor-not-allowed opacity-70'
                                            : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-emerald-500/40'
                                            }`}
                                    >
                                        {processing === action.id ? (
                                            <div className="spinner w-3.5 h-3.5" />
                                        ) : (
                                            <Check size={16} />
                                        )}
                                        Wykonaj
                                    </button>
                                    <button
                                        onClick={() => handleDismiss(action.id)}
                                        disabled={processing === action.id}
                                        className={`flex items-center gap-1.5 py-2.5 px-4 bg-slate-700 text-slate-300 border border-slate-600 rounded-md text-sm font-semibold min-w-[100px] justify-center transition-all ${processing === action.id
                                            ? 'cursor-not-allowed opacity-70'
                                            : 'cursor-pointer hover:bg-slate-600 hover:border-indigo-500 hover:text-indigo-400'
                                            }`}
                                    >
                                        <X size={16} />
                                        Odłóż
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}