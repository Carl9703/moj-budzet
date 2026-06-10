'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { StatsCard } from '@/components/features/dashboard/StatsCard'
import { EnvelopeGroup } from '@/components/features/dashboard/EnvelopeGroup'
import { PendingActions } from '@/components/features/dashboard/PendingActions'
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner'
import { useDashboard } from '../lib/hooks/useDashboard'
import { useToast } from '@/components/ui/feedback/Toast'
import { useConfig } from '../lib/hooks/useConfig'
import { useAuth } from '../lib/hooks/useAuth'
import { useDashboardModals } from '../lib/hooks/useDashboardModals'
import { useGroupedEnvelopes } from '@/lib/hooks/useGroupedEnvelopes'
import { createIncomeHandler, createExpenseHandler, createTransferHandler } from '@/lib/handlers/modalHandlers'
import { DashboardModals } from '@/components/features/dashboard/DashboardModals'
import { DashboardHeader } from '@/components/features/dashboard/DashboardHeader'
import { QuickActions } from '@/components/features/dashboard/QuickActions'
import { PendingWalletTransactions } from '@/components/features/dashboard/PendingWalletTransactions'
import { GlobalFilters } from '@/components/features/analytics/filters/GlobalFilters'
import { TrendingUp, Wallet, PieChart, PiggyBank } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { motion } from 'framer-motion'
import { GROUP_COLORS } from '@/lib/constants/chart-colors'
import { isFreeFundsEnvelope, isGoalEnvelope, isEmergencyEnvelope, isSavingsEnvelope } from '@/lib/constants/envelopeTypes'




