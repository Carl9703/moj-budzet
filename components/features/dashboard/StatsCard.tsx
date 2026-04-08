import React from 'react'
import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface StatsCardProps {
    title: string
    value: React.ReactNode
    icon: LucideIcon
    trend?: {
        value: number
        label: string
        isPositive: boolean
    }
    subtitle?: string
    colorClass?: string
    className?: string
    onClick?: () => void
    index?: number
}

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    emerald: { bg: 'bg-emerald-500/8', border: 'border-emerald-500/15', text: 'text-emerald-400' },
    indigo: { bg: 'bg-amber-500/8', border: 'border-amber-500/15', text: 'text-amber-400' },
    violet: { bg: 'bg-amber-500/8', border: 'border-amber-500/15', text: 'text-amber-400' },
    amber: { bg: 'bg-amber-500/8', border: 'border-amber-500/15', text: 'text-amber-400' },
    rose: { bg: 'bg-rose-500/8', border: 'border-rose-500/15', text: 'text-rose-400' },
    blue: { bg: 'bg-blue-500/8', border: 'border-blue-500/15', text: 'text-blue-400' },
}

export const StatsCard = ({ title, value, icon: Icon, trend, subtitle, colorClass = "indigo", className = "", onClick, index = 0 }: StatsCardProps) => {
    const colors = colorMap[colorClass] || colorMap.indigo

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
            onClick={onClick}
            className={`py-3 px-6 rounded-[32px] bg-zinc-900/40 backdrop-blur-xl border border-white/5 flex flex-col relative overflow-hidden group transition-all duration-300 ${className} ${onClick ? 'cursor-pointer hover:bg-zinc-800/40 hover:scale-[1.02] hover:border-white/10' : ''}`}
        >
            {/* Minimal Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">{title}</span>
                </div>
                <div className={`p-2.5 rounded-2xl ${colors.bg} border ${colors.border} ${colors.text} group-hover:scale-110 transition-transform`}>
                    <Icon size={18} />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col items-start w-full">
                {typeof value === 'string' ? (
                    <div className="money text-[26px] md:text-[36px] font-black text-white tracking-tighter leading-none mb-1">
                        {value}
                    </div>
                ) : (
                    <div className="w-full">
                        {value}
                    </div>
                )}

                {trend && (
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${trend.isPositive ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'}`}>
                            {trend.isPositive ? '+' : ''}{trend.value}%
                        </span>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{trend.label}</span>
                    </div>
                )}

                {subtitle && (
                    <p className="text-[11px] text-zinc-500 font-medium tracking-tight opacity-80 leading-relaxed text-left">
                        {subtitle}
                    </p>
                )}
            </div>
        </motion.div>
    )
}
