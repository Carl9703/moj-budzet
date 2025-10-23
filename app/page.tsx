'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { MonthStatus } from '@/components/features/dashboard/MonthStatus'
import { MainBalance } from '@/components/features/dashboard/MainBalance'
import { AvailableFunds } from '@/components/features/dashboard/AvailableFunds'
import { EnvelopeCard } from '@/components/ui/EnvelopeCard'
import { EnvelopeGroup } from '@/components/features/dashboard/EnvelopeGroup'
import { QuickActions } from '@/components/features/dashboard/QuickActions'
import { FloatingActionButton } from '@/components/ui/FloatingActionButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner'
import { EnvelopeCardSkeleton, MainBalanceSkeleton, MonthStatusSkeleton, QuickActionsSkeleton } from '@/components/ui/SkeletonLoader'
import { useToast } from '@/components/ui/feedback/Toast'
import { useDashboard } from '../lib/hooks/useDashboard'
import { authorizedFetch } from '../lib/utils/api'
import { useConfig } from '../lib/hooks/useConfig'
import { usePreviousMonth } from '../lib/hooks/usePreviousMonth'
import { useAuth } from '../lib/hooks/useAuth'
import { createIncomeHandler, createExpenseHandler } from '../lib/handlers/modalHandlers'

const IncomeModal = lazy(() => import('@/components/shared/modals/IncomeModal').then(m => ({ default: m.IncomeModal })))
const ExpenseModal = lazy(() => import('@/components/shared/modals/ExpenseModal').then(m => ({ default: m.ExpenseModal })))
const TransferModal = lazy(() => import('@/components/shared/modals/TransferModal').then(m => ({ default: m.TransferModal })))
const CloseMonthModal = lazy(() => import('@/components/shared/modals/CloseMonthModal').then(m => ({ default: m.CloseMonthModal })))
const EnvelopeTransactionsModal = lazy(() => import('@/components/shared/modals/EnvelopeTransactionsModal').then(m => ({ default: m.EnvelopeTransactionsModal })))

