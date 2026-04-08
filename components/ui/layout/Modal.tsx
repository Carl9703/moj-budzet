import { ReactNode, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { createPortal } from 'react-dom'

interface Props {
    title: string
    children: ReactNode
    onClose: () => void
}

export function Modal({ title, children, onClose }: Props) {
    const [mounted, setMounted] = useState(false)

    // Close on Escape key
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
    }, [onClose])

    useEffect(() => {
        setMounted(true)
        document.body.style.overflow = 'hidden'
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.body.style.overflow = 'unset'
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [handleKeyDown])

    if (!mounted) return null

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-zinc-950/50"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                className="w-full max-w-lg relative overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col max-h-[90dvh] bg-zinc-900/90 backdrop-blur-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Gradient Line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

                {/* Ambient Internal Glows */}
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-amber-500/8 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

                {/* Modal Header */}
                <div className="relative px-8 pt-8 pb-4 flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 tracking-tight flex items-center gap-3">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all active:scale-90"
                        >
                            <span className="sr-only">Zamknij</span>
                            <span className="text-xl">✕</span>
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="relative flex-1 overflow-y-auto custom-scrollbar px-8 pb-8 pt-2">
                    {children}
                </div>
            </motion.div>
        </motion.div>,
        document.body
    )
}