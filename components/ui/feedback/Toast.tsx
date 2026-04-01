'use client'

import { createContext, useContext, ReactNode } from 'react'
import { Toaster, toast as sonnerToast } from 'sonner'

interface ToastContextType {
    showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void
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
    const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration = 4000) => {
        const options = { duration }
        switch (type) {
            case 'success':
                sonnerToast.success(message, options)
                break
            case 'error':
                sonnerToast.error(message, options)
                break
            case 'warning':
                sonnerToast.warning(message, options)
                break
            case 'info':
            default:
                sonnerToast.info(message, options)
                break
        }
    }

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Toaster
                theme="dark"
                position="top-right"
                richColors
                toastOptions={{
                    style: {
                        background: 'rgba(15, 23, 42, 0.95)', // slate-900 with opacity
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(16px)'
                    },
                    className: 'rounded-2xl shadow-2xl tracking-tight font-medium mt-16 mr-4'
                }}
            />
        </ToastContext.Provider>
    )
}
