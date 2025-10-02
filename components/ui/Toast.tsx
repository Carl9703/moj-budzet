'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

interface Toast {
    id: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    duration?: number
}

interface ToastContextType {
    showToast: (message: string, type?: Toast['type'], duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

interface ToastProviderProps {
    children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = (message: string, type: Toast['type'] = 'info', duration = 4000) => {
        const id = Math.random().toString(36).substr(2, 9)
        const newToast: Toast = { id, message, type, duration }
        
        setToasts(prev => [...prev, newToast])

        // Auto remove toast
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id)
            }, duration)
        }
    }

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    )
}

interface ToastContainerProps {
    toasts: Toast[]
    onRemove: (id: string) => void
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    if (toasts.length === 0) return null

    return (
        <div className="toast-container" style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxWidth: '400px'
        }}>
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    )
}

interface ToastItemProps {
    toast: Toast
    onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [isExiting, setIsExiting] = useState(false)

    useEffect(() => {
        // Trigger entrance animation
        setTimeout(() => setIsVisible(true), 10)
    }, [])

    const handleRemove = () => {
        setIsExiting(true)
        setTimeout(() => onRemove(toast.id), 300)
    }

    const getToastStyles = () => {
        const baseStyles = {
            backgroundColor: 'white',
            border: '1px solid',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minWidth: '300px',
            transform: isVisible && !isExiting ? 'translateX(0)' : 'translateX(100%)',
            opacity: isVisible && !isExiting ? 1 : 0,
            transition: 'all 0.3s ease',
            cursor: 'pointer'
        }

        switch (toast.type) {
            case 'success':
                return { ...baseStyles, borderColor: '#10b981', backgroundColor: '#f0fdf4' }
            case 'error':
                return { ...baseStyles, borderColor: '#ef4444', backgroundColor: '#fef2f2' }
            case 'warning':
                return { ...baseStyles, borderColor: '#f59e0b', backgroundColor: '#fffbeb' }
            default:
                return { ...baseStyles, borderColor: '#3b82f6', backgroundColor: '#eff6ff' }
        }
    }

    const getIcon = () => {
        switch (toast.type) {
            case 'success': return '✅'
            case 'error': return '❌'
            case 'warning': return '⚠️'
            default: return 'ℹ️'
        }
    }

    const getTextColor = () => {
        switch (toast.type) {
            case 'success': return '#065f46'
            case 'error': return '#991b1b'
            case 'warning': return '#92400e'
            default: return '#1e40af'
        }
    }

    return (
        <div style={getToastStyles()} onClick={handleRemove}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px' }}>{getIcon()}</span>
                <span style={{ 
                    color: getTextColor(), 
                    fontWeight: '500',
                    fontSize: '14px'
                }}>
                    {toast.message}
                </span>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    handleRemove()
                }}
                style={{
                    background: 'none',
                    border: 'none',
                    color: getTextColor(),
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '0',
                    marginLeft: '12px',
                    opacity: 0.7,
                    transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
            >
                ×
            </button>
        </div>
    )
}
