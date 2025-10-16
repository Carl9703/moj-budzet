'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { MonthStatus } from '../components/dashboard/MonthStatus'
import { MainBalance } from '../components/dashboard/MainBalance'
import { EnvelopeCard } from '../components/ui/EnvelopeCard'
import { EnvelopeGroup } from '../components/dashboard/EnvelopeGroup'
import { QuickActions } from '../components/dashboard/QuickActions'
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
const TransferModal = lazy(() => import('../components/modals/TransferModal').then(m => ({ default: m.TransferModal })))
const CloseMonthModal = lazy(() => import('../components/modals/CloseMonthModal').then(m => ({ default: m.CloseMonthModal })))

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
    const [showTransferModal, setShowTransferModal] = useState(false)

    const calculateDaysLeft = () => {
        const now = new Date()
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        const daysLeft = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysLeft
    }

    const handleIncomeSave = createIncomeHandler(refetch, showToast)
    const handleExpenseSave = createExpenseHandler(refetch, showToast)
    
    const handleTransferSave = async (transferData: any) => {
        try {
            const response = await authorizedFetch('/api/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transferData)
            })

            const data = await response.json()
            
            if (response.ok && data.success) {
                showToast(data.message, 'success')
                refetch()
            } else {
                showToast(data.error || 'Błąd podczas transferu', 'error')
            }
        } catch (error) {
            console.error('Transfer error:', error)
            showToast('Błąd podczas wykonywania transferu', 'error')
        }
    }

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


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <TopNavigation />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Dashboard Finansowy
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Zarządzaj swoim budżetem w prosty i intuicyjny sposób
                    </p>
                </div>

                {/* Top Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="animate-in fade-in-up duration-500">
                        <MainBalance balance={data.balance || 0} />
                    </div>
                    <div className="animate-in fade-in-up duration-500 delay-100">
                        <MonthStatus
                            totalIncome={data.totalIncome || 0}
                            totalExpenses={data.totalExpenses || 0}
                            daysLeft={calculateDaysLeft()}
                            onCloseMonth={() => setShowCloseMonthModal(true)}
                            previousMonthStatus={previousMonthStatus}
                        />
                    </div>
                    <div className="animate-in fade-in-up duration-500 delay-200">
                        <QuickActions
                            onAddIncome={() => setShowIncomeModal(true)}
                            onAddExpense={() => setShowExpenseModal(true)}
                        />
                    </div>
                </div>

                {/* Envelopes Section */}
                <div className="space-y-8">
                    {/* Fundusze celowe */}
                    <div className="animate-in fade-in-up duration-500 delay-300">
                        <EnvelopeGroup
                            title="Fundusze celowe"
                            icon="🎯"
                            color="rgba(245, 158, 11, 0.1)"
                            envelopes={data.yearlyEnvelopes?.filter(e => e.group === 'target') || []}
                            type="yearly"
                        />
                    </div>

                    {/* Sprawdź czy użytkownik ma koperty miesięczne */}
                    {data.monthlyEnvelopes && data.monthlyEnvelopes.length > 0 ? (
                        <>
                            {/* GRUPA 1: POTRZEBY */}
                            <EnvelopeGroup
                                title="Potrzeby"
                                icon="🏡"
                                color="rgba(34, 197, 94, 0.1)"
                                envelopes={data.monthlyEnvelopes.filter(e => e.group === 'needs')}
                                type="monthly"
                            />
                            
                            {/* GRUPA 2: STYL ŻYCIA */}
                            <EnvelopeGroup
                                title="Styl życia"
                                icon="🎉"
                                color="rgba(168, 85, 247, 0.1)"
                                envelopes={data.monthlyEnvelopes.filter(e => e.group === 'lifestyle')}
                                type="monthly"
                            />
                            
                            {/* GRUPA 3: CELE FINANSOWE */}
                            <EnvelopeGroup
                                title="Cele finansowe"
                                icon="🎯"
                                color="rgba(59, 130, 246, 0.1)"
                                envelopes={data.monthlyEnvelopes.filter(e => e.group === 'financial')}
                                type="monthly"
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
                                    fontSize: '16px', 
                                    fontWeight: '600', 
                                    marginBottom: '8px', 
                                    color: 'var(--text-primary)' 
                                }}>
                                    Brak kopert miesięcznych
                                </h3>
                                <p style={{ 
                                    fontSize: '14px', 
                                    color: 'var(--text-secondary)', 
                                    marginBottom: '16px' 
                                }}>
                                    Utwórz koperty miesięczne, aby rozpocząć zarządzanie budżetem.
                                </p>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button 
                                        onClick={async () => {
                                            try {
                                                const response = await authorizedFetch('/api/setup-envelopes', {
                                                    method: 'POST'
                                                })
                                                if (response.ok) {
                                                    showToast('Koperty zostały utworzone pomyślnie!', 'success')
                                                    refetch()
                                                } else {
                                                    showToast('Błąd podczas tworzenia kopert', 'error')
                                                }
                                            } catch (error) {
                                                showToast('Błąd podczas tworzenia kopert', 'error')
                                            }
                                        }}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: 'var(--accent-primary)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Utwórz koperty
                                    </button>
                                    
                                    <button 
                                        onClick={async () => {
                                            try {
                                                const response = await authorizedFetch('/api/fix-envelope-groups', {
                                                    method: 'POST'
                                                })
                                                if (response.ok) {
                                                    showToast('Grupy kopert zostały naprawione!', 'success')
                                                    refetch()
                                                } else {
                                                    showToast('Błąd podczas naprawy grup kopert', 'error')
                                                }
                                            } catch (error) {
                                                showToast('Błąd podczas naprawy grup kopert', 'error')
                                            }
                                        }}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: 'var(--success-primary)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        🔧 Napraw grupy
                                    </button>
                                    
                                    <button 
                                        onClick={async () => {
                                            if (confirm('Czy na pewno chcesz wyczyścić wszystkie dane? Ta operacja jest nieodwracalna!')) {
                                                try {
                                                    const response = await authorizedFetch('/api/reset-database', {
                                                        method: 'POST'
                                                    })
                                                    if (response.ok) {
                                                        showToast('Dane zostały wyczyszczone!', 'success')
                                                        refetch()
                                                    } else {
                                                        showToast('Błąd podczas czyszczenia danych', 'error')
                                                    }
                                                } catch (error) {
                                                    showToast('Błąd podczas czyszczenia danych', 'error')
                                                }
                                            }
                                        }}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: 'var(--error-primary)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        🗑️ Wyczyść dane
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* STAŁE PRZELEWY - FULL WIDTH SECTION */}
                <div className="fade-in-up" style={{ 
                    marginTop: '24px',
                    width: '100%'
                }}>
                    <div className="smooth-all hover-lift">
                        <AutoTransfers totalIncome={data.totalIncome || 0} config={config} transactions={data.transactions || []} />
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
                {showTransferModal && (
                    <TransferModal
                        key={`transfer-${data?.balance || 0}`}
                        onClose={() => setShowTransferModal(false)}
                        onSave={handleTransferSave}
                        envelopes={[
                            ...(data.monthlyEnvelopes?.map(e => ({
                                id: e.id,
                                name: e.name,
                                icon: e.icon,
                                type: 'monthly' as const,
                                currentAmount: e.current
                            })) || []),
                            ...(data.yearlyEnvelopes?.map(e => ({
                                id: e.id,
                                name: e.name,
                                icon: e.icon,
                                type: 'yearly' as const,
                                currentAmount: e.current
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
                onTransfer={() => setShowTransferModal(true)}
                onAnalytics={() => router.push('/analytics')}
                onHistory={() => router.push('/history')}
                onArchive={() => router.push('/archive')}
                onConfig={() => router.push('/config')}
            />
        </div>
    )
}