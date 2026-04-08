'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
    TrendingUp,
    TrendingDown,
    Pencil,
    Trash2,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    WalletCards,
    List,
    Briefcase,
    PieChart,
    Clock,
    ArrowRightLeft
} from 'lucide-react'
import { useState } from 'react'

interface Asset {
    id: string
    symbol: string
    type: string
    quantity: number
    currentPrice: number
    marketValue: number
    totalProfit: number
    profitPercentage: number
    totalCost: number
    createdAt?: string
    subPositions?: Asset[] // For granular history
    averagePurchasePrice?: number
}

interface AssetsTableProps {
    assets: Asset[]
    totalPortfolioValue: number
    onEdit: (asset: Asset) => void
    onDelete: (id: string, isSubPosition?: boolean) => void
}

export const AssetsTable = ({ assets, totalPortfolioValue, onEdit, onDelete }: AssetsTableProps) => {
    // State to track expanded groups (Type)
    const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({})
    // State to track expanded assets (Symbol)
    const [expandedAssets, setExpandedAssets] = useState<{ [key: string]: boolean }>({})

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [group]: !prev[group]
        }))
    }

    const toggleAsset = (assetId: string) => {
        setExpandedAssets(prev => ({
            ...prev,
            [assetId]: !prev[assetId]
        }))
    }

    // Group assets by type
    const groups = assets.reduce((acc, asset) => {
        const type = asset.type || 'Inne'
        if (!acc[type]) acc[type] = []
        acc[type].push(asset)
        return acc
    }, {} as { [key: string]: Asset[] })

    const groupKeys = Object.keys(groups).sort()

    const getGroupIcon = (type: string) => {
        switch (type.toUpperCase()) {
            case 'STOCK': return '📈'
            case 'CRYPTO': return '🪙'
            case 'PPK': return '🏦'
            case 'CASH': return '💵'
            case 'METAL': return '📀'
            default: return '📦'
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-[2.5rem] border border-white/5 bg-zinc-900/50 backdrop-blur-xl"
        >
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-3">
                    <span className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                        <Briefcase size={22} />
                    </span>
                    <span>Twoje Aktywa</span>
                </h2>
                <span className="text-[10px] font-black text-zinc-400 bg-zinc-800/50 px-3 py-1.5 rounded-xl border border-white/5 uppercase tracking-widest">
                    {assets.length} {assets.length === 1 ? 'Pozycja' : assets.length < 5 ? 'Pozycje' : 'Pozycji'}
                </span>
            </div>
            <p className="text-sm text-zinc-400 mb-8 ml-14">
                Zarządzaj swoim portfelem inwestycyjnym i śledź wyniki poszczególnych aktywów.
            </p>

            <div className="space-y-4">
                {assets.length === 0 ? (
                    <div className="p-12 text-center bg-zinc-800/20 rounded-3xl border border-white/5">
                        <div className="w-16 h-16 bg-zinc-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-50">
                            <Briefcase size={32} className="text-zinc-400" />
                        </div>
                        <p className="text-zinc-500 font-medium">Brak aktywów w Twoim portfelu</p>
                    </div>
                ) : (
                    groupKeys.map((group, index) => {
                        const groupAssets = groups[group]
                        const isExpanded = expandedGroups[group]
                        const groupTotalValue = groupAssets.reduce((sum, a) => sum + a.marketValue, 0)
                        const groupTotalProfit = groupAssets.reduce((sum, a) => sum + a.totalProfit, 0)
                        const groupPercentage = totalPortfolioValue > 0 ? (groupTotalValue / totalPortfolioValue) * 100 : 0

                        return (
                            <div
                                key={group || `group-${index}`}
                                className={`rounded-3xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-amber-500/30 bg-amber-500/5 shadow-xl' : 'border-white/5 bg-zinc-800/20 hover:bg-zinc-800/40'}`}
                            >
                                <button
                                    onClick={() => toggleGroup(group)}
                                    className="w-full p-5 flex items-center justify-between transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-colors shadow-inner ${isExpanded ? 'bg-amber-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                                            {getGroupIcon(group)}
                                        </div>
                                        <div className="text-left">
                                            <p className={`font-black text-sm uppercase tracking-widest transition-colors ${isExpanded ? 'text-amber-200' : 'text-zinc-200'}`}>
                                                {group}
                                            </p>
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-zinc-500 mt-1">
                                                <span>{groupAssets.length} {groupAssets.length === 1 ? 'poz.' : 'poz.'}</span>
                                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                                <span className="text-zinc-400">{groupPercentage.toFixed(1)}% portfela</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="font-black text-zinc-100 text-lg tabular-nums tracking-tighter">
                                                {groupTotalValue.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                <span className="text-xs ml-1 opacity-50">zł</span>
                                            </p>
                                            <div className={`text-[11px] font-bold flex items-center justify-end gap-1 ${groupTotalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {groupTotalProfit >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                {groupTotalProfit >= 0 ? '+' : ''}{groupTotalProfit.toLocaleString('pl-PL', { maximumFractionDigits: 0 })} zł
                                            </div>
                                        </div>
                                        <div className={`p-2 rounded-xl transition-colors ${isExpanded ? 'bg-amber-500/15 text-amber-400' : 'bg-white/5 text-zinc-600'}`}>
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-5 pb-5 pt-2 border-t border-white/5">
                                                <div className="space-y-3">
                                                    {groupAssets.map(asset => {
                                                        const assetPercentage = totalPortfolioValue > 0 ? (asset.marketValue / totalPortfolioValue) * 100 : 0
                                                        const isAssetExpanded = expandedAssets[asset.id]
                                                        return (
                                                            <AssetItem
                                                                key={asset.id}
                                                                asset={asset}
                                                                percentage={assetPercentage}
                                                                isExpanded={!!isAssetExpanded}
                                                                onToggle={() => toggleAsset(asset.id)}
                                                                onEdit={onEdit}
                                                                onDelete={onDelete}
                                                            />
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )
                    })
                )}
            </div>
        </motion.div>
    )
}

const AssetItem = ({
    asset,
    percentage,
    isExpanded,
    onToggle,
    onEdit,
    onDelete
}: {
    asset: Asset,
    percentage: number,
    isExpanded: boolean,
    onToggle: () => void,
    onEdit: (a: Asset) => void,
    onDelete: (id: string, isSubPosition?: boolean) => void
}) => {
    const isProfit = asset.totalProfit >= 0
    const hasSubPositions = asset.subPositions && asset.subPositions.length > 1

    return (
        <div className="group rounded-2xl bg-zinc-900/40 border border-white/5 overflow-hidden transition-all hover:border-white/10">
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                    <div
                        onClick={hasSubPositions ? onToggle : undefined}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[10px] font-black tracking-widest shadow-inner cursor-pointer transition-all ${asset.type === 'CRYPTO' ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' :
                            asset.type === 'PPK' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' :
                                'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                            }`}
                    >
                        {asset.symbol.substring(0, 3).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-white text-base tracking-tight truncate">{asset.symbol}</span>
                            {hasSubPositions && (
                                <span className="bg-zinc-800 text-[9px] font-black px-2 py-0.5 rounded-full text-zinc-500 uppercase tracking-widest">
                                    {asset.subPositions?.length} trans.
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                {asset.quantity.toLocaleString('pl-PL')} j. • {asset.currentPrice.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł
                            </span>
                            <span className="w-1 h-1 rounded-full bg-zinc-800" />
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                                {percentage.toFixed(1)}% portfela
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="font-black text-zinc-200 text-base tabular-nums tracking-tighter">
                            {asset.marketValue.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł
                        </p>
                        <div className={`text-[11px] font-bold flex items-center justify-end gap-1 ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isProfit ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {asset.profitPercentage.toFixed(2)}%
                        </div>
                    </div>

                    <div className="flex gap-1">
                        <button
                            onClick={() => onEdit(asset)}
                            className="w-8 h-8 flex items-center justify-center bg-zinc-800/50 hover:bg-zinc-700 border border-white/5 rounded-xl text-zinc-500 hover:text-amber-400 transition-all active:scale-90"
                            title="Edytuj"
                        >
                            <Pencil size={14} />
                        </button>
                        <button
                            onClick={() => onDelete(asset.id)}
                            className="w-8 h-8 flex items-center justify-center bg-zinc-800/50 hover:bg-rose-900/30 border border-white/5 rounded-xl text-zinc-500 hover:text-rose-400 transition-all active:scale-90"
                            title="Usuń"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && hasSubPositions && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-zinc-900/60 border-t border-white/5"
                    >
                        <div className="p-3 pl-20 space-y-2">
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3">Historia transakcji</p>
                            {asset.subPositions?.map((sub, idx) => (
                                <div
                                    key={sub.id}
                                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-800/30 border border-white/[0.02] hover:bg-zinc-800/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-1.5 rounded-lg bg-zinc-700/50 text-zinc-400">
                                            <Clock size={12} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-zinc-300">
                                                {new Date(sub.createdAt!).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </p>
                                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                                                {sub.quantity.toLocaleString('pl-PL')} j. @ {sub.averagePurchasePrice?.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-[11px] font-bold text-zinc-300">
                                                {sub.marketValue.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => onDelete(sub.id, true)}
                                            className="p-1.5 hover:bg-rose-500/10 rounded-lg text-zinc-700 hover:text-rose-500 transition-colors"
                                            title="Usuń transakcję"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
