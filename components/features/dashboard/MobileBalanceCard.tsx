'use client'

import { motion } from 'framer-motion'
import { Wallet, PiggyBank, ShieldAlert } from 'lucide-react'

interface MobileBalanceCardProps {
    balance: number
    freeFunds: number
    emergencyFund: number
}

export function MobileBalanceCard({ balance, freeFunds, emergencyFund }: MobileBalanceCardProps) {
    const formatMoney = (val: number) => val.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden grid grid-cols-1 gap-2 mb-6"
        >
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <Wallet size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Konto Główne</p>
                        <p className="text-xl font-bold text-slate-100">{formatMoney(balance)} <span className="text-xs font-normal text-slate-500">PLN</span></p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <PiggyBank size={14} className="text-emerald-400" />
                        <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">Wolne Środki</p>
                    </div>
                    <p className="text-base font-bold text-slate-200">{formatMoney(freeFunds)} <span className="text-[10px] text-slate-500">PLN</span></p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldAlert size={14} className="text-amber-400" />
                        <p className="text-[10px] text-amber-400 uppercase tracking-wider font-bold">Fundusz Awar.</p>
                    </div>
                    <p className="text-base font-bold text-slate-200">{formatMoney(emergencyFund)} <span className="text-[10px] text-slate-500">PLN</span></p>
                </div>
            </div>
        </motion.div>
    )
}
