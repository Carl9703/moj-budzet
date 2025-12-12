import React from 'react'
import { motion } from 'framer-motion'

interface QuickActionsProps {
    onAddIncome: () => void
    onAddExpense: () => void
    onTransfer: () => void
}

export const QuickActions = ({ onAddIncome, onAddExpense, onTransfer }: QuickActionsProps) => {
    return (
        <div className="flex gap-3">
            <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAddIncome}
                className="relative px-5 py-2.5 rounded-xl text-sm font-bold text-white overflow-hidden group"
                style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                }}
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10 flex items-center gap-2">
                    <span className="text-lg leading-none">+</span> Przychód
                </span>
            </motion.button>

            <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAddExpense}
                className="relative px-5 py-2.5 rounded-xl text-sm font-bold text-white overflow-hidden group"
                style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #f43f5e 100%)',
                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                }}
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10 flex items-center gap-2">
                    <span className="text-lg leading-none">-</span> Wydatek
                </span>
            </motion.button>

            <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onTransfer}
                className="relative px-5 py-2.5 rounded-xl text-sm font-bold text-white overflow-hidden group"
                style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                }}
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10 flex items-center gap-2">
                    <span className="text-lg leading-none">↔</span> Transfer
                </span>
            </motion.button>

        </div>
    )
}