export default function HomePage() {
    const router = useRouter()
    const { isAuthenticated, isCheckingAuth } = useAuth()
    const { showToast } = useToast()
    const { data, loading, error, refetch } = useDashboard()
    const { config, loading: configLoading } = useConfig()
    const { previousMonthStatus } = usePreviousMonth()
    
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

    const handleIncomeSave = createIncomeHandler(
        setShowIncomeModal,
        refetch,
        showToast
    )

    const handleExpenseSave = createExpenseHandler(
        setShowExpenseModal,
        refetch,
        showToast
    )

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

    if (isCheckingAuth) {
        return <LoadingSpinner />
    }

    if (!isAuthenticated) {
        router.push('/auth/signin')
        return null
    }

    if (loading || configLoading) {
        return (
            <div className="min-h-screen fade-in-up bg-theme-primary">
                <div className="container-wide" style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px' }}>
                    <div className="stagger-children dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div className="smooth-all hover-lift">
                            <MainBalanceSkeleton />
                        </div>
                        <div className="smooth-all hover-lift">
                            <MonthStatusSkeleton />
                        </div>
                        <div className="smooth-all hover-lift">
                            <QuickActionsSkeleton />
                        </div>
                    </div>
                    <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                        <div className="slide-in-left">
                            <div style={{ 
                                padding: '20px', 
                                backgroundColor: 'var(--bg-secondary)', 
                                borderRadius: '8px', 
                                border: '1px solid var(--border-primary)'
                            }}>
                                <div style={{ 
                                    width: '120px', 
                                    height: '20px', 
                                    backgroundColor: 'var(--bg-tertiary)', 
                                    borderRadius: '4px', 
                                    marginBottom: '16px' 
                                }} />
                                {[1, 2].map(i => (
                                    <div key={i} style={{ marginBottom: '12px' }}>
                                        <div style={{ 
                                            width: '100px', 
                                            height: '16px', 
                                            backgroundColor: 'var(--bg-tertiary)', 
                                            borderRadius: '4px', 
                                            marginBottom: '8px' 
                                        }} />
                                        <div style={{ 
                                            width: '100%', 
                                            height: '8px', 
                                            backgroundColor: 'var(--bg-tertiary)', 
                                            borderRadius: '4px' 
                                        }} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div style={{ 
                                width: '120px', 
                                height: '20px', 
                                backgroundColor: 'var(--bg-tertiary)', 
                                borderRadius: '4px', 
                                marginBottom: '12px' 
                            }} />
                            <div style={{ display: 'grid', gap: '10px' }}>
                                {[1, 2, 3].map(i => <EnvelopeCardSkeleton key={i} />)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !data) {
        return <div>Błąd ładowania danych</div>
    }

    return (
        <div className="min-h-screen fade-in-up bg-theme-primary">
            <div className="container-wide" style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px' }}>
                <div className="stagger-children dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="smooth-all hover-lift">
                        <MainBalance balance={data.balance || 0} />
                        {/* Wolne środki pod MainBalance */}
                        {data.yearlyEnvelopes?.find(e => e.name.toLowerCase().includes('wolne środki')) && (
                            <AvailableFunds 
                                availableFunds={data.yearlyEnvelopes.find(e => e.name.toLowerCase().includes('wolne środki'))?.current || 0} 
                            />
                        )}
                    </div>
                    <div className="smooth-all hover-lift">
                        <MonthStatus
                            totalIncome={data.totalIncome || 0}
                            totalExpenses={data.totalExpenses || 0}
                            daysLeft={calculateDaysLeft()}
                            onCloseMonth={() => setShowCloseMonthModal(true)}
                            previousMonthStatus={previousMonthStatus}
                            currentDay={getCurrentDayAndTotalDays().currentDay}
                            totalDays={getCurrentDayAndTotalDays().totalDays}
                        />
                    </div>
                    <div className="smooth-all hover-lift">
                        <QuickActions
                            onAddIncome={() => setShowIncomeModal(true)}
                            onAddExpense={() => setShowExpenseModal(true)}
                        />
                    </div>
                </div>

                <div className="grid-responsive" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px'
                }}>
                    {/* Sprawdź czy użytkownik ma koperty miesięczne */}
                    {data.monthlyEnvelopes && data.monthlyEnvelopes.length > 0 ? (
                        <>
                            {/* GRUPA 1: POTRZEBY - NA GÓRZE */}
                            <EnvelopeGroup
                                title="Potrzeby"
                                icon="🏡"
                                color="rgba(34, 197, 94, 0.1)"
                                envelopes={data.monthlyEnvelopes.filter(e => e.group === 'needs')}
                                type="monthly"
                                onEnvelopeClick={handleEnvelopeClick}
                            />

                            {/* GRUPA 2: FUNDUSZE CELOWE */}
                            <EnvelopeGroup
                                title="Fundusze celowe"
                                icon="🎯"
                                color="rgba(245, 158, 11, 0.1)"
                                envelopes={data.yearlyEnvelopes?.filter(e => e.group === 'target' && !e.name.toLowerCase().includes('wolne środki')) || []}
                                type="yearly"
                                onEnvelopeClick={handleEnvelopeClick}
                            />
                            
                            {/* GRUPA 3: STYL ŻYCIA */}
                            <EnvelopeGroup
                                title="Styl życia"
                                icon="🎉"
                                color="rgba(168, 85, 247, 0.1)"
                                envelopes={data.monthlyEnvelopes.filter(e => e.group === 'lifestyle')}
                                type="monthly"
                                onEnvelopeClick={handleEnvelopeClick}
                            />
                            
                            {/* GRUPA 4: CELE FINANSOWE */}
                            <EnvelopeGroup
                                title="Cele finansowe"
                                icon="🎯"
                                color="rgba(59, 130, 246, 0.1)"
                                envelopes={data.monthlyEnvelopes.filter(e => e.group === 'financial')}
                                type="monthly"
                                onEnvelopeClick={handleEnvelopeClick}
                            />
                        </>
                    ) : (
                        <div className="slide-in-left">
                            <div style={{ 
                                padding: '20px', 
                                backgroundColor: 'var(--bg-secondary)', 
                                borderRadius: '8px', 
                                border: '1px solid var(--border-primary)',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '24px', marginBottom: '12px' }}>📦</div>
                                <h3 style={{ 
                                    fontSize: '18px', 
                                    fontWeight: '600', 
                                    marginBottom: '8px',
                                    color: 'var(--text-primary)'
                                }}>
                                    Brak kopert miesięcznych
                                </h3>
                                <p style={{ 
                                    fontSize: '14px', 
                                    color: 'var(--text-secondary)',
                                    margin: 0
                                }}>
                                    Skonfiguruj koperty w ustawieniach, aby rozpocząć zarządzanie budżetem.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Action Button */}
            <FloatingActionButton
                onAddIncome={() => setShowIncomeModal(true)}
                onAddExpense={() => setShowExpenseModal(true)}
                onTransfer={() => setShowTransferModal(true)}
            />

            {/* Modals */}
            <Suspense fallback={<div>Loading...</div>}>
                {showIncomeModal && (
                    <IncomeModal
                        onClose={() => setShowIncomeModal(false)}
                        onSave={handleIncomeSave}
                    />
                )}
                {showExpenseModal && (
                    <ExpenseModal
                        onClose={() => setShowExpenseModal(false)}
                        onSave={handleExpenseSave}
                        envelopes={[
                            ...(data?.monthlyEnvelopes?.map(e => ({
                                id: e.id,
                                name: e.name,
                                icon: e.icon,
                                type: 'monthly'
                            })) || []),
                            ...(data?.yearlyEnvelopes?.map(e => ({
                                id: e.id,
                                name: e.name,
                                icon: e.icon,
                                type: 'yearly'
                            })) || [])
                        ]}
                    />
                )}
                {showTransferModal && (
                    <TransferModal
                        onClose={() => setShowTransferModal(false)}
                        onSave={() => {
                            setShowTransferModal(false)
                            refetch()
                            showToast('Transfer został wykonany!', 'success')
                        }}
                    />
                )}
                {showCloseMonthModal && (
                    <CloseMonthModal
                        onClose={() => setShowCloseMonthModal(false)}
                        onCloseMonth={() => {
                            setShowCloseMonthModal(false)
                            refetch()
                            showToast('Miesiąc został zamknięty!', 'success')
                        }}
                    />
                )}
                {showEnvelopeTransactionsModal && selectedEnvelope && (
                    <EnvelopeTransactionsModal
                        isOpen={showEnvelopeTransactionsModal}
                        envelopeId={selectedEnvelope.id}
                        envelopeName={selectedEnvelope.name}
                        envelopeIcon={selectedEnvelope.icon}
                        onClose={() => {
                            setShowEnvelopeTransactionsModal(false)
                            setSelectedEnvelope(null)
                        }}
                    />
                )}
            </Suspense>
        </div>
    )
}