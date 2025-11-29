import { memo } from 'react'
import { Card } from '@/components/ui/layout/Card'

interface Props {
    totalIncome: number
    totalExpenses: number
    daysLeft: number
    onCloseMonth: () => void
    previousMonthStatus: {
        isClosed: boolean
        monthName: string
        monthStr: string
    }
    currentDay: number
    totalDays: number
    isMonthClosed?: boolean
}

export const MonthStatus = memo(function MonthStatus({ totalIncome, totalExpenses, daysLeft, onCloseMonth, previousMonthStatus, currentDay, totalDays, isMonthClosed }: Props) {
    const balance = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0
    
    // Inteligentna logika dla przycisku zamknij miesiąc
    const canCloseMonth = () => {
        // Jeśli bieżący miesiąc jest już zamknięty, przycisk nie powinien być widoczny
        if (isMonthClosed) {
            return false
        }
        
        // Jeśli poprzedni miesiąc już zamknięty, nie można zamykać
        if (previousMonthStatus.isClosed) {
            return false
        }
        
        // Można zamykać w ostatnich 3 dniach miesiąca lub pierwszych 3 dniach nowego miesiąca
        const isLastDaysOfMonth = daysLeft <= 3
        const isFirstDaysOfNewMonth = currentDay <= 3
        
        return isLastDaysOfMonth || isFirstDaysOfNewMonth
    }
    
    const shouldShowCloseButton = canCloseMonth()

    const monthName = new Date().toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })

    return (
        <Card style={{
            backgroundColor: '#1e293b', // slate-800
            border: '1px solid #334155', // slate-700
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
        }}>
            {/* Header */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid #334155' // slate-700
            }}>
                <div>
                    <h3 style={{ 
                        fontSize: '14px', 
                        fontWeight: '700', 
                        color: '#f1f5f9', // slate-100
                        margin: '0 0 2px 0'
                    }}>
                        {monthName}
                    </h3>
                    <p style={{ 
                        fontSize: '10px', 
                        color: '#64748b', // slate-500
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                    }}>
                        Status miesiąca
                    </p>
                </div>
                {shouldShowCloseButton ? (
                    <button
                        onClick={onCloseMonth}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: '#4f46e5', // indigo-600
                            color: '#f1f5f9', // slate-100
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)'
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
                        Zamknij
                    </button>
                ) : (
                    <div style={{
                        padding: '6px 12px',
                        backgroundColor: '#0f172a', // slate-900
                        color: '#64748b', // slate-500
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '500',
                        border: '1px solid #1e293b' // slate-800
                    }}>
                        {isMonthClosed 
                            ? '✓ Zamknięty'
                            : previousMonthStatus.isClosed 
                                ? previousMonthStatus.monthName
                                : daysLeft > 3 
                                    ? `Za ${daysLeft - 3} dni`
                                    : 'Wkrótce'
                        }
                    </div>
                )}
            </div>

            {/* Financial Metrics - Single Row */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr 1fr', 
                gap: '10px'
            }}>
                <div style={{
                    padding: '12px',
                    backgroundColor: '#0f172a', // slate-900
                    borderRadius: '8px',
                    border: '1px solid #1e293b' // slate-800
                }}>
                    <div style={{ 
                        fontSize: '10px', 
                        color: '#64748b', // slate-500
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <span>💰</span> Przychody
                    </div>
                    <div style={{ 
                        fontSize: '18px',
                        fontWeight: '700', 
                        color: '#34d399', // emerald-400
                        lineHeight: '1.2'
                    }}>
                        +{totalIncome.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>PLN</span>
                    </div>
                </div>
                <div style={{
                    padding: '12px',
                    backgroundColor: '#0f172a', // slate-900
                    borderRadius: '8px',
                    border: '1px solid #1e293b' // slate-800
                }}>
                    <div style={{ 
                        fontSize: '10px', 
                        color: '#64748b', // slate-500
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <span>💸</span> Wydatki
                    </div>
                    <div style={{ 
                        fontSize: '18px',
                        fontWeight: '700', 
                        color: '#fb7185', // rose-400
                        lineHeight: '1.2'
                    }}>
                        -{totalExpenses.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>PLN</span>
                    </div>
                </div>
                <div style={{
                    padding: '12px',
                    backgroundColor: '#0f172a', // slate-900
                    borderRadius: '8px',
                    border: '1px solid #1e293b' // slate-800
                }}>
                    <div style={{ 
                        fontSize: '10px', 
                        color: '#64748b', // slate-500
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <span>📊</span> Bilans
                    </div>
                    <div style={{ 
                        fontSize: '18px',
                        fontWeight: '700', 
                        color: balance >= 0 ? '#34d399' : '#fb7185', // emerald-400 : rose-400
                        lineHeight: '1.2'
                    }}>
                        {balance >= 0 ? '+' : ''}{balance.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>PLN</span>
                    </div>
                </div>
                <div style={{
                    padding: '12px',
                    backgroundColor: '#0f172a', // slate-900
                    borderRadius: '8px',
                    border: '1px solid #1e293b' // slate-800
                }}>
                    <div style={{ 
                        fontSize: '10px', 
                        color: '#64748b', // slate-500
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <span>💎</span> Oszczędności
                    </div>
                    <div style={{ 
                        fontSize: '18px',
                        fontWeight: '700', 
                        color: savingsRate >= 20 ? '#34d399' : (savingsRate > 0 ? '#fbbf24' : '#fb7185'), // emerald-400 : amber-400 : rose-400
                        lineHeight: '1.2'
                    }}>
                        {savingsRate.toFixed(1)}%
                    </div>
                </div>
            </div>
        </Card>
    )
})