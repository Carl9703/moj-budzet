'use client'

import { useState, useEffect } from 'react'
import { IncomeModal } from '../components/modals/IncomeModal'
import { ExpenseModal } from '../components/modals/ExpenseModal'
import { MonthStatus } from '../components/dashboard/MonthStatus'
import { CloseMonthModal } from '../components/modals/CloseMonthModal'
import { BonusModal } from '../components/modals/BonusModal'
import { MainBalance } from '../components/dashboard/MainBalance'
import { EnvelopeCard } from '../components/ui/EnvelopeCard'
import { QuickActions } from '../components/dashboard/QuickActions'
import { SavingsGoals } from '../components/dashboard/SavingsGoals'
import { AutoTransfers } from '../components/dashboard/AutoTransfers'
import { FloatingActionButton } from '../components/ui/FloatingActionButton'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { TopNavigation } from '../components/ui/TopNavigation'
import { useDashboard } from '../lib/hooks/useDashboard'
import { useConfig } from '../lib/hooks/useConfig'
import { usePreviousMonth } from '../lib/hooks/usePreviousMonth'
import { createIncomeHandler, createBonusHandler, createExpenseHandler } from '../lib/handlers/modalHandlers'

interface SavingsGoal {
    id: string
    name: string
    current: number
    target: number
    monthlyContribution: number
    icon: string
}


export default function HomePage() {
    const { data, loading, refetch } = useDashboard()
    const config = useConfig()
    const { previousMonthStatus, setPreviousMonthStatus } = usePreviousMonth()
    
    const [showIncomeModal, setShowIncomeModal] = useState(false)
    const [showBonusModal, setShowBonusModal] = useState(false)
    const [showExpenseModal, setShowExpenseModal] = useState(false)
    const [showCloseMonthModal, setShowCloseMonthModal] = useState(false)


    const calculateDaysLeft = () => {
        const now = new Date()
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        const daysLeft = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysLeft
    }

    const handleIncomeSave = createIncomeHandler(refetch)
    const handleBonusSave = createBonusHandler(refetch)
    const handleExpenseSave = createExpenseHandler(refetch)

    const handleCloseMonth = async () => {
        if (previousMonthStatus.isClosed) {
            alert(`${previousMonthStatus.monthName} został już zamknięty.`)
            return
        }

        try {
            const response = await fetch('/api/close-month', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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

                // Podsumowanie zamykania poprzedniego miesiąca
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

                alert(alertMessage)
            } else {
                alert('Błąd podczas zamykania poprzedniego miesiąca')
            }
        } catch {
            alert('Błąd podczas zamykania poprzedniego miesiąca')
        }
    }


    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <LoadingSpinner size="large" text="Ładowanie danych..." />
            </div>
        )
    }

    if (!data) {
        return <div>Błąd ładowania danych</div>
    }

    // Przygotuj dane dla celów oszczędnościowych - WESELE + WAKACJE
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

    // Koperty roczne BEZ Wesela i Wakacji
    const filteredYearlyEnvelopes = data.yearlyEnvelopes?.filter(e =>
        e.name !== 'Wesele' && e.name !== 'Wakacje'
    ) || []

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
            <TopNavigation />
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px' }}>

                {/* GÓRNY RZĄD - saldo, status, akcje */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <MainBalance balance={data.balance || 0} />
                    <MonthStatus
                        totalIncome={data.totalIncome || 0}
                        totalExpenses={data.totalExpenses || 0}
                        daysLeft={calculateDaysLeft()}
                        onCloseMonth={() => setShowCloseMonthModal(true)}
                        previousMonthStatus={previousMonthStatus}
                    />
                    <QuickActions
                        onAddIncome={() => setShowIncomeModal(true)}
                        onAddExpense={() => setShowExpenseModal(true)}
                    />
                </div>

                {/* GŁÓWNY LAYOUT - Responsywny */}
                <div className="grid-responsive" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: '20px'
                }}>
                    {/* LEWA - koperty miesięczne */}
                    <div>
                        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                            📅 Koperty miesięczne
                        </h2>
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {data.monthlyEnvelopes && data.monthlyEnvelopes.length > 0 ? (
                                data.monthlyEnvelopes.map((envelope) => (
                                    <EnvelopeCard key={`${envelope.id}-${envelope.current}`} {...envelope} type="monthly" />
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

                    {/* ŚRODEK - cele oszczędnościowe + stałe przelewy */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {savingsGoals.length > 0 && <SavingsGoals goals={savingsGoals} />}
                        <AutoTransfers totalIncome={data.totalIncome || 0} config={config} />
                    </div>

                    {/* PRAWA - koperty roczne (bez Wesela i Wakacji) */}
                    <div>
                        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                            📆 Koperty roczne
                        </h2>
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {filteredYearlyEnvelopes && filteredYearlyEnvelopes.length > 0 ? (
                                filteredYearlyEnvelopes.map((envelope) => (
                                    <EnvelopeCard key={envelope.id} {...envelope} type="yearly" />
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

            {/* MODAŁY */}
            {showIncomeModal && (
                <IncomeModal
                    onClose={() => setShowIncomeModal(false)}
                    onSave={handleIncomeSave}
                    onSwitchToBonus={() => { setShowIncomeModal(false); setShowBonusModal(true) }}
                />
            )}
            {showBonusModal && (
                <BonusModal onClose={() => setShowBonusModal(false)} onSave={handleBonusSave} />
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

            {/* Floating Action Button */}
            <FloatingActionButton
                onAddIncome={() => setShowIncomeModal(true)}
                onAddExpense={() => setShowExpenseModal(true)}
                onAddBonus={() => setShowBonusModal(true)}
            />
        </div>
    )
}