'use client'

interface MetricData {
    income: number
    expense: number
    balance: number
    savingsRate: number
}

interface ComparisonData {
    income: number
    expense: number
    balance: number
    savingsRate: number
}

interface KeyMetricsProps {
    currentPeriod: MetricData
    previousPeriod?: ComparisonData
    compareMode: boolean
    loading?: boolean
}

export function KeyMetrics({ currentPeriod, previousPeriod, compareMode, loading = false }: KeyMetricsProps) {
    const formatMoney = (amount: number | undefined) => {
        if (amount === undefined || amount === null || isNaN(amount)) return '0 zł'
        return amount.toLocaleString('pl-PL') + ' zł'
    }
    
    const formatPercentage = (value: number) => {
        const sign = value >= 0 ? '+' : ''
        return `${sign}${value.toFixed(1)}%`
    }

    const getChangeColor = (change: number, isExpense: boolean = true) => {
        if (change === 0) return 'var(--text-secondary)'
        if (isExpense) {
            return change < 0 ? 'var(--accent-success)' : 'var(--accent-error)'
        } else {
            return change > 0 ? 'var(--accent-success)' : 'var(--accent-error)'
        }
    }

    const getChangeIcon = (change: number) => {
        if (change > 0) return '📈'
        if (change < 0) return '📉'
        return '➡️'
    }

    const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return 0
        return ((current - previous) / previous) * 100
    }

    if (loading) {
        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '24px'
            }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                        backgroundColor: 'var(--bg-secondary)',
                        padding: '24px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-primary)',
                        boxShadow: 'var(--shadow-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '120px'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: '50%',
                            marginBottom: '12px',
                            animation: 'pulse 2s infinite'
                        }} />
                        <div style={{
                            width: '80%',
                            height: '16px',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: '4px',
                            animation: 'pulse 2s infinite'
                        }} />
                    </div>
                ))}
            </div>
        )
    }

    const metrics = [
        {
            title: 'Całkowity Przychód',
            value: currentPeriod.income,
            icon: '💰',
            color: 'var(--accent-success)',
            bgColor: 'var(--bg-success)',
            change: compareMode && previousPeriod ? calculateChange(currentPeriod.income, previousPeriod.income) : undefined
        },
        {
            title: 'Całkowity Wydatek',
            value: currentPeriod.expense,
            icon: '💸',
            color: 'var(--accent-error)',
            bgColor: 'var(--bg-error)',
            change: compareMode && previousPeriod ? calculateChange(currentPeriod.expense, previousPeriod.expense) : undefined,
            isExpense: true
        },
        {
            title: 'Bilans',
            value: currentPeriod.balance,
            icon: '⚖️',
            color: currentPeriod.balance >= 0 ? 'var(--accent-success)' : 'var(--accent-error)',
            bgColor: currentPeriod.balance >= 0 ? 'var(--bg-success)' : 'var(--bg-error)',
            change: compareMode && previousPeriod ? calculateChange(currentPeriod.balance, previousPeriod.balance) : undefined
        },
        {
            title: 'Stopa Oszczędności',
            value: currentPeriod.savingsRate,
            icon: '🎯',
            color: currentPeriod.savingsRate >= 0.2 ? 'var(--accent-success)' : currentPeriod.savingsRate >= 0.1 ? 'var(--accent-warning)' : 'var(--accent-error)',
            bgColor: currentPeriod.savingsRate >= 0.2 ? 'var(--bg-success)' : currentPeriod.savingsRate >= 0.1 ? 'var(--bg-warning)' : 'var(--bg-error)',
            change: compareMode && previousPeriod ? calculateChange(currentPeriod.savingsRate, previousPeriod.savingsRate) : undefined,
            isPercentage: true
        }
    ]

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '24px'
        }}>
            {metrics.map((metric, index) => (
                <div key={index} style={{
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '24px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-primary)',
                    boxShadow: 'var(--shadow-md)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Tło z kolorem */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        backgroundColor: metric.color
                    }} />

                    {/* Ikona */}
                    <div style={{
                        fontSize: '32px',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <span>{metric.icon}</span>
                        {metric.change !== undefined && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: getChangeColor(metric.change, metric.isExpense)
                            }}>
                                <span>{getChangeIcon(metric.change)}</span>
                                <span>{formatPercentage(metric.change)}</span>
                            </div>
                        )}
                    </div>

                    {/* Tytuł */}
                    <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: 'var(--text-secondary)',
                        marginBottom: '8px'
                    }}>
                        {metric.title}
                    </div>

                    {/* Wartość */}
                    <div style={{
                        fontSize: '28px',
                        fontWeight: 'bold',
                        color: metric.color,
                        marginBottom: '8px',
                        lineHeight: 1.2
                    }}>
                        {metric.isPercentage ? `${(metric.value * 100).toFixed(1)}%` : formatMoney(metric.value)}
                    </div>

                    {/* Porównanie z poprzednim okresem */}
                    {compareMode && previousPeriod && metric.change !== undefined && (
                        <div style={{
                            padding: '8px 12px',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: '6px',
                            border: '1px solid var(--border-primary)',
                            fontSize: '12px'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '4px'
                            }}>
                                <span style={{ color: 'var(--text-secondary)' }}>vs. Poprzedni okres:</span>
                                <span style={{
                                    fontWeight: '600',
                                    color: getChangeColor(metric.change, metric.isExpense)
                                }}>
                                    {getChangeIcon(metric.change)} {formatPercentage(metric.change)}
                                </span>
                            </div>
                            <div style={{
                                color: 'var(--text-secondary)',
                                fontSize: '11px'
                            }}>
                                {metric.isPercentage 
                                    ? `Poprzednio: ${((previousPeriod?.savingsRate || 0) * 100).toFixed(1)}%`
                                    : `Poprzednio: ${formatMoney(
                                        metric.title === 'Całkowity Przychód' ? previousPeriod?.income :
                                        metric.title === 'Całkowity Wydatek' ? previousPeriod?.expense :
                                        metric.title === 'Bilans' ? previousPeriod?.balance :
                                        0
                                    )}`
                                }
                            </div>
                        </div>
                    )}

                    {/* Wskaźnik postępu dla stopy oszczędności */}
                    {metric.title === 'Stopa Oszczędności' && (
                        <div style={{
                            marginTop: '12px',
                            padding: '8px',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: '6px'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '4px',
                                fontSize: '12px',
                                color: 'var(--text-secondary)'
                            }}>
                                <span>Cel: 20%</span>
                                <span>{((metric.value / 0.2) * 100).toFixed(0)}% celu</span>
                            </div>
                            <div style={{
                                width: '100%',
                                height: '6px',
                                backgroundColor: 'var(--bg-quaternary)',
                                borderRadius: '3px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${Math.min((metric.value / 0.2) * 100, 100)}%`,
                                    height: '100%',
                                    backgroundColor: metric.color,
                                    borderRadius: '3px',
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
