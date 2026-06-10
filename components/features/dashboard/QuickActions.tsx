import React, { memo } from 'react'
import { motion } from 'framer-motion'

interface QuickActionsProps {
    onAddIncome: () => void
    onAddExpense: () => void
    onTransfer: () => void
}

export const QuickActions = memo(function QuickActions({ onAddIncome, onAddExpense, onTransfer }: QuickActionsProps) {
    return (
        <div className="flex gap-4">
            <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAddIncome}
                title="Dodaj przychód (I)"
                className="relative px-6 py-2.5 rounded-2xl text-sm font-bold text-white overflow-hidden group shadow-lg shadow-emerald-500/20"
                style={{
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                }}
            >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center gap-2">
                    <span className="text-lg leading-none">＋</span> Przychód
                    <kbd className="hidden md:flex items-center justify-center w-5 h-5 rounded-md bg-white/15 text-xs font-bold text-white/60 border border-white/10">I</kbd>
                </span>
            </motion.button>

            <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAddExpense}
                title="Dodaj wydatek (N)"
                className="relative px-6 py-2.5 rounded-2xl text-sm font-bold text-white overflow-hidden group shadow-lg shadow-rose-500/20"
                style={{
                    background: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
                }}
            >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center gap-2">
                    <span className="text-lg leading-none">−</span> Wydatek
                    <kbd className="hidden md:flex items-center justify-center w-5 h-5 rounded-md bg-white/15 text-xs font-bold text-white/60 border border-white/10">N</kbd>
                </span>
            </motion.button>

            <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onTransfer}
                title="Transfer (T)"
                className="relative px-6 py-2.5 rounded-2xl text-sm font-bold text-white overflow-hidden group shadow-lg shadow-amber-500/20"
                style={{
                    background: 'linear-gradient(135deg, #92400e 0%, #d97706 100%)',
                }}
            >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center gap-2">
                    <span className="text-lg leading-none">⇄</span> Transfer
                    <kbd className="hidden md:flex items-center justify-center w-5 h-5 rounded-md bg-white/15 text-xs font-bold text-white/60 border border-white/10">T</kbd>
                </span>
            </motion.button>
        </div>
    )
})