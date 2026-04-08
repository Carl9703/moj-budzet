
'use client'

import { Modal } from '@/components/ui/layout/Modal'
import { AlertTriangle, Info, CheckCircle, HelpCircle } from 'lucide-react'

type Variant = 'danger' | 'warning' | 'info' | 'success' | 'default'

interface ConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: Variant
    isLoading?: boolean
}

const variantStyles = {
    danger: {
        icon: AlertTriangle,
        iconColor: 'text-rose-500',
        iconBg: 'bg-rose-500/10',
        confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20'
    },
    warning: {
        icon: AlertTriangle,
        iconColor: 'text-amber-500',
        iconBg: 'bg-amber-500/10',
        confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/20'
    },
    info: {
        icon: Info,
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-500/10',
        confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
    },
    success: {
        icon: CheckCircle,
        iconColor: 'text-emerald-500',
        iconBg: 'bg-emerald-500/10',
        confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20'
    },
    default: {
        icon: HelpCircle,
        iconColor: 'text-amber-500',
        iconBg: 'bg-amber-500/10',
        confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/20'
    }
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Zatwierdź',
    cancelText = 'Anuluj',
    variant = 'default',
    isLoading = false
}: ConfirmationModalProps) {
    if (!isOpen) return null

    const style = variantStyles[variant]
    const Icon = style.icon

    return (
        <Modal title="" onClose={onClose}>
            <div className="p-4 text-center">
                <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${style.iconBg}`}>
                    <Icon size={28} className={style.iconColor} />
                </div>

                <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
                    {title}
                </h3>

                <p className="text-zinc-400 mb-6 max-w-sm mx-auto leading-relaxed text-sm">
                    {description}
                </p>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-5 py-2.5 rounded-xl font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2 ${style.confirmBtn}`}
                    >
                        {isLoading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Przetwarzanie...
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    )
}
