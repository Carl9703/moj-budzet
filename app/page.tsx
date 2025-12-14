'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MonthStatus } from '@/components/features/dashboard/MonthStatus'
import { EnvelopeGroup } from '@/components/features/dashboard/EnvelopeGroup'
import { PendingActions } from '@/components/features/dashboard/PendingActions'
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner'
import { EnvelopeCardSkeleton, MonthStatusSkeleton } from '@/components/ui/SkeletonLoader'
import { useDashboard } from '../lib/hooks/useDashboard'
import { useToast } from '@/components/ui/feedback/Toast'
import { useConfig } from '../lib/hooks/useConfig'
import { usePreviousMonth } from '../lib/hooks/usePreviousMonth'
import { useAuth } from '../lib/hooks/useAuth'
import { createIncomeHandler, createExpenseHandler, createTransferHandler } from '@/lib/handlers/modalHandlers'
import { DashboardHeader } from '@/components/features/dashboard/DashboardHeader'
import { QuickActions } from '@/components/features/dashboard/QuickActions'
import { MobileBalanceCard } from '@/components/features/dashboard/MobileBalanceCard'
import { motion } from 'framer-motion'
import { GlobalFilters } from '@/components/features/analytics/filters/GlobalFilters'

import { IncomeModal } from '@/components/shared/modals/IncomeModal'
import { ExpenseModal } from '@/components/shared/modals/ExpenseModal'
import { TransferModal } from '@/components/shared/modals/TransferModal'
import { CloseMonthModal } from '@/components/shared/modals/CloseMonthModal'
import { EnvelopeTransactionsModal } from '@/components/shared/modals/EnvelopeTransactionsModal'


