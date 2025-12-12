import { ReactNode, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createPortal } from 'react-dom'

interface Props {
    title: string
    children: ReactNode
    onClose: () => void
}

export function Modal({ title, children, onClose }: Props) {
    // Prevent scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 backdrop-blur-md bg-black/60"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-[98%] md:w-[95%] max-w-lg relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[92vh] md:max-h-[88vh]"
                style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Gradient */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

                {/* Ambient Glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

                {/* Fixed Header */}
                <div className="relative px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 flex-shrink-0 border-b border-white/5">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                        >
                            <span className="sr-only">Zamknij</span>
                            ✕
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="relative flex-1 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </motion.div>
        </motion.div>
    )
}