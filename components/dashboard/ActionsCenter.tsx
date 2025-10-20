'use client'

import { useState, useEffect } from 'react'
import { Check, X, Calendar, CreditCard, AlertCircle } from 'lucide-react'
import { authorizedFetch } from '@/lib/utils/api'
import { getCategoryIcon, getCategoryName } from '@/lib/constants/categories'

interface Action {
    id: string
    name: string
    amount: number
    envelope: {
        id: string
        name: string
        icon: string
    }
    category: string
    dayOfMonth: number
}

interface ActionsCenterProps {
    onActionCompleted?: () => void
}

export function ActionsCenter({ onActionCompleted }: ActionsCenterProps) {
    const [actions, setActions] = useState<Action[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

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

    useEffect(() => {
        fetchActions()
    }, [])

    const handleApprove = async (actionId: string) => {
        try {
            setProcessing(actionId)
            const response = await authorizedFetch(`/api/dashboard/actions/${actionId}/approve`, {
                method: 'POST'
            })
            const data = await response.json()

            if (data.success) {
                setMessage({ type: 'success', text: data.message })
                // Usuń akcję z listy
                setActions(prev => prev.filter(action => action.id !== actionId))
                onActionCompleted?.()
            } else {
                setMessage({ type: 'error', text: data.error || 'Błąd zatwierdzania płatności' })
            }
        } catch (error) {
            console.error('Error approving action:', error)
            setMessage({ type: 'error', text: 'Błąd zatwierdzania płatności' })
        } finally {
            setProcessing(null)
        }
    }

    const handleReject = async (actionId: string) => {
        try {
            setProcessing(actionId)
            const response = await authorizedFetch(`/api/dashboard/actions/${actionId}/reject`, {
                method: 'POST'
            })
            const data = await response.json()

            if (data.success) {
                setMessage({ type: 'success', text: data.message })
                // Usuń akcję z listy
                setActions(prev => prev.filter(action => action.id !== actionId))
            } else {
                setMessage({ type: 'error', text: data.error || 'Błąd odrzucania płatności' })
            }
        } catch (error) {
            console.error('Error rejecting action:', error)
            setMessage({ type: 'error', text: 'Błąd odrzucania płatności' })
        } finally {
            setProcessing(null)
        }
    }

    // Ukryj wiadomość po 3 sekundach
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 3000)
            return () => clearTimeout(timer)
        }
    }, [message])

    if (loading) {
        return (
            <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px solid var(--border-primary)',
                padding: '16px',
                marginBottom: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid var(--border-primary)',
                        borderTop: '2px solid var(--text-primary)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{ color: 'var(--text-secondary)' }}>Ładowanie akcji...</span>
                </div>
            </div>
        )
    }

    // Stan pusty - brak akcji na dziś
    if (actions.length === 0) {
        return (
            <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px solid var(--border-primary)',
                padding: '16px',
                marginBottom: '20px',
                textAlign: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Calendar size={20} style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>
                        Do zrobienia dzisiaj
                    </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                    Brak zaplanowanych akcji na dziś. Dobrej pracy! 🎉
                </p>
            </div>
        )
    }

    return (
        <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-md)',
            marginBottom: '20px',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                backgroundColor: 'var(--bg-tertiary)',
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <AlertCircle size={18} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    Do zrobienia dzisiaj ({actions.length})
                </span>
            </div>

            {/* Lista akcji */}
            <div style={{ padding: '16px' }}>
                {actions.map((action, index) => (
                    <div
                        key={action.id}
                        style={{
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '8px',
                            padding: '16px',
                            marginBottom: index < actions.length - 1 ? '12px' : '0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px'
                        }}
                    >
                        {/* Informacje o akcji */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <CreditCard size={16} style={{ color: 'var(--text-secondary)' }} />
                                <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>
                                    {action.name}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                <span style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>
                                    {action.amount.toFixed(2)} zł
                                </span>
                                <span>•</span>
                                <span>Z koperty: {action.envelope.icon} {action.envelope.name}</span>
                                <span>•</span>
                                <span>Kategoria: {getCategoryIcon(action.category)} {getCategoryName(action.category)}</span>
                            </div>
                        </div>

                        {/* Przyciski akcji */}
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                            <button
                                onClick={() => handleApprove(action.id)}
                                disabled={processing === action.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 12px',
                                    backgroundColor: 'var(--success-primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    cursor: processing === action.id ? 'not-allowed' : 'pointer',
                                    opacity: processing === action.id ? 0.6 : 1,
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <Check size={14} />
                                {processing === action.id ? 'Przetwarzanie...' : 'Zatwierdź'}
                            </button>
                            <button
                                onClick={() => handleReject(action.id)}
                                disabled={processing === action.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 12px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-primary)',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    cursor: processing === action.id ? 'not-allowed' : 'pointer',
                                    opacity: processing === action.id ? 0.6 : 1,
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <X size={14} />
                                Odrzuć
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toast message */}
            {message && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    backgroundColor: message.type === 'success' ? 'var(--success-primary)' : 'var(--error-primary)',
                    color: 'white',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 1000,
                    fontSize: '14px',
                    fontWeight: '500',
                    maxWidth: '300px'
                }}>
                    {message.text}
                </div>
            )}
        </div>
    )
}
