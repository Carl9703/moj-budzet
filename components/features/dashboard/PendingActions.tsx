'use client'

import { useState, useEffect } from 'react'
import { authorizedFetch } from '@/lib/utils/api'
import { useToast } from '@/components/ui/feedback/Toast'

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

export function PendingActions() {
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
                fetchActions() // Odśwież listę
                // Odśwież dashboard
                window.location.reload()
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
                fetchActions() // Odśwież listę
            } else {
                showToast(data.error || 'Błąd odrzucania', 'error')
            }
        } catch (error) {
            console.error('Error rejecting action:', error)
            showToast('Błąd odrzucania transakcji', 'error')
        }
    }

    if (loading) {
        return null
    }

    if (actions.length === 0) {
        return null
    }

    return (
        <div style={{
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: 'rgba(79, 70, 229, 0.1)', // indigo-900/20
            border: '1px solid rgba(79, 70, 229, 0.3)', // indigo-500/50
            borderRadius: '12px'
        }}>
            <h3 style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#a5b4fc', // indigo-300
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <span>🔔</span> Oczekujące Płatności Automatyczne ({actions.length})
            </h3>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '12px'
            }}>
                {actions.map((action) => (
                    <div 
                        key={action.id}
                        style={{
                            padding: '12px',
                            backgroundColor: '#0f172a', // slate-900
                            borderRadius: '8px',
                            border: '1px solid rgba(79, 70, 229, 0.2)', // indigo-500/30
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontSize: '13px',
                                fontWeight: '700',
                                color: '#f1f5f9', // white
                                marginBottom: '4px'
                            }}>
                                {action.name}
                            </div>
                            <div style={{
                                fontSize: '12px',
                                color: '#818cf8', // indigo-400
                                marginBottom: '4px'
                            }}>
                                {action.amount.toFixed(2)} PLN
                            </div>
                            {action.type === 'transfer' ? (
                                <div style={{
                                    fontSize: '11px',
                                    color: '#64748b', // slate-500
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <span>{action.fromEnvelope?.icon || '💰'}</span>
                                    <span>{action.fromEnvelope?.name || 'Główne saldo'}</span>
                                    <span>→</span>
                                    <span>{action.toEnvelope?.icon || '📦'}</span>
                                    <span>{action.toEnvelope?.name || 'Koperta'}</span>
                                </div>
                            ) : (
                                <div style={{
                                    fontSize: '11px',
                                    color: '#64748b', // slate-500
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <span>{action.envelope?.icon || '📦'}</span>
                                    <span>{action.envelope?.name || 'Koperta'}</span>
                                </div>
                            )}
                        </div>
                        <div style={{
                            display: 'flex',
                            gap: '6px',
                            marginLeft: '12px'
                        }}>
                            <button
                                onClick={() => handleApprove(action.id)}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#4f46e5', // indigo-600
                                    color: '#f1f5f9', // white
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#6366f1' // indigo-500
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#4f46e5' // indigo-600
                                }}
                            >
                                Zatwierdź
                            </button>
                            <button
                                onClick={() => handleReject(action.id)}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#1e293b', // slate-800
                                    color: '#94a3b8', // slate-400
                                    border: '1px solid #334155', // slate-700
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#334155' // slate-700
                                    e.currentTarget.style.color = '#f1f5f9' // slate-100
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#1e293b' // slate-800
                                    e.currentTarget.style.color = '#94a3b8' // slate-400
                                }}
                            >
                                Odrzuć
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