export default function HomePage() {
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
    const [showCloseMonthModal, setShowCloseMonthModal] = useState(false)
    const [showEnvelopeTransactionsModal, setShowEnvelopeTransactionsModal] = useState(false)
    const [selectedEnvelope, setSelectedEnvelope] = useState<any>(null)

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

    const getCurrentDayAndTotalDays = () => {
        const now = new Date()
        const currentDay = now.getDate()
        const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        return { currentDay, totalDays }
    }

    const freeFunds = data?.yearlyEnvelopes?.find(e => e.name.toLowerCase().includes('wolne środki'))?.current || 0
    const emergencyFund = data?.monthlyEnvelopes?.find(e => e.name === 'Fundusz Awaryjny')?.current
        || data?.yearlyEnvelopes?.find(e => e.name === 'Fundusz Awaryjny')?.current
        || 0

    if (isCheckingAuth) return <LoadingSpinner />

    if (!isAuthenticated) {
        router.push('/auth/signin')
        return null
    }

    if (loading || configLoading) {
        return (
            <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
                <div className="max-w-[1600px] mx-auto space-y-8 relative z-10">
                    <div className="animate-pulse h-32 bg-slate-800/50 rounded-2xl" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-slate-800/30 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
                <div className="text-center space-y-4">
                    <p className="text-xl">Wystąpił błąd podczas ładowania danych.</p>
                    <button
                        onClick={() => refetch()}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                    >
                        Spróbuj ponownie
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen relative overflow-x-hidden bg-slate-950 selection:bg-indigo-500/30">
            {/* Animated Background - Subtler than login */}
            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #020617 60%)',
                }}
            />
            <div className="fixed top-0 left-0 w-full h-[500px] bg-indigo-500/5 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 p-3 sm:p-6 lg:p-8">
                <div className="max-w-[1600px] mx-auto space-y-8">

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                Dashboard ✨
                            </h1>
                            <p className="text-slate-400 text-sm">Twoje centrum dowodzenia finansami</p>
                        </div>
                        <QuickActions
                            onAddIncome={() => setShowIncomeModal(true)}
                            onAddExpense={() => setShowExpenseModal(true)}
                            onTransfer={() => setShowTransferModal(true)}
                        />
                    </div>

                    {/* Mobile Balance Card */}
                    <MobileBalanceCard
                        balance={data.balance || 0}
                        freeFunds={freeFunds}
                        emergencyFund={emergencyFund}
                    />

                    {/* Pending Actions */}
                    <PendingActions onSuccess={refetch} />

                    {/* Month Status Hero */}
                    <MonthStatus
                        totalIncome={data.totalIncome || 0}
                        totalExpenses={data.totalExpenses || 0}
                        daysLeft={calculateDaysLeft()}
                        onCloseMonth={() => setShowCloseMonthModal(true)}
                        previousMonthStatus={previousMonthStatus}
                        currentDay={getCurrentDayAndTotalDays().currentDay}
                        totalDays={getCurrentDayAndTotalDays().totalDays}
                        isMonthClosed={data.isMonthClosed}
                    />

                    {/* Envelopes Grid */}
                    {/* Envelopes Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6"
                    >
                        {data.monthlyEnvelopes && data.monthlyEnvelopes.length > 0 ? (
                            <>
                                {/* Potrzeby - Column 1 */}
                                <div>
                                    {(() => {
                                        const needsMonthly = data.monthlyEnvelopes
                                            .filter(e => e.group === 'needs')
                                            .map(e => ({ ...e, envelopeType: 'monthly' as const, envelopeKind: e.envelopeType }))
                                        const needsYearly = (data.yearlyEnvelopes || [])
                                            .filter(e => e.group === 'needs')
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
                                </div>

                                {/* Styl Życia - Column 2 */}
                                <div>
                                    {(() => {
                                        const wantsMonthly = data.monthlyEnvelopes
                                            .filter(e => e.group === 'wants' || e.group === 'lifestyle')
                                            .map(e => ({ ...e, envelopeType: 'monthly' as const, envelopeKind: e.envelopeType }))
                                        const wantsYearly = (data.yearlyEnvelopes || [])
                                            .filter(e => e.group === 'wants' || e.group === 'lifestyle')
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
                                </div>

                                {/* Cele i Majątek - Column 3 */}
                                <div className="space-y-6">
                                    {(() => {
                                        const assetsMonthly = data.monthlyEnvelopes
                                            .filter(e => e.group === 'assets' && e.name !== 'Fundusz Awaryjny')
                                            .map(e => ({ ...e, envelopeType: 'monthly' as const, envelopeKind: e.envelopeType }))
                                        const assetsYearly = (data.yearlyEnvelopes?.filter(e => {
                                            const nameLower = e.name.toLowerCase()
                                            return e.group === 'assets' && !nameLower.includes('wolne środki') && e.name !== 'Fundusz Awaryjny'
                                        }) || []).map(e => ({ ...e, envelopeType: 'yearly' as const, envelopeKind: e.envelopeType }))
                                        const allAssets = [...assetsMonthly, ...assetsYearly]

                                        return allAssets.length > 0 ? (
                                            <EnvelopeGroup
                                                title="Cele i Majątek"
                                                icon="💎"
                                                color="rgba(168, 85, 247, 0.4)"
                                                envelopes={allAssets}
                                                type="monthly"
                                                onEnvelopeClick={handleEnvelopeClick}
                                            />
                                        ) : null
                                    })()}

                                    {/* Goals */}
                                    {data.yearlyEnvelopes && (() => {
                                        const goals = data.yearlyEnvelopes
                                            .filter(e => e.group === 'goals')
                                            .map(e => ({ ...e, envelopeKind: e.envelopeType }))
                                        return goals.length > 0 ? (
                                            <EnvelopeGroup
                                                title="Cele Oszczędnościowe"
                                                icon="🎯"
                                                color="rgba(249, 115, 22, 0.4)"
                                                envelopes={goals}
                                                type="yearly"
                                                onEnvelopeClick={handleEnvelopeClick}
                                            />
                                        ) : null
                                    })()}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-dashed border-slate-700">
                                <p className="text-slate-400 mb-4">Nie masz jeszcze żadnych kopert w tym miesiącu.</p>
                                <button
                                    onClick={() => router.push('/config')}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                                >
                                    Skonfiguruj budżet
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Modals */}
            {showIncomeModal && (
                <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="modal-content w-full max-w-lg">
                        <IncomeModal
                            onClose={() => setShowIncomeModal(false)}
                            onSave={handleIncomeSave}
                        />
                    </div>
                </div>
            )}

            {showExpenseModal && (
                <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
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

            {showCloseMonthModal && (
                <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="modal-content w-full max-w-lg">
                        <CloseMonthModal
                            onClose={() => setShowCloseMonthModal(false)}
                            onConfirm={refetch}
                            surplus={data.monthlySurplus}
                            transfers={data.monthlyTransfersToEnvelopes || []}
                            monthSummary={{
                                income: data.totalIncome || 0,
                                expenses: data.totalExpenses || 0,
                                savings: data.monthlySurplus || 0,
                                returns: data.monthlyReturns
                            }}
                        />
                    </div>
                </div>
            )}

            {showEnvelopeTransactionsModal && selectedEnvelope && (
                <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
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
                <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
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

        </div>
    )
}