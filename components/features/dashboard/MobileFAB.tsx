'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ArrowRightLeft, TrendingUp, TrendingDown, X } from 'lucide-react'

interface MobileFABProps {
    onAddIncome: () => void
    onAddExpense: () => void
    onTransfer: () => void
}

export function MobileFAB({ onAddIncome, onAddExpense, onTransfer }: MobileFABProps) {
    const [isOpen, setIsOpen] = useState(false)

    const toggleOpen = () => setIsOpen(!isOpen)

    const buttonVariants = {
        closed: { rotate: 0 },
        open: { rotate: 45 }
    }

    const menuVariants = {
        closed: { opacity: 0, scale: 0.8, y: 20, transition: { staggerChildren: 0.05, staggerDirection: -1 } },
        open: { opacity: 1, scale: 1, y: 0, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
    }

    const itemVariants = {
        closed: { opacity: 0, y: 10, scale: 0.8 },
        open: { opacity: 1, y: 0, scale: 1 }
    }

    return (
        <div className="fixed bottom-[80px] right-4 z-[40] md:hidden">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={menuVariants}
                        className="flex flex-col gap-3 mb-3 items-end"
                    >
                        <motion.button
                            variants={itemVariants}
                            onClick={() => { onTransfer(); setIsOpen(false) }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/30 font-bold text-sm"
                        >
                            <span className="text-xs">Transfer</span>
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <ArrowRightLeft size={16} />
                            </div>
                        </motion.button>

                        <motion.button
                            variants={itemVariants}
                            onClick={() => { onAddIncome(); setIsOpen(false) }}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-500/30 font-bold text-sm"
                        >
                            <span className="text-xs">Przychód</span>
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <TrendingUp size={16} />
                            </div>
                        </motion.button>

                        <motion.button
                            variants={itemVariants}
                            onClick={() => { onAddExpense(); setIsOpen(false) }}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-full shadow-lg shadow-rose-500/30 font-bold text-sm"
                        >
                            <span className="text-xs">Wydatek</span>
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <TrendingDown size={16} />
                            </div>
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={toggleOpen}
                variants={buttonVariants}
                animate={isOpen ? 'open' : 'closed'}
                whileTap={{ scale: 0.9 }}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-colors ${isOpen ? 'bg-slate-700 text-slate-300' : 'bg-indigo-600 text-white shadow-indigo-500/40'
                    }`}
            >
                <Plus size={28} />
            </motion.button>

            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[-1]"
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
