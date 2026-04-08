'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Loader2, Clipboard as ClipboardIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { AddInvestmentModal } from '@/components/features/investments/AddInvestmentModal'
import { ImportPasteModal } from '@/components/features/investments/ImportPasteModal'
import { EditInvestmentModal } from '@/components/features/investments/EditInvestmentModal'
import { ConfirmationModal } from '@/components/shared/modals'
import { PortfolioAllocationChart } from '@/components/features/investments/PortfolioAllocationChart'
import { AssetsTable } from '@/components/features/investments/AssetsTable'
import { PortfolioHistoryChart } from '@/components/features/investments/PortfolioHistoryChart'

export default function InvestmentsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [selectedInvestment, setSelectedInvestment] = useState<any>(null)
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, ids: string[] | null }>({ isOpen: false, ids: null })

    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['investments'],
        queryFn: () => api.get<any>('/api/investments'),
        refetchInterval: false,
        staleTime: 5 * 60 * 1000 // Match backend cache
    })

    const handleDeleteConfirm = async () => {
        if (!deleteConfirmation.ids) return
        try {
            // Delete all IDs in the group
            await Promise.all(deleteConfirmation.ids.map(id => api.delete(`/api/investments/${id}`)))
            refetch()
            setDeleteConfirmation({ isOpen: false, ids: null })
        } catch (err) {
            alert('Nie udało się usunąć inwestycji')
        }
    }

    if (isLoading && !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
                    <p className="text-zinc-400">Pobieranie aktualnych cen...</p>
                </div>
            </div>
        )
    }

    const summary = data?.summary || { totalMarketValue: 0, totalCostBasis: 0, totalProfit: 0, totalProfitPercentage: 0 }
    const positions = data?.positions || []

    const allocationsChartData = {
        stocks: positions.filter((p: any) => p.type === 'STOCK').reduce((sum: number, p: any) => sum + p.marketValue, 0),
        crypto: positions.filter((p: any) => p.type === 'CRYPTO').reduce((sum: number, p: any) => sum + p.marketValue, 0),
        ppk: positions.filter((p: any) => p.type === 'PPK' || p.type === 'PRIVATE_EQUITY').reduce((sum: number, p: any) => sum + p.marketValue, 0)
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col">
            <div className="w-full px-4 sm:px-6 lg:px-8 pb-4 pt-0 flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-start mb-2 shrink-0">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 mb-1">
                            💎 Portfel Inwestycyjny
                        </h1>

                    </motion.div>

                    <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold transition-all border border-zinc-700 active:scale-95 text-xs"
                            >
                                <ClipboardIcon size={14} />
                                Import
                            </button>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-600/20 active:scale-95 text-xs"
                            >
                                <Plus size={16} />
                                Dodaj
                            </button>
                        </div>
                        <span className="text-[10px] text-zinc-600 font-mono">
                            Ostatnia aktualizacja: {new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>

                {/* Content Container - New Dashboard Layout */}
                <div className="flex flex-col gap-4 pb-10">

                    {/* 1. Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                        {/* Total Value */}
                        <div className="p-5 rounded-3xl bg-zinc-900/50 backdrop-blur-xl border border-white/5">
                            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Wartość portfela</span>
                            <span className="text-2xl font-black text-white tracking-tight">
                                {summary.totalMarketValue?.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł
                            </span>
                        </div>

                        {/* Invested */}
                        <div className="p-5 rounded-3xl bg-zinc-900/50 backdrop-blur-xl border border-white/5">
                            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Zainwestowano</span>
                            <span className="text-2xl font-black text-zinc-300 tracking-tight">
                                {summary.totalCostBasis?.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł
                            </span>
                        </div>

                        {/* Profit */}
                        <div className="p-5 bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-3xl shrink-0">
                            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Zysk/Strata</span>
                            <div className="flex items-baseline gap-3">
                                <span className={`text-2xl font-black tracking-tight ${summary.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {summary.totalProfit > 0 ? '+' : ''}{summary.totalProfit?.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł
                                </span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${summary.totalProfit >= 0 ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'}`}>
                                    {summary.totalProfit >= 0 ? '+' : ''}{summary.totalProfitPercentage?.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Charts Row */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[400px] shrink-0">
                        {/* History Chart (Larger) */}
                        <div className="xl:col-span-8 h-[400px]">
                            <PortfolioHistoryChart positions={positions} />
                        </div>

                        {/* Allocation Donut (Smaller) */}
                        <div className="xl:col-span-4 h-[400px]">
                            <PortfolioAllocationChart
                                allocations={allocationsChartData}
                                totalValue={summary.totalMarketValue}
                            />
                        </div>
                    </div>

                    {/* 3. Assets Table (Full Width) */}
                    <div className="flex-1 min-h-[500px]">
                        <AssetsTable
                            assets={positions}
                            totalPortfolioValue={summary.totalMarketValue}
                            onEdit={(pos) => {
                                setSelectedInvestment(pos)
                                setIsEditModalOpen(true)
                            }}
                            onDelete={(id: string, isSubPosition?: boolean) => {
                                if (isSubPosition) {
                                    // Delete single transaction
                                    setDeleteConfirmation({ isOpen: true, ids: [id] })
                                } else {
                                    // Delete entire aggregated position
                                    const pos = positions.find((p: any) => p.id === id)
                                    setDeleteConfirmation({ isOpen: true, ids: pos?.ids || [id] })
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AddInvestmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => refetch()}
            />

            <ImportPasteModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={() => refetch()}
            />

            <EditInvestmentModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false)
                    setSelectedInvestment(null)
                }}
                onSuccess={() => refetch()}
                investment={selectedInvestment}
            />

            <ConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ isOpen: false, ids: null })}
                onConfirm={handleDeleteConfirm}
                title="Usuń inwestycję"
                description={deleteConfirmation.ids && deleteConfirmation.ids.length > 1
                    ? `Czy na pewno chcesz usunąć tę pozycję? Zawiera ona ${deleteConfirmation.ids.length} oddzielnych transakcji.`
                    : "Czy na pewno chcesz usunąć tę inwestycję? Ta operacja jest nieodwracalna."
                }
                confirmText="Usuń"
                variant="danger"
            />
        </div>
    )
}
