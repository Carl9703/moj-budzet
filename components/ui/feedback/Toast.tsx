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
        <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm">
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

    const getBorderColor = () => {
        switch (toast.type) {
            case 'success': return 'border-emerald-500'
            case 'error': return 'border-red-500'
            case 'warning': return 'border-amber-500'
            default: return 'border-indigo-500'
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

    return (
        <div
            className={`bg-slate-800 border rounded-lg p-4 shadow-xl flex items-center justify-between min-w-[300px] cursor-pointer transition-all duration-300 ${getBorderColor()} ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                }`}
            onClick={handleRemove}
        >
            <div className="flex items-center gap-3">
                <span className="text-lg">{getIcon()}</span>
                <span className="text-slate-100 font-medium text-sm">
                    {toast.message}
                </span>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    handleRemove()
                }}
                className="bg-transparent border-none text-slate-100 cursor-pointer text-lg p-0 ml-3 opacity-70 hover:opacity-100 transition-opacity"
            >
                ×
            </button>
        </div>
    )
}
