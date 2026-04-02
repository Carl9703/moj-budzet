'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { StatsCard } from '@/components/features/dashboard/StatsCard'
import { EnvelopeGroup } from '@/components/features/dashboard/EnvelopeGroup'
import { PendingActions } from '@/components/features/dashboard/PendingActions'
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner'
import { useDashboard } from '../lib/hooks/useDashboard'
import { useToast } from '@/components/ui/feedback/Toast'
import { useConfig } from '../lib/hooks/useConfig'
import { usePreviousMonth } from '../lib/hooks/usePreviousMonth'
import { useAuth } from '../lib/hooks/useAuth'
import { createIncomeHandler, createExpenseHandler, createTransferHandler } from '@/lib/handlers/modalHandlers'
import { DashboardHeader } from '@/components/features/dashboard/DashboardHeader'
import { QuickActions } from '@/components/features/dashboard/QuickActions'
import { GlobalFilters } from '@/components/features/analytics/filters/GlobalFilters'
import { TrendingUp, Wallet, PieChart, PiggyBank } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { motion } from 'framer-motion'

import { IncomeModal } from '@/components/shared/modals/IncomeModal'
import { ExpenseModal } from '@/components/shared/modals/ExpenseModal'
import { TransferModal } from '@/components/shared/modals/TransferModal'
import { EnvelopeTransactionsModal } from '@/components/shared/modals/EnvelopeTransactionsModal'
import { SavingsBreakdownModal } from '@/components/features/dashboard/modals/SavingsBreakdownModal'


