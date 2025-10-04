'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { MonthStatus } from '../components/dashboard/MonthStatus'
import { MainBalance } from '../components/dashboard/MainBalance'
import { EnvelopeCard } from '../components/ui/EnvelopeCard'
import { QuickActions } from '../components/dashboard/QuickActions'
import { SavingsGoals } from '../components/dashboard/SavingsGoals'
import { AutoTransfers } from '../components/dashboard/AutoTransfers'
import { FloatingActionButton } from '../components/ui/FloatingActionButton'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { TopNavigation } from '../components/ui/TopNavigation'
import { EnvelopeCardSkeleton, MainBalanceSkeleton, MonthStatusSkeleton, QuickActionsSkeleton } from '../components/ui/SkeletonLoader'
import { useToast } from '../components/ui/Toast'
import { useDashboard } from '../lib/hooks/useDashboard'
import { authorizedFetch } from '../lib/utils/api'
import { useConfig } from '../lib/hooks/useConfig'
import { usePreviousMonth } from '../lib/hooks/usePreviousMonth'
import { useAuth } from '../lib/hooks/useAuth'
import { createIncomeHandler, createExpenseHandler } from '../lib/handlers/modalHandlers'

const IncomeModal = lazy(() => import('../components/modals/IncomeModal').then(m => ({ default: m.IncomeModal })))
const ExpenseModal = lazy(() => import('../components/modals/ExpenseModal').then(m => ({ default: m.ExpenseModal })))
const CloseMonthModal = lazy(() => import('../components/modals/CloseMonthModal').then(m => ({ default: m.CloseMonthModal })))

interface SavingsGoal {
    id: string
    name: string
    current: number
    target: number
    monthlyContribution: number
    icon: string
}


