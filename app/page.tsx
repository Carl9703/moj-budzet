'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { MonthStatus } from '@/components/features/dashboard/MonthStatus'
import { EnvelopeCard } from '@/components/ui/EnvelopeCard'
import { EnvelopeGroup } from '@/components/features/dashboard/EnvelopeGroup'
import { PendingActions } from '@/components/features/dashboard/PendingActions'
import { FloatingActionButton } from '@/components/ui/FloatingActionButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner'
import { EnvelopeCardSkeleton, MonthStatusSkeleton } from '@/components/ui/SkeletonLoader'
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
        refetch,
        showToast
    )

    const handleExpenseSave = createExpenseHandler(
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
                    <div className="stagger-children dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '16px' }}>
                        <div className="smooth-all hover-lift">
                            <MonthStatusSkeleton />
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
        <div className="min-h-screen fade-in-up" style={{ 
            backgroundColor: '#020617' // slate-950
        }}>
            {/* Header - Quantum Budget Style */}
            <header style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                marginBottom: '32px'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '16px'
                }}>
                    <div>
                        <h2 style={{
                            fontSize: '30px',
                            fontWeight: '700',
                            color: '#f1f5f9', // white
                            margin: '0 0 4px 0'
                        }}>
                            Panel Główny
                        </h2>
                        <p style={{
                            fontSize: '14px',
                            color: '#94a3b8', // slate-400
                            margin: 0
                        }}>
                            Twoje centrum dowodzenia finansami.
                        </p>
                    </div>
                    <div style={{
                        display: 'flex',
                        gap: '8px'
                    }}>
                        <button
                            onClick={() => setShowIncomeModal(true)}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#059669', // emerald-600
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#ffffff',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 6px rgba(5, 150, 105, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#10b981' // emerald-500
                                e.currentTarget.style.transform = 'translateY(-1px)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#059669' // emerald-600
                                e.currentTarget.style.transform = 'translateY(0)'
                            }}
                        >
                            + Przychód
                        </button>
                        <button
                            onClick={() => setShowExpenseModal(true)}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#4f46e5', // indigo-600
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#ffffff',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 6px rgba(79, 70, 229, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#6366f1' // indigo-500
                                e.currentTarget.style.transform = 'translateY(-1px)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#4f46e5' // indigo-600
                                e.currentTarget.style.transform = 'translateY(0)'
                            }}
                        >
                            - Wydatek
                        </button>
                    </div>
                </div>
            </header>

                {/* Top Cards - Desktop Grid */}
                <div className="stagger-children dashboard-grid" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: '16px', 
                    marginBottom: '24px' 
                }}>
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
                </div>

                {/* Pending Actions */}
                <PendingActions />

                {/* Envelopes Section */}
                <div className="grid-responsive" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '16px'
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

                            {/* GRUPA: CELE I MAJĄTEK - połączone financial i target */}
                            {(() => {
                                const financialMonthly = data.monthlyEnvelopes.filter(e => e.group === 'financial' && e.name !== 'Fundusz Awaryjny').map(e => ({ ...e, envelopeType: 'monthly' as const }))
                                const financialYearly = (data.yearlyEnvelopes?.filter(e => e.group === 'financial' && e.name !== 'Fundusz Awaryjny') || []).map(e => ({ ...e, envelopeType: 'yearly' as const }))
                                const targetYearly = (data.yearlyEnvelopes?.filter(e => e.group === 'target' && !e.name.toLowerCase().includes('wolne środki')) || []).map(e => ({ ...e, envelopeType: 'yearly' as const }))
                                const allAssets = [...financialMonthly, ...financialYearly, ...targetYearly]
                                
                                if (allAssets.length === 0) return null
                                
                                // Oblicz sumę dla wyświetlenia w nagłówku
                                const monthlySpent = financialMonthly.reduce((sum, e) => sum + e.spent, 0)
                                const yearlyAvailable = [...financialYearly, ...targetYearly].reduce((sum, e) => sum + e.current, 0)
                                
                                return (
                                    <EnvelopeGroup
                                        title="Cele i majątek"
                                        icon="💰"
                                        color="rgba(59, 130, 246, 0.1)"
                                        envelopes={allAssets}
                                        type="monthly" // Domyślny typ, ale każda koperta ma swój envelopeType
                                        onEnvelopeClick={handleEnvelopeClick}
                                    />
                                )
                            })()}

                            {/* GRUPA 3: STYL ŻYCIA */}
                            <EnvelopeGroup
                                title="Styl życia"
                                icon="🎉"
                                color="rgba(168, 85, 247, 0.1)"
                                envelopes={data.monthlyEnvelopes.filter(e => e.group === 'lifestyle')}
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
                        envelopes={[
                            ...(data?.monthlyEnvelopes?.map(e => ({
                                id: e.id,
                                name: e.name,
                                icon: e.icon,
                                currentAmount: e.current,
                                type: 'monthly' as const
                            })) || []),
                            ...(data?.yearlyEnvelopes?.map(e => ({
                                id: e.id,
                                name: e.name,
                                icon: e.icon,
                                currentAmount: e.current,
                                type: 'yearly' as const
                            })) || [])
                        ]}
                    />
                )}
                {showCloseMonthModal && (
                    <CloseMonthModal
                        onClose={() => setShowCloseMonthModal(false)}
                        onConfirm={async () => {
                            try {
                                const response = await authorizedFetch('/api/close-month', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                })

                                if (!response.ok) {
                                    const errorData = await response.json()
                                    throw new Error(errorData.error || 'Błąd zamykania miesiąca')
                                }

                                const result = await response.json()
                                setShowCloseMonthModal(false)
                                await refetch()
                                showToast(result.message || 'Miesiąc został zamknięty!', 'success')
                            } catch (error) {
                                console.error('Error closing month:', error)
                                showToast(
                                    error instanceof Error ? error.message : 'Błąd zamykania miesiąca',
                                    'error'
                                )
                            }
                        }}
                        monthSummary={{
                            income: data?.totalIncome || 0,
                            expenses: data?.totalExpenses || 0,
                            savings: (data?.totalIncome || 0) - (data?.totalExpenses || 0)
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