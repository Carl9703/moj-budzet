'use client'

import { Modal } from '@/components/ui/layout/Modal'
import { motion } from 'framer-motion'
import { ShieldAlert, Trophy, PiggyBank } from 'lucide-react'

interface SavingsBreakdownModalProps {
    isOpen: boolean
    onClose: () => void
    emergencyFund: number
    goalsAmount: number
    goalEnvelopes: Array<{
        id: string
        name: string
        current: number
        icon: string | null
    }>
}

export function SavingsBreakdownModal({
    isOpen,
    onClose,
    emergencyFund,
    goalsAmount,
    goalEnvelopes
}: SavingsBreakdownModalProps) {
    if (!isOpen) return null

    // Compute from actual displayed goals to avoid mismatch with API's goalFundsAmount
    const computedGoalsAmount = goalEnvelopes.reduce((sum, e) => sum + e.current, 0)
    const totalSavings = emergencyFund + computedGoalsAmount

    return (
        <Modal title="💰 Twoje Oszczędności" onClose={onClose}>
            <div className="space-y-6">
                {/* Total Header */}
                <div className="text-center py-6 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 opacity-50" />
                    <div className="relative z-10">
                        <div className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] mb-2">
                            Łączne Oszczędności
                        </div>
                        <div className="text-4xl font-black text-white tracking-tighter">
                            {totalSavings.toLocaleString('pl-PL')} <span className="text-xl text-zinc-500 ml-1">zł</span>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4">
                    {/* Emergency Fund Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 bg-zinc-900/40 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all group"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-110 transition-transform">
                                <ShieldAlert size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white tracking-tight">Poduszka Finansowa</h3>
                                <p className="text-xs text-zinc-500 uppercase font-black tracking-widest">Fundusz Awaryjny</p>
                            </div>
                            <div className="ml-auto text-xl font-black text-emerald-400 tracking-tight">
                                {emergencyFund.toLocaleString('pl-PL')} <span className="text-xs text-emerald-500/50">zł</span>
                            </div>
                        </div>
                        <div className="w-full bg-zinc-800/50 h-2 rounded-full overflow-hidden shadow-inner">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${totalSavings > 0 ? (emergencyFund / totalSavings) * 100 : 0}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full"
                            />
                        </div>
                    </motion.div>

                    {/* Goals Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-5 bg-zinc-900/40 rounded-3xl border border-white/5 hover:border-amber-500/30 transition-all group"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 shadow-inner group-hover:scale-110 transition-transform">
                                <Trophy size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white tracking-tight">Cele Oszczędnościowe</h3>
                                <p className="text-xs text-zinc-500 uppercase font-black tracking-widest">{goalEnvelopes.length} aktywnych celów</p>
                            </div>
                            <div className="ml-auto text-xl font-black text-amber-400 tracking-tight">
                                {computedGoalsAmount.toLocaleString('pl-PL')} <span className="text-xs text-amber-500/50">zł</span>
                            </div>
                        </div>

                        {/* Expandable list of goals */}
                        <div className="space-y-2 mt-4">
                            {goalEnvelopes.length > 0 ? (
                                goalEnvelopes.map((envelope) => (
                                    <div key={envelope.id} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-800/30 hover:bg-zinc-800/50 border border-white/5 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-zinc-900/50 flex items-center justify-center text-lg">{envelope.icon || '🎯'}</div>
                                            <span className="text-sm font-bold text-zinc-300">{envelope.name}</span>
                                        </div>
                                        <span className="text-sm font-black text-zinc-200 tracking-tight">
                                            {envelope.current.toLocaleString('pl-PL')} <span className="text-xs text-zinc-500">zł</span>
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-zinc-500 italic text-center py-4 bg-zinc-900/30 rounded-2xl border border-dashed border-white/5">
                                    Brak zdefiniowanych celów
                                </p>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </Modal>
    )
}