function HomePage() {
    const router = useRouter()
    const { isAuthenticated, isCheckingAuth } = useAuth()
    const { showToast } = useToast()
    const { data, loading, error, refetch } = useDashboard()
    const { loading: configLoading } = useConfig()
    const { previousMonthStatus } = usePreviousMonth()

    // Modal states
    const [showIncomeModal, setShowIncomeModal] = useState(false)
    const [showExpenseModal, setShowExpenseModal] = useState(false)
    const [showTransferModal, setShowTransferModal] = useState(false)
    const [showEnvelopeTransactionsModal, setShowEnvelopeTransactionsModal] = useState(false)
    const [showSavingsModal, setShowSavingsModal] = useState(false)
    const [selectedEnvelope, setSelectedEnvelope] = useState<{ id: string, name: string, icon: string } | null>(null)

    // Keyboard shortcuts: N=expense, I=income, T=transfer
    const anyModalOpen = showIncomeModal || showExpenseModal || showTransferModal || showEnvelopeTransactionsModal || showSavingsModal
    const handleKeyboardShortcut = useCallback((e: KeyboardEvent) => {
        // Skip if user is typing in an input or a modal is open
        const tag = (e.target as HTMLElement).tagName
        if (anyModalOpen || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        if (e.metaKey || e.ctrlKey || e.altKey) return

        switch (e.key.toLowerCase()) {
            case 'n': setShowExpenseModal(true); break
            case 'i': setShowIncomeModal(true); break
            case 't': setShowTransferModal(true); break
        }
    }, [anyModalOpen])

    useEffect(() => {
        document.addEventListener('keydown', handleKeyboardShortcut)
        return () => document.removeEventListener('keydown', handleKeyboardShortcut)
    }, [handleKeyboardShortcut])

    const handleEnvelopeClick = (envelopeId: string, envelopeName: string, envelopeIcon: string) => {
        setSelectedEnvelope({ id: envelopeId, name: envelopeName, icon: envelopeIcon })
        setShowEnvelopeTransactionsModal(true)
    }

    const handleIncomeSave = createIncomeHandler(refetch, showToast)
    const handleExpenseSave = createExpenseHandler(refetch, showToast)
    const handleTransferSave = createTransferHandler(refetch, showToast)

    const calculateDaysLeft = () => {
        const now = new Date()
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return Math.max(0, lastDay.getDate() - now.getDate())
    }

    const freeFunds = data?.yearlyEnvelopes?.find(e => e.name.toLowerCase().includes('wolne środki'))?.current || 0
    const emergencyFund = data?.emergencyFundAmount || 0
    const totalNetWorth = (data?.balance || 0) + (data?.emergencyFundAmount || 0) + (data?.goalFundsAmount || 0)

    const getGoalEnvelopes = () => {
        if (!data?.yearlyEnvelopes) return []
        return data.yearlyEnvelopes.filter(e =>
            (e.envelopeType === 'goal' || ['Wesele', 'Podróże', 'Wakacje', 'Prezenty i Okazje', 'Auto: Serwis i Ubezpieczenie'].includes(e.name)) &&
            !e.name.toLowerCase().includes('wolne środki') &&
            e.name !== 'Fundusz Awaryjny' &&
            e.name !== 'Budowanie Przyszłości'
        )
    }

    if (isCheckingAuth) return <LoadingSpinner />

    if (!isAuthenticated) {
        router.push('/auth/signin')
        return null
    }

    if (loading || configLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
                <div className="max-w-[1600px] mx-auto space-y-8 relative z-10">
                    <div className="animate-pulse h-32 bg-zinc-800/50 rounded-2xl" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-zinc-800/30 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-8">
                <div className="w-full max-w-md">
                    <EmptyState
                        icon="⚠️"
                        title="Błąd ładowania"
                        description="Wystąpił błąd podczas pobierania danych. Spróbuj ponownie."
                        variant="error"
                        actionText="Spróbuj ponownie"
                        onAction={() => refetch()}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col selection:bg-amber-500/20">
            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]" />
            </div>

            <div className="w-full px-4 sm:px-6 lg:px-8 pb-28 md:pb-4 pt-0 flex flex-col relative z-10 max-w-[2560px] mx-auto">
                {/* Header Section */}
                <div className="shrink-0">
                    <DashboardHeader totalNetWorth={totalNetWorth}>
                        <QuickActions
                            onAddIncome={() => setShowIncomeModal(true)}
                            onAddExpense={() => setShowExpenseModal(true)}
                            onTransfer={() => setShowTransferModal(true)}
                        />
                    </DashboardHeader>
                </div>

                {/* Content Container - Scrollable */}
                <div className="flex flex-col gap-6 pb-6">

                    {/* Pending Actions */}
                    <PendingActions onSuccess={refetch} />

                    {/* Stats Row (Bento) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
                        {/* Free Funds */}
                        <StatsCard
                            title="Wolne Środki"
                            value={`${freeFunds.toLocaleString('pl-PL')} zł`}
                            subtitle="Do swobodnego wykorzystania"
                            icon={TrendingUp}
                            colorClass="emerald"
                            index={0}
                        />

                        {/* Main Balance */}
                        <StatsCard
                            title="Konto Główne"
                            value={`${(data.balance || 0).toLocaleString('pl-PL')} zł`}
                            subtitle="Stan konta bieżącego"
                            icon={Wallet}
                            colorClass="indigo"
                            index={1}
                        />

                        <StatsCard
                            title="Bilans Miesiąca"
                            value={
                                <div className="flex flex-col w-full gap-3 mt-1.5 min-w-[180px]">
                                    {/* Income Bar */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-between items-center w-full px-0.5">
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest shrink-0">Wpływy</span>
                                            <span className="text-[13px] font-black text-emerald-400 leading-none tabular-nums text-right">{data.totalIncome?.toLocaleString('pl-PL')} zł</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-zinc-800/50 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                                        </div>
                                    </div>

                                    {/* Expenses Bar */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-between items-center w-full px-0.5">
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest shrink-0">Wydatki</span>
                                            <span className={`text-[13px] font-black leading-none tabular-nums text-right ${((data.totalExpenses || 0) > (data.totalIncome || 0)) ? 'text-[#f87171]' : 'text-zinc-200'}`}>
                                                {data.totalExpenses?.toLocaleString('pl-PL')} zł
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-zinc-800/50 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${((data.totalExpenses || 0) > (data.totalIncome || 0)) ? 'bg-[#f87171]' : 'bg-amber-500'}`}
                                                style={{ width: `${Math.min(((data.totalExpenses || 0) / (data.totalIncome || 1)) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            }
                            subtitle={`${calculateDaysLeft()} dni do końca miesiąca`}
                            icon={PieChart}
                            colorClass="violet"
                            index={2}
                        />

                        {/* Savings / Goals */}
                        <StatsCard
                            title="Oszczędności"
                            value={`${(emergencyFund + getGoalEnvelopes().reduce((s, e) => s + e.current, 0)).toLocaleString('pl-PL')} zł`}
                            subtitle="Fundusze i cele długoterminowe"
                            icon={PiggyBank}
                            colorClass="amber"
                            onClick={() => setShowSavingsModal(true)}
                            index={3}
                        />
                    </div>

                    {/* Main Content Sections - Horizontal Layout for Groups */}
                    <div className="flex flex-col gap-8 pb-6">
                        {/* Section 1: Needs */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="w-full flex flex-col gap-6"
                        >
                            {(() => {
                                const needsMonthly = data.monthlyEnvelopes
                                    .filter(e => e.group === 'needs' && !e.isAccumulating)
                                    .map(e => ({ ...e, envelopeType: 'monthly' as const, envelopeKind: e.envelopeType }))
                                const needsYearly = (data.yearlyEnvelopes || [])
                                    .filter(e => e.group === 'needs' && !e.isAccumulating)
                                    .map(e => ({ ...e, envelopeType: 'yearly' as const, envelopeKind: e.envelopeType }))
                                const allNeeds = [...needsMonthly, ...needsYearly]

                                return (
                                    <EnvelopeGroup
                                        title="Potrzeby"
                                        icon="🏡"
                                        color="rgba(34, 197, 94, 0.4)"
                                        envelopes={allNeeds}
                                        type="monthly"
                                        onEnvelopeClick={handleEnvelopeClick}
                                    />
                                )
                            })()}
                        </motion.div>

                        {/* Section 2: Lifestyle */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="w-full flex flex-col gap-6"
                        >
                            {(() => {
                                const wantsMonthly = data.monthlyEnvelopes
                                    .filter(e => (e.group === 'wants' || e.group === 'lifestyle') && !e.isAccumulating)
                                    .map(e => ({ ...e, envelopeType: 'monthly' as const, envelopeKind: e.envelopeType }))
                                const wantsYearly = (data.yearlyEnvelopes || [])
                                    .filter(e => (e.group === 'wants' || e.group === 'lifestyle') && !e.isAccumulating)
                                    .map(e => ({ ...e, envelopeType: 'yearly' as const, envelopeKind: e.envelopeType }))
                                const allWants = [...wantsMonthly, ...wantsYearly]

                                return (
                                    <EnvelopeGroup
                                        title="Styl Życia"
                                        icon="🎉"
                                        color="rgba(236, 72, 153, 0.4)"
                                        envelopes={allWants}
                                        type="monthly"
                                        onEnvelopeClick={handleEnvelopeClick}
                                    />
                                )
                            })()}
                        </motion.div>

                        {/* Section 3: Goals */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="w-full flex flex-col gap-8"
                        >
                            {/* Assets */}
                            <div className="w-full">
                                {(() => {
                                    const assetsMonthly = data.monthlyEnvelopes
                                        .filter(e => (e.group === 'assets' || (e.isAccumulating && e.group !== 'goals')) && e.name !== 'Fundusz Awaryjny')
                                        .map(e => ({ ...e, envelopeType: 'monthly' as const, envelopeKind: e.envelopeType }))
                                    const assetsYearly = (data.yearlyEnvelopes?.filter(e => {
                                        const nameLower = e.name.toLowerCase()
                                        return (e.group === 'assets' || (e.isAccumulating && e.group !== 'goals')) &&
                                            !nameLower.includes('wolne środki') &&
                                            e.name !== 'Fundusz Awaryjny'
                                    }) || []).map(e => ({ ...e, envelopeType: 'yearly' as const, envelopeKind: e.envelopeType }))
                                    const allAssets = [...assetsMonthly, ...assetsYearly]

                                    return (
                                        <EnvelopeGroup
                                            title="Cele i Majątek"
                                            icon="💎"
                                            color="rgba(168, 85, 247, 0.4)"
                                            envelopes={allAssets}
                                            type="monthly"
                                            onEnvelopeClick={handleEnvelopeClick}
                                        />
                                    )
                                })()}
                            </div>

                            {/* Saving Goals */}
                            <div className="w-full">
                                {data.yearlyEnvelopes && (() => {
                                    const goals = data.yearlyEnvelopes
                                        .filter(e => e.group === 'goals')
                                        .map(e => ({ ...e, envelopeKind: e.envelopeType, envelopeType: 'yearly' as const }))
                                    return (
                                        <EnvelopeGroup
                                            title="Cele Oszczędnościowe"
                                            icon="🎯"
                                            color="rgba(249, 115, 22, 0.4)"
                                            envelopes={goals}
                                            type="yearly"
                                            onEnvelopeClick={handleEnvelopeClick}
                                        />
                                    )
                                })()}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showIncomeModal && (
                <div className="modal-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="modal-content w-full max-w-lg">
                        <IncomeModal
                            onClose={() => setShowIncomeModal(false)}
                            onSave={handleIncomeSave}
                        />
                    </div>
                </div>
            )}

            {showExpenseModal && (
                <div className="modal-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="modal-content w-full max-w-lg">
                        <ExpenseModal
                            onClose={() => setShowExpenseModal(false)}
                            onSave={handleExpenseSave}
                            envelopes={[
                                ...(data.monthlyEnvelopes || []).map(e => ({ ...e, type: 'monthly' })),
                                ...(data.yearlyEnvelopes || []).map(e => ({ ...e, type: 'yearly' }))
                            ]}
                        />
                    </div>
                </div>
            )}


            {showEnvelopeTransactionsModal && selectedEnvelope && (
                <div className="modal-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="modal-content w-full max-w-4xl h-[80vh]">
                        <EnvelopeTransactionsModal
                            isOpen={showEnvelopeTransactionsModal}
                            onClose={() => setShowEnvelopeTransactionsModal(false)}
                            envelopeId={selectedEnvelope.id}
                            envelopeName={selectedEnvelope.name}
                            envelopeIcon={selectedEnvelope.icon}
                        />
                    </div>
                </div>
            )}

            {showTransferModal && (
                <div className="modal-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="modal-content w-full max-w-lg">
                        <TransferModal
                            onClose={() => setShowTransferModal(false)}
                            onSave={handleTransferSave}
                            mainBalance={data.balance}
                            envelopes={[
                                ...(data.monthlyEnvelopes || []).map(e => ({
                                    ...e,
                                    type: 'monthly' as const,
                                    currentAmount: e.current
                                })),
                                ...(data.yearlyEnvelopes || []).map(e => ({
                                    ...e,
                                    type: 'yearly' as const,
                                    currentAmount: e.current
                                }))
                            ]}
                        />
                    </div>
                </div>
            )}

            {showSavingsModal && (
                <SavingsBreakdownModal
                    isOpen={showSavingsModal}
                    onClose={() => setShowSavingsModal(false)}
                    emergencyFund={emergencyFund}
                    goalsAmount={data.goalFundsAmount || 0}
                    goalEnvelopes={getGoalEnvelopes()}
                />
            )}

        </div>
    )
}

export default HomePage;