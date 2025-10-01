// app/page.tsx - ZAKTUALIZOWANY LAYOUT
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
import { FloatingActionButton } from '../components/ui/FloatingActionButton'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { TopNavigation } from '../components/ui/TopNavigation'
import { useDashboard } from '../lib/hooks/useDashboard'

// KOMPONENT CELÓW OSZCZĘDNOŚCIOWYCH - Wesele + Wakacje
interface SavingsGoal {
    id: string
    name: string
    current: number
    target: number
    monthlyContribution: number
    icon: string
}

const SavingsGoals = ({ goals }: { goals: SavingsGoal[] }) => (
    <div className="bg-white rounded-lg p-6" style={{
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)',
        border: '1px solid #f3f4f6'
    }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
            🎯 Cele oszczędnościowe
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {goals.map(goal => {
                const progress = Math.min(Math.round((goal.current / goal.target) * 100), 100)
                const monthsLeft = Math.ceil(Math.max(goal.target - goal.current, 0) / goal.monthlyContribution)
                const isCompleted = goal.current >= goal.target

                return (
                    <div key={goal.id} style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: isCompleted ? '#f0fdf4' : '#ffffff'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h4 style={{ fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '20px' }}>{goal.icon}</span>
                                {goal.name}
                            </h4>
                            <span style={{ fontSize: '18px', fontWeight: 'bold', color: isCompleted ? '#10b981' : '#059669' }}>
                                {progress}%{isCompleted && ' ✓'}
                            </span>
                        </div>

                        <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '10px', marginBottom: '12px' }}>
                            <div style={{
                                width: `${progress}%`,
                                backgroundColor: isCompleted ? '#10b981' : '#3b82f6',
                                height: '100%',
                                borderRadius: '9999px',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                            <span>{goal.current.toLocaleString()} / {goal.target.toLocaleString()} zł</span>
                            {!isCompleted && (
                                <span>{monthsLeft === 1 ? '1 miesiąc' : monthsLeft < 5 ? `${monthsLeft} miesiące` : `${monthsLeft} miesięcy`}</span>
                            )}
                            {isCompleted && (
                                <span style={{ color: '#10b981', fontWeight: '600' }}>Cel osiągnięty! 🎉</span>
                            )}
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '12px',
                            color: '#9ca3af',
                            backgroundColor: '#f9fafb',
                            padding: '8px',
                            borderRadius: '4px'
                        }}>
                            <span>💳 Miesięczna wpłata: <strong>{goal.monthlyContribution.toLocaleString()} zł</strong></span>
                            {!isCompleted && (
                                <span>Brakuje: <strong>{Math.max(goal.target - goal.current, 0).toLocaleString()} zł</strong></span>
                            )}
                        </div>

                        {isCompleted && goal.current > goal.target && (
                            <div style={{
                                marginTop: '8px',
                                padding: '6px 8px',
                                backgroundColor: '#d1fae5',
                                borderRadius: '4px',
                                fontSize: '12px',
                                color: '#065f46',
                                textAlign: 'center'
                            }}>
                                💰 Nadwyżka: {(goal.current - goal.target).toLocaleString()} zł
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    </div>
)

// KOMPONENT STAŁYCH PRZELEWÓW
const AutoTransfers = ({ totalIncome, config }: { totalIncome: number, config?: any }) => {
    const hasIncome = totalIncome > 0
    
    // Użyj wartości z konfiguracji lub domyślnych
    const transfers = [
        { id: 'joint', name: 'Konto wspólne', amount: config?.defaultToJoint || 1500, icon: '👫', status: hasIncome ? 'completed' : 'scheduled', description: 'Wydatki domowe i mieszkaniowe' },
        { id: 'wesele', name: 'Wesele (cel)', amount: config?.defaultToSavings || 1000, icon: '💍', status: hasIncome ? 'completed' : 'scheduled', description: 'Oszczędności na wesele' },
        { id: 'vacation', name: 'Wakacje', amount: config?.defaultToVacation || 420, icon: '✈️', status: hasIncome ? 'completed' : 'scheduled', description: 'Koperta wakacyjna' },
        { id: 'investment', name: 'Inwestycje', amount: config?.defaultToInvestment || 600, icon: '📈', status: hasIncome ? 'completed' : 'scheduled', description: 'Regularne inwestowanie' }
    ]

    const totalTransfers = transfers.reduce((sum, t) => sum + t.amount, 0)

    return (
        <div className="bg-white rounded-lg p-6" style={{
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)',
        border: '1px solid #f3f4f6'
    }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                💰 Stałe przelewy
            </h3>
                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                    {totalTransfers.toLocaleString()} zł
                </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {transfers.map(transfer => (
                    <div key={transfer.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px',
                        backgroundColor: transfer.status === 'completed' ? '#f0fdf4' : '#f9fafb',
                        borderRadius: '4px',
                        fontSize: '13px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <span style={{ fontSize: '16px' }}>{transfer.icon}</span>
                            <div>
                                <div style={{ fontWeight: '500', marginBottom: '2px' }}>{transfer.name}</div>
                                <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.2' }}>
                                    {transfer.description}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: '600' }}>{transfer.amount.toLocaleString()} zł</span>
                            <span style={{
                                color: transfer.status === 'completed' ? '#10b981' : '#6b7280',
                                fontSize: '14px',
                                minWidth: '16px',
                                textAlign: 'center'
                            }}>
                                {transfer.status === 'completed' ? '✓' : '📅'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            {!hasIncome && (
                <div style={{
                    marginTop: '12px',
                    padding: '8px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#92400e',
                    textAlign: 'center'
                }}>
                    💡 Przelewy zostaną wykonane po dodaniu wypłaty
                </div>
            )}
        </div>
    )
}

export default function HomePage() {
    const { data, loading, refetch } = useDashboard()
    const [showIncomeModal, setShowIncomeModal] = useState(false)
    const [showBonusModal, setShowBonusModal] = useState(false)
    const [showExpenseModal, setShowExpenseModal] = useState(false)
    const [showCloseMonthModal, setShowCloseMonthModal] = useState(false)
    const [config, setConfig] = useState<any>(null)
    const [previousMonthStatus, setPreviousMonthStatus] = useState<{
        isClosed: boolean
        monthName: string
        monthStr: string
    }>({ isClosed: false, monthName: '', monthStr: '' })

    // Pobierz konfigurację i status poprzedniego miesiąca
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const res = await fetch('/api/config', { cache: 'no-store' })
                const data = await res.json()
                setConfig(data?.config)
            } catch {
                // ignore
            }
        }
        
        const checkPreviousMonth = async () => {
            try {
                const now = new Date()
                const currentMonth = now.getMonth()
                const currentYear = now.getFullYear()
                
                // Oblicz poprzedni miesiąc
                const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
                const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear
                const previousMonthStr = `${previousYear}-${String(previousMonth + 1).padStart(2, '0')}`
                const previousMonthStart = new Date(previousYear, previousMonth, 1)
                const previousMonthEnd = new Date(previousYear, previousMonth + 1, 0, 23, 59, 59)
                const monthName = previousMonthStart.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
                
                // Sprawdź czy poprzedni miesiąc był zamknięty
                const checkResponse = await fetch('/api/transactions', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => res.json())
                
                const isClosed = checkResponse.some((t: any) => 
                    t.description?.includes('Zamknięcie miesiąca') && 
                    new Date(t.date) >= previousMonthStart && 
                    new Date(t.date) <= previousMonthEnd
                )
                
                setPreviousMonthStatus({
                    isClosed,
                    monthName,
                    monthStr: previousMonthStr
                })
            } catch {
                // ignore
            }
        }
        
        loadConfig()
        checkPreviousMonth()
    }, [])

    const calculateDaysLeft = () => {
        const now = new Date()
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        const daysLeft = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysLeft
    }

    // W app/page.tsx znajdź funkcję handleIncomeSave i zamień na:
    const handleIncomeSave = async (incomeData: {
        amount: number
        toSavings: number
        toVacation: number
        toInvestment: number
        toJoint: number
        forExpenses: number
        description?: string
        includeInStats?: boolean
        type?: string
        date?: string
    }) => {
        try {
            const response = await fetch('/api/income', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: incomeData.type || 'salary',  // użyj type z danych
                    date: incomeData.date || new Date().toISOString().split('T')[0], // użyj daty z formularza
                    ...incomeData
                })
            })

            if (response.ok) {
                refetch()
                const result = await response.json()
                alert(result.message || 'Zapisano!')
            } else {
                alert('Błąd podczas zapisywania')
            }
        } catch {
            alert('Błąd podczas zapisywania')
        }
    }

    const handleBonusSave = async (bonusData: {
        amount: number
        toGifts: number
        toInsurance: number
        toHolidays: number
        toFreedom: number
    }) => {
        try {
            const response = await fetch('/api/income', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'bonus',
                    ...bonusData
                })
            })

            if (response.ok) {
                refetch()
                alert('Premia została rozdzielona na koperty roczne!')
            } else {
                alert('Błąd podczas zapisywania')
            }
        } catch {
            alert('Błąd podczas zapisywania')
        }
    }

    const handleExpenseSave = async (expenseData: {
        amount: number
        description: string
        envelopeId: string
        category: string
        date: string
        includeInStats?: boolean  // DODANE!
    }) => {
        try {
            await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'expense',
                    amount: expenseData.amount,
                    description: expenseData.description,
                    envelopeId: expenseData.envelopeId,
                    category: expenseData.category,
                    date: expenseData.date,
                    includeInStats: expenseData.includeInStats ?? true  // DODANE - domyślnie true
                })
            })

            refetch()
            alert('Wydatek zapisany!')
        } catch {
            alert('Błąd podczas zapisywania')
        }
    }

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