export default function HomePage() {
    const router = useRouter()
    const { isAuthenticated, isCheckingAuth } = useAuth()
    
    const { data, loading, refetch } = useDashboard()
    const config = useConfig()
    const { previousMonthStatus, setPreviousMonthStatus } = usePreviousMonth()
    const { showToast } = useToast()
    
    const [showIncomeModal, setShowIncomeModal] = useState(false)
    const [showExpenseModal, setShowExpenseModal] = useState(false)
    const [showCloseMonthModal, setShowCloseMonthModal] = useState(false)

    const calculateDaysLeft = () => {
        const now = new Date()
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        const daysLeft = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysLeft
    }

    const handleIncomeSave = createIncomeHandler(refetch, showToast)
    const handleExpenseSave = createExpenseHandler(refetch, showToast)

    const handleCloseMonth = async () => {
        if (previousMonthStatus.isClosed) {
            showToast(`${previousMonthStatus.monthName} został już zamknięty.`, 'warning')
            return
        }

        try {
            const response = await authorizedFetch('/api/close-month', {
                method: 'POST',
                body: JSON.stringify({ month: previousMonthStatus.monthStr }),
                cache: 'no-store'
            })

            if (response.ok) {
                const result = await response.json()
                setShowCloseMonthModal(false)

                // Zaktualizuj status poprzedniego miesiąca
                setPreviousMonthStatus(prev => ({ ...prev, isClosed: true }))

                setTimeout(() => {
                    refetch()
                    window.location.reload()
                }, 500)

                const summary = result.summary
                
                let alertMessage = `✅ Zamknięto ${previousMonthStatus.monthName}\n\n📊 SZCZEGÓŁY ZAMKNIĘCIA:\n`

                if (summary.statsIncome > 0) {
                    alertMessage += `• Przychody (w statystykach): ${summary.statsIncome.toLocaleString()} zł\n`
                }

                if (summary.nonStatsIncome > 0) {
                    alertMessage += `• Zwroty (poza statystykami): ${summary.nonStatsIncome.toLocaleString()} zł\n`
                }

                alertMessage += `• Wydatki: ${summary.totalExpenses.toLocaleString()} zł\n`

                if (summary.monthBalance > 0) {
                    alertMessage += `• Oszczędności: ${summary.monthBalance.toLocaleString()} zł\n`
                }

                if (summary.returnsBalance > 0) {
                    alertMessage += `• Zwroty: ${summary.returnsBalance.toLocaleString()} zł\n`
                }

                alertMessage += `• Stopa oszczędności: ${summary.savingsRate}%\n`
                alertMessage += `• Przeniesiono łącznie: ${summary.totalTransferred.toLocaleString()} zł`

                if (summary.unusedFunds > 0) {
                    alertMessage += `\n• Niewykorzystane z kopert: ${summary.unusedFunds.toLocaleString()} zł`
                }

                        showToast('Miesiąc został pomyślnie zamknięty!', 'success')
                    } else {
                        showToast('Błąd podczas zamykania poprzedniego miesiąca', 'error')
                    }
                } catch {
                    showToast('Błąd podczas zamykania poprzedniego miesiąca', 'error')
                }
    }

    if (isCheckingAuth) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <LoadingSpinner size="large" text="Sprawdzanie autoryzacji..." />
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    if (loading) {
        return (
            <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <TopNavigation />
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <MainBalanceSkeleton />
                        <MonthStatusSkeleton />
                        <QuickActionsSkeleton />
                    </div>

                    <div className="grid-responsive" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '20px'
                    }}>
                        <div>
                            <div style={{ 
                                width: '150px', 
                                height: '20px', 
                                backgroundColor: 'var(--bg-tertiary)', 
                                borderRadius: '4px', 
                                marginBottom: '12px' 
                            }} />
                            <div style={{ display: 'grid', gap: '10px' }}>
                                {[1, 2, 3, 4].map(i => <EnvelopeCardSkeleton key={i} />)}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ 
                                backgroundColor: 'white', 
                                padding: '20px', 
                                borderRadius: '12px',
                                border: '1px solid #e5e7eb'
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

    if (!data) {
        return <div>Błąd ładowania danych</div>
    }

    const weseLeEnvelope = data.yearlyEnvelopes?.find(e => e.name === 'Wesele')
    const wakacjeEnvelope = data.yearlyEnvelopes?.find(e => e.name === 'Wakacje')

    const savingsGoals: SavingsGoal[] = []
    if (weseLeEnvelope) {
        savingsGoals.push({
            id: 'wesele',
            name: 'Wesele',
            current: weseLeEnvelope.current,
            target: weseLeEnvelope.planned,
            monthlyContribution: 1000,
            icon: '💑'
        })
    }
    if (wakacjeEnvelope) {
        savingsGoals.push({
            id: 'wakacje',
            name: 'Wakacje',
            current: wakacjeEnvelope.current,
            target: wakacjeEnvelope.planned,
            monthlyContribution: 420,
            icon: '✈️'
        })
    }

    const filteredYearlyEnvelopes = data.yearlyEnvelopes?.filter(e =>
        e.name !== 'Wesele' && e.name !== 'Wakacje'
    ) || []

    return (
        <div className="min-h-screen fade-in-up bg-theme-primary">
            <TopNavigation />
            <div className="container-wide" style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px' }}>
                <div className="stagger-children dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="smooth-all hover-lift">
                        <MainBalance balance={data.balance || 0} />
                    </div>
                    <div className="smooth-all hover-lift">
                        <MonthStatus
                            totalIncome={data.totalIncome || 0}
                            totalExpenses={data.totalExpenses || 0}
                            daysLeft={calculateDaysLeft()}
                            onCloseMonth={() => setShowCloseMonthModal(true)}
                            previousMonthStatus={previousMonthStatus}
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
                    <div className="slide-in-left">
                        <h2 className="section-header" style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                            📅 Koperty miesięczne
                        </h2>
                        <div className="stagger-children" style={{ display: 'grid', gap: '10px' }}>
                            {data.monthlyEnvelopes && data.monthlyEnvelopes.length > 0 ? (
                                data.monthlyEnvelopes.map((envelope, index) => (
                                    <div key={`${envelope.id}-${envelope.current}`} className="smooth-all hover-lift" style={{ animationDelay: `${index * 0.1}s` }}>
                                        <EnvelopeCard {...envelope} type="monthly" />
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    icon="📦"
                                    title="Brak kopert miesięcznych"
                                    description="Skontaktuj się z administratorem, aby skonfigurować koperty miesięczne."
                                    variant="warning"
                                />
                            )}
                        </div>
                    </div>

                    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {savingsGoals.length > 0 && (
                            <div className="smooth-all hover-lift">
                                <SavingsGoals goals={savingsGoals} />
                            </div>
                        )}
                        <div className="smooth-all hover-lift">
                            <AutoTransfers totalIncome={data.totalIncome || 0} config={config} />
                        </div>
                    </div>

                    <div className="slide-in-right">
                        <h2 className="section-header" style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                            📆 Koperty roczne
                        </h2>
                        <div className="stagger-children" style={{ display: 'grid', gap: '10px' }}>
                            {filteredYearlyEnvelopes && filteredYearlyEnvelopes.length > 0 ? (
                                filteredYearlyEnvelopes.map((envelope, index) => (
                                    <div key={envelope.id} className="smooth-all hover-lift" style={{ animationDelay: `${index * 0.1}s` }}>
                                        <EnvelopeCard {...envelope} type="yearly" />
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    icon="📆"
                                    title="Brak kopert rocznych"
                                    description="Skontaktuj się z administratorem, aby skonfigurować koperty roczne."
                                    variant="warning"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Suspense fallback={<div />}>
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
                            ...(data.monthlyEnvelopes?.map(e => ({
                                id: e.id,
                                name: e.name,
                                icon: e.icon,
                                type: 'monthly'
                            })) || []),
                            ...(data.yearlyEnvelopes?.map(e => ({
                                id: e.id,
                                name: e.name,
                                icon: e.icon,
                                type: 'yearly'
                            })) || [])
                        ]}
                    />
                )}
                {showCloseMonthModal && (
                    <CloseMonthModal
                        onClose={() => setShowCloseMonthModal(false)}
                        onConfirm={handleCloseMonth}
                        monthName={previousMonthStatus.monthName}
                        monthSummary={{
                            income: data.totalIncome || 0,
                            expenses: data.totalExpenses || 0,
                            savings: (data.totalIncome || 0) - (data.totalExpenses || 0)
                        }}
                    />
                )}
            </Suspense>

            <FloatingActionButton
                onAddIncome={() => setShowIncomeModal(true)}
                onAddExpense={() => setShowExpenseModal(true)}
                onAddBonus={() => setShowIncomeModal(true)}
                onAnalytics={() => router.push('/analytics')}
            />
        </div>
    )
}