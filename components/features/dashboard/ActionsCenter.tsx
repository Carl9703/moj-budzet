'use client'

import { useState, useEffect } from 'react'
import { Check, X, Calendar, CreditCard, AlertCircle, ArrowRight } from 'lucide-react'
import { authorizedFetch } from '@/lib/utils/api'
import { getCategoryIcon, getCategoryName } from '@/lib/constants/categories'

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
            const response = await authorizedFetch(`/api/dashboard/actions/${actionId}/dismiss`, {
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
            <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--border-radius-large)',
                border: '1px solid var(--border-primary)',
                boxShadow: 'var(--shadow-md)',
                marginBottom: 'var(--space-l)',
                padding: 'var(--space-2xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div className="spinner" />
            </div>
        )
    }

    return (
        <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--border-radius-large)',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-lg)',
            marginBottom: 'var(--space-l)',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Header z gradientem */}
            <div style={{
                background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%)',
                padding: 'var(--space-l)',
                borderBottom: '1px solid var(--border-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)'
                    }}>
                        <AlertCircle size={20} style={{ color: 'white' }} />
                    </div>
                    <div>
                        <h3 style={{ 
                            fontSize: 'var(--font-size-l)', 
                            fontWeight: 'var(--font-weight-bold)', 
                            color: 'var(--text-primary)',
                            margin: 0,
                            lineHeight: 1.2
                        }}>
                            Centrum Akcji
                        </h3>
                        <p style={{ 
                            fontSize: 'var(--font-size-s)', 
                            color: 'var(--text-secondary)',
                            margin: '2px 0 0 0',
                            fontWeight: 'var(--font-weight-medium)'
                        }}>
                            {actions.length} {actions.length === 1 ? 'zadanie' : 'zadań'} do wykonania
                        </p>
                    </div>
                </div>
                <div style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-bold)',
                    boxShadow: '0 2px 8px rgba(74, 144, 226, 0.3)'
                }}>
                    {actions.length}
                </div>
            </div>

            {/* Message */}
            {message && (
                <div style={{
                    padding: 'var(--space-s) var(--space-l)',
                    backgroundColor: message.type === 'success' ? 'var(--color-success-light)' : 'var(--color-error-light)',
                    color: message.type === 'success' ? 'var(--color-success-dark)' : 'var(--color-error-dark)',
                    borderBottom: '1px solid var(--border-primary)',
                    fontSize: 'var(--font-size-s)',
                    fontWeight: 'var(--font-weight-medium)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-s)'
                }}>
                    <span>{message.type === 'success' ? '✅' : '❌'}</span>
                    {message.text}
                </div>
            )}

            {/* Lista akcji */}
            <div style={{ padding: 'var(--space-l)' }}>
                {actions.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: 'var(--space-2xl) var(--space-l)',
                        color: 'var(--text-secondary)'
                    }}>
                        <div style={{
                            fontSize: '48px',
                            marginBottom: 'var(--space-m)',
                            opacity: 0.5
                        }}>
                            🎉
                        </div>
                        <h4 style={{
                            fontSize: 'var(--font-size-m)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--text-primary)',
                            margin: '0 0 var(--space-s) 0'
                        }}>
                            Wszystko gotowe!
                        </h4>
                        <p style={{
                            fontSize: 'var(--font-size-s)',
                            color: 'var(--text-secondary)',
                            margin: 0
                        }}>
                            Brak zaplanowanych akcji na dziś. Dobrej pracy!
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-m)' }}>
                        {actions.map((action, index) => (
                            <div
                                key={action.id}
                                style={{
                                    backgroundColor: 'var(--bg-primary)',
                                    border: '1px solid var(--border-primary)',
                                    borderRadius: 'var(--border-radius-main)',
                                    padding: 'var(--space-l)',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between',
                                    gap: 'var(--space-l)',
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = 'none'
                                }}
                            >
                                {/* Left side - Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {/* Title row */}
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 'var(--space-s)',
                                        marginBottom: 'var(--space-s)'
                                    }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            backgroundColor: action.type === 'transfer' ? 'var(--color-info)' : 'var(--color-warning)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            {action.type === 'transfer' ? (
                                                <span style={{ fontSize: '16px' }}>🔄</span>
                                            ) : (
                                                <CreditCard size={16} style={{ color: 'white' }} />
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h4 style={{ 
                                                fontSize: 'var(--font-size-m)', 
                                                fontWeight: 'var(--font-weight-semibold)', 
                                                color: 'var(--text-primary)',
                                                margin: 0,
                                                lineHeight: 1.3
                                            }}>
                                                {action.name}
                                            </h4>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--space-s)',
                                                marginTop: '4px'
                                            }}>
                                                <span style={{
                                                    fontSize: 'var(--font-size-s)',
                                                    color: 'var(--text-secondary)',
                                                    fontWeight: 'var(--font-weight-medium)'
                                                }}>
                                                    {action.type === 'transfer' ? 'Transfer' : 'Wydatek'}
                                                </span>
                                                <span style={{ color: 'var(--text-disabled)' }}>•</span>
                                                <span style={{
                                                    fontSize: 'var(--font-size-s)',
                                                    color: 'var(--text-secondary)'
                                                }}>
                                                    Dzień {action.dayOfMonth}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details row */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-m)',
                                        flexWrap: 'wrap'
                                    }}>
                                        {/* Amount */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 12px',
                                            backgroundColor: 'var(--bg-tertiary)',
                                            borderRadius: '20px',
                                            border: '1px solid var(--border-primary)'
                                        }}>
                                            <span style={{
                                                fontSize: 'var(--font-size-s)',
                                                fontWeight: 'var(--font-weight-bold)',
                                                color: 'var(--accent-primary)'
                                            }}>
                                                {action.amount.toFixed(2)} zł
                                            </span>
                                        </div>

                                        {/* Transfer details */}
                                        {action.type === 'transfer' ? (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--space-s)',
                                                padding: '6px 12px',
                                                backgroundColor: 'var(--color-info-light)',
                                                borderRadius: '20px',
                                                border: '1px solid var(--color-info)'
                                            }}>
                                                <span style={{ fontSize: '14px' }}>{action.fromEnvelope?.icon}</span>
                                                <span style={{ 
                                                    fontSize: 'var(--font-size-s)', 
                                                    fontWeight: 'var(--font-weight-medium)',
                                                    color: 'var(--color-info-dark)'
                                                }}>
                                                    {action.fromEnvelope?.name}
                                                </span>
                                                <ArrowRight size={12} style={{ color: 'var(--text-disabled)' }} />
                                                <span style={{ fontSize: '14px' }}>{action.toEnvelope?.icon}</span>
                                                <span style={{ 
                                                    fontSize: 'var(--font-size-s)', 
                                                    fontWeight: 'var(--font-weight-medium)',
                                                    color: 'var(--color-info-dark)'
                                                }}>
                                                    {action.toEnvelope?.name}
                                                </span>
                                            </div>
                                        ) : (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--space-s)',
                                                padding: '6px 12px',
                                                backgroundColor: 'var(--color-warning-light)',
                                                borderRadius: '20px',
                                                border: '1px solid var(--color-warning)'
                                            }}>
                                                <span style={{ fontSize: '14px' }}>{action.envelope?.icon}</span>
                                                <span style={{ 
                                                    fontSize: 'var(--font-size-s)', 
                                                    fontWeight: 'var(--font-weight-medium)',
                                                    color: 'var(--color-warning-dark)'
                                                }}>
                                                    {action.envelope?.name}
                                                </span>
                                                <span style={{ color: 'var(--text-disabled)' }}>•</span>
                                                <span style={{ 
                                                    fontSize: 'var(--font-size-s)', 
                                                    color: 'var(--text-secondary)'
                                                }}>
                                                    {getCategoryIcon(action.category)} {getCategoryName(action.category)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right side - Actions */}
                                <div style={{ 
                                    display: 'flex', 
                                    gap: 'var(--space-s)', 
                                    flexShrink: 0,
                                    alignItems: 'flex-start'
                                }}>
                                    <button
                                        onClick={() => handleApprove(action.id)}
                                        disabled={processing === action.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '10px 16px',
                                            backgroundColor: 'var(--color-success)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: 'var(--border-radius-small)',
                                            fontSize: 'var(--font-size-s)',
                                            fontWeight: 'var(--font-weight-semibold)',
                                            cursor: processing === action.id ? 'not-allowed' : 'pointer',
                                            opacity: processing === action.id ? 0.7 : 1,
                                            transition: 'all 0.2s ease',
                                            boxShadow: '0 2px 8px rgba(46, 204, 113, 0.3)',
                                            minWidth: '100px',
                                            justifyContent: 'center'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (processing !== action.id) {
                                                e.currentTarget.style.transform = 'translateY(-1px)'
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 204, 113, 0.4)'
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (processing !== action.id) {
                                                e.currentTarget.style.transform = 'translateY(0)'
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(46, 204, 113, 0.3)'
                                            }
                                        }}
                                    >
                                        {processing === action.id ? (
                                            <div className="spinner" style={{ width: '14px', height: '14px' }} />
                                        ) : (
                                            <Check size={16} />
                                        )}
                                        Wykonaj
                                    </button>
                                    <button
                                        onClick={() => handleDismiss(action.id)}
                                        disabled={processing === action.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '10px 16px',
                                            backgroundColor: 'var(--bg-tertiary)',
                                            color: 'var(--text-secondary)',
                                            border: '1px solid var(--border-primary)',
                                            borderRadius: 'var(--border-radius-small)',
                                            fontSize: 'var(--font-size-s)',
                                            fontWeight: 'var(--font-weight-semibold)',
                                            cursor: processing === action.id ? 'not-allowed' : 'pointer',
                                            opacity: processing === action.id ? 0.7 : 1,
                                            transition: 'all 0.2s ease',
                                            minWidth: '100px',
                                            justifyContent: 'center'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (processing !== action.id) {
                                                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                                                e.currentTarget.style.borderColor = 'var(--accent-primary)'
                                                e.currentTarget.style.color = 'var(--accent-primary)'
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (processing !== action.id) {
                                                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                                                e.currentTarget.style.borderColor = 'var(--border-primary)'
                                                e.currentTarget.style.color = 'var(--text-secondary)'
                                            }
                                        }}
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