function HomePage() {
    const router = useRouter()
    const { isAuthenticated, isCheckingAuth } = useAuth()
    const { showToast } = useToast()
    const { data, loading, error, refetch } = useDashboard()
    const { loading: configLoading } = useConfig()

    const {
        activeModal,
        setActiveModal,
        selectedEnvelope,
        setSelectedEnvelope,
        exchangeEnvelope,
        setExchangeEnvelope,
        closeModal
    } = useDashboardModals()

    const handleEnvelopeClick = useCallback((envelopeId: string, envelopeName: string, envelopeIcon: string) => {
        setSelectedEnvelope({ id: envelopeId, name: envelopeName, icon: envelopeIcon })
        setActiveModal('envelopeTransactions')
    }, [setSelectedEnvelope, setActiveModal])

    const handleExchangeClick = useCallback((envelopeId: string, envelopeName: string, balance: number) => {
        setExchangeEnvelope({ id: envelopeId, name: envelopeName, balance })
        setActiveModal('exchange')
    }, [setExchangeEnvelope, setActiveModal])

    const handleIncomeSave = useMemo(() => createIncomeHandler(refetch, showToast), [refetch, showToast])
    const handleExpenseSave = useMemo(() => createExpenseHandler(refetch, showToast), [refetch, showToast])
    const handleTransferSave = useMemo(() => createTransferHandler(refetch, showToast), [refetch, showToast])

    const onAddIncomeClick = useCallback(() => setActiveModal('income'), [setActiveModal])
    const onAddExpenseClick = useCallback(() => setActiveModal('expense'), [setActiveModal])
    const onTransferClick = useCallback(() => setActiveModal('transfer'), [setActiveModal])

    const groupedEnvelopes = useGroupedEnvelopes(data)

    const calculateDaysLeft = () => {
        const now = new Date()
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return Math.max(0, lastDay.getDate() - now.getDate())
    }

    const freeFunds = data?.yearlyEnvelopes?.find(e => isFreeFundsEnvelope(e.envelopeType, e.name))?.current || 0
    const emergencyFund = data?.emergencyFundAmount || 0
    const totalNetWorth = (data?.balance || 0) + (data?.emergencyFundAmount || 0) + (data?.goalFundsAmount || 0)

    const goalEnvelopes = useMemo(() => {
        if (!data?.yearlyEnvelopes) return []
        return data.yearlyEnvelopes.filter(e =>
            isGoalEnvelope(e.envelopeType, e.name) &&
            !isFreeFundsEnvelope(e.envelopeType, e.name) &&
            !isEmergencyEnvelope(e.envelopeType, e.name) &&
            !isSavingsEnvelope(e.envelopeType, e.name)
        )
    }, [data?.yearlyEnvelopes])

    const pendingWalletEnvelopes = useMemo(() => [
        ...(data?.monthlyEnvelopes || []).map(e => ({ ...e, type: 'monthly' as const })),
        ...(data?.yearlyEnvelopes || []).map(e => ({ ...e, type: 'yearly' as const }))
    ], [data?.monthlyEnvelopes, data?.yearlyEnvelopes])

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
                            onAddIncome={onAddIncomeClick}
                            onAddExpense={onAddExpenseClick}
                            onTransfer={onTransferClick}
                        />
                    </DashboardHeader>
                </div>

                {/* Content Container - Scrollable */}
                <div className="flex flex-col gap-6 pb-6">

                    {/* Pending Actions */}
                    <PendingActions onSuccess={refetch} />

                    {/* Pending Google Wallet Transactions */}
                    <PendingWalletTransactions 
                        envelopes={pendingWalletEnvelopes} 
                        onSuccess={refetch} 
                    />

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
                                    <div className="flex flex-col gap-2 mt-2">
                                        <div className="flex justify-between items-end px-1">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Wydatki</span>
                                                <span className="text-[13px] font-black text-white tabular-nums">{data.totalExpenses?.toLocaleString('pl-PL')} zł</span>
                                            </div>
                                            <div className="flex flex-col text-right">
                                                <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Wpływy</span>
                                                <span className="text-[13px] font-black text-emerald-400 tabular-nums">{data.totalIncome?.toLocaleString('pl-PL')} zł</span>
                                            </div>
                                        </div>
                                        <div className="relative w-full h-2.5 bg-zinc-800/50 rounded-full overflow-hidden">
                                            {/* Base layer: Full Income */}
                                            <div className="absolute top-0 left-0 h-full bg-emerald-500/20" style={{ width: '100%' }} />
                                            {/* Foreground layer: Expenses relative to Income */}
                                            <div 
                                                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${((data.totalExpenses || 0) > (data.totalIncome || 0)) ? 'bg-[#f87171] shadow-[0_0_10px_rgba(248,113,113,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`}
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
                            value={`${(emergencyFund + goalEnvelopes.reduce((s, e) => s + e.current, 0)).toLocaleString('pl-PL')} zł`}
                            subtitle="Fundusze i cele długoterminowe"
                            icon={PiggyBank}
                            colorClass="amber"
                            onClick={() => setActiveModal('savings')}
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
                            <EnvelopeGroup
                                title="Potrzeby"
                                icon="🏡"
                                color={GROUP_COLORS['needs']}
                                envelopes={groupedEnvelopes.needs}
                                type="monthly"
                                onEnvelopeClick={handleEnvelopeClick}
                                onExchangeClick={handleExchangeClick}
                            />
                        </motion.div>

                        {/* Section 2: Lifestyle */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="w-full flex flex-col gap-6"
                        >
                            <EnvelopeGroup
                                title="Styl Życia"
                                icon="🎉"
                                color={GROUP_COLORS['lifestyle']}
                                envelopes={groupedEnvelopes.lifestyle}
                                type="monthly"
                                onEnvelopeClick={handleEnvelopeClick}
                                onExchangeClick={handleExchangeClick}
                            />
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
                                <EnvelopeGroup
                                    title="Cele i Majątek"
                                    icon="💎"
                                    color={GROUP_COLORS['assets']}
                                    envelopes={groupedEnvelopes.assets}
                                    type="monthly"
                                    onEnvelopeClick={handleEnvelopeClick}
                                    onExchangeClick={handleExchangeClick}
                                />
                            </div>

                            {/* Saving Goals */}
                            <div className="w-full">
                                <EnvelopeGroup
                                    title="Cele Oszczędnościowe"
                                    icon="🎯"
                                    color={GROUP_COLORS['goals']}
                                    envelopes={groupedEnvelopes.goals}
                                    type="yearly"
                                    onEnvelopeClick={handleEnvelopeClick}
                                    onExchangeClick={handleExchangeClick}
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <DashboardModals
                activeModal={activeModal}
                closeModal={closeModal}
                data={data}
                refetch={refetch}
                handleIncomeSave={handleIncomeSave}
                handleExpenseSave={handleExpenseSave}
                handleTransferSave={handleTransferSave}
                selectedEnvelope={selectedEnvelope}
                exchangeEnvelope={exchangeEnvelope}
                emergencyFund={emergencyFund}
                goalEnvelopes={goalEnvelopes}
            />

        </div>
    )
}

export default HomePage;
