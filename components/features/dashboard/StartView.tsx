'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Calendar, Target, AlertCircle, CheckCircle } from 'lucide-react'
import { authorizedFetch } from '@/lib/utils/api'
import { ActionsCenter } from './ActionsCenter'

interface DashboardData {
    mainBalance: number
    availableFunds: number
    monthlyIncome: number
    monthlyExpenses: number
    savingsRate: number
    daysRemaining: number
    dailyBudget: number
    monthProgress: number
    totalDays: number
    yearlyEnvelopes: Array<{
        id: string
        name: string
        icon: string
        spent: number
        planned: number
        current: number
        group?: string
    }>
}

export function StartView() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const response = await authorizedFetch('/api/dashboard')
                const result = await response.json()
                
                if (result.success) {
                    setData({
                        mainBalance: result.mainBalance || 0,
                        availableFunds: result.availableFunds || 0,
                        monthlyIncome: result.monthlyIncome || 0,
                        monthlyExpenses: result.monthlyExpenses || 0,
                        savingsRate: result.savingsRate || 0,
                        daysRemaining: result.daysRemaining || 0,
                        dailyBudget: result.dailyBudget || 0,
                        monthProgress: result.monthProgress || 0,
                        totalDays: result.totalDays || 31,
                        yearlyEnvelopes: result.yearlyEnvelopes || []
                    })
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '400px',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: 'var(--border-radius-main)'
            }}>
                <div className="spinner" />
            </div>
        )
    }

    if (!data) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '400px',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: 'var(--border-radius-main)',
                color: 'var(--text-secondary)'
            }}>
                <p>Błąd ładowania danych</p>
            </div>
        )
    }

    const balance = data.mainBalance
    const isPositive = balance >= 0
    const balanceColor = isPositive ? 'var(--color-success)' : 'var(--color-error)'
    
    const savingsColor = data.savingsRate >= 0 ? 'var(--color-success)' : 'var(--color-error)'
    const dailyBudgetColor = data.dailyBudget >= 0 ? 'var(--color-success)' : 'var(--color-error)'

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 'var(--space-s)'
        }}>
            {/* CENTRUM AKCJI - NA GÓRZE */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 'var(--border-radius-small)',
                padding: 'var(--space-s)',
                boxShadow: '0 4px 10px rgba(102, 126, 234, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                marginTop: 'var(--space-l)'
            }}>
                {/* Background Pattern */}
                <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    animation: 'float 20s ease-in-out infinite',
                    opacity: 0.3
                }} />
                
                <div style={{
                    position: 'relative',
                    zIndex: 1
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--space-s)'
                    }}>
                        <div>
                            <h1 style={{
                                fontSize: 'var(--font-size-m)',
                                fontWeight: 'var(--font-weight-bold)',
                                color: 'white',
                                margin: 0,
                                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}>
                                🎯 Centrum Akcji
                            </h1>
                        </div>
                        <div style={{
                            fontSize: '24px',
                            opacity: 0.8,
                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                        }}>
                            ⚡
                        </div>
                    </div>
                    
                    <ActionsCenter />
                </div>
            </div>

            {/* GŁÓWNE INFORMACJE - GRID */}
            <div className="grid-responsive start-view-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 'var(--space-s)',
                alignItems: 'stretch',
                minHeight: '400px',
                flexShrink: 0
            }}>
                {/* KONTO GŁÓWNE */}
                <div className="start-view-card" style={{
                    background: 'linear-gradient(145deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                    borderRadius: 'var(--border-radius-small)',
                    padding: 'var(--space-m)',
                    border: '1px solid var(--border-primary)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Background Accent */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))'
                    }} />
                    
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--space-s)'
                    }}>
                        <div>
                            <h2 className="start-view-header" style={{
                                fontSize: 'var(--font-size-l)',
                                fontWeight: 'var(--font-weight-bold)',
                                color: 'var(--text-primary)',
                                margin: 0
                            }}>
                                💰 Konto główne
                            </h2>
                            <p style={{
                                fontSize: 'var(--font-size-s)',
                                color: 'var(--text-secondary)',
                                margin: '4px 0 0 0'
                            }}>
                                Saldo dostępne
                            </p>
                        </div>
                        <div style={{
                            fontSize: '48px',
                            opacity: 0.6,
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                        }}>
                            💳
                        </div>
                    </div>
                    
                    <div style={{
                        fontSize: 'var(--font-size-xl)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: balanceColor,
                        marginBottom: 'var(--space-s)',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        {balance.toFixed(2)} zł
                    </div>
                    
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-s)',
                        padding: 'var(--space-m)',
                        backgroundColor: 'rgba(74, 144, 226, 0.1)',
                        borderRadius: 'var(--border-radius-small)',
                        border: '1px solid rgba(74, 144, 226, 0.2)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <div style={{ fontSize: '24px' }}>💎</div>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontSize: 'var(--font-size-m)',
                                fontWeight: 'var(--font-weight-semibold)',
                                color: 'var(--text-primary)',
                                marginBottom: '2px'
                            }}>
                                Wolne środki
                            </div>
                            <div style={{
                                fontSize: 'var(--font-size-s)',
                                color: 'var(--text-secondary)'
                            }}>
                                Dostępne do wydania
                            </div>
                        </div>
                        <div style={{
                            fontSize: 'var(--font-size-xl)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: 'var(--brand-primary)'
                        }}>
                            {(data.yearlyEnvelopes?.find(e => e.name.toLowerCase().includes('wolne środki'))?.current || 0).toFixed(2)} zł
                        </div>
                    </div>
                </div>

                {/* STATUS MIESIĄCA */}
                <div className="start-view-card" style={{
                    background: 'linear-gradient(145deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                    borderRadius: 'var(--border-radius-small)',
                    padding: 'var(--space-l)',
                    border: '1px solid var(--border-primary)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Background Accent */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, var(--color-success), var(--color-info))'
                    }} />
                    
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--space-s)'
                    }}>
                        <div>
                            <h2 className="start-view-header" style={{
                                fontSize: 'var(--font-size-l)',
                                fontWeight: 'var(--font-weight-bold)',
                                color: 'var(--text-primary)',
                                margin: 0
                            }}>
                                📊 Status miesiąca
                            </h2>
                            <p style={{
                                fontSize: 'var(--font-size-s)',
                                color: 'var(--text-secondary)',
                                margin: '4px 0 0 0'
                            }}>
                                Analiza finansowa
                            </p>
                        </div>
                        <div style={{
                            fontSize: '48px',
                            opacity: 0.6,
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                        }}>
                            📈
                        </div>
                    </div>

                    {/* Przychody i Wydatki */}
                    <div className="start-view-stats" style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 'var(--space-s)',
                        marginBottom: 'var(--space-s)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-s)',
                            padding: 'var(--space-s)',
                            background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.1) 0%, rgba(46, 204, 113, 0.05) 100%)',
                            borderRadius: 'var(--border-radius-small)',
                            border: '1px solid rgba(46, 204, 113, 0.2)',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-success)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}>
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <div style={{
                                    fontSize: 'var(--font-size-s)',
                                    color: 'var(--color-success-dark)',
                                    fontWeight: 'var(--font-weight-medium)',
                                    marginBottom: '2px'
                                }}>
                                    Przychody
                                </div>
                                <div style={{
                                    fontSize: 'var(--font-size-l)',
                                    fontWeight: 'var(--font-weight-bold)',
                                    color: 'var(--color-success-dark)'
                                }}>
                                    +{data.monthlyIncome.toFixed(2)} zł
                                </div>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-s)',
                            padding: 'var(--space-s)',
                            background: 'linear-gradient(135deg, rgba(231, 76, 60, 0.1) 0%, rgba(231, 76, 60, 0.05) 100%)',
                            borderRadius: 'var(--border-radius-small)',
                            border: '1px solid rgba(231, 76, 60, 0.2)',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-error)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}>
                                <TrendingDown size={20} />
                            </div>
                            <div>
                                <div style={{
                                    fontSize: 'var(--font-size-s)',
                                    color: 'var(--color-error-dark)',
                                    fontWeight: 'var(--font-weight-medium)',
                                    marginBottom: '2px'
                                }}>
                                    Wydatki
                                </div>
                                <div style={{
                                    fontSize: 'var(--font-size-l)',
                                    fontWeight: 'var(--font-weight-bold)',
                                    color: 'var(--color-error-dark)'
                                }}>
                                    {data.monthlyExpenses.toFixed(2)} zł
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bilans i Oszczędności */}
                    <div className="start-view-stats" style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 'var(--space-s)',
                        marginBottom: 'var(--space-s)'
                    }}>
                        <div style={{
                            padding: 'var(--space-s)',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: 'var(--border-radius-small)',
                            border: '1px solid var(--border-primary)',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                fontSize: 'var(--font-size-s)',
                                color: 'var(--text-secondary)',
                                fontWeight: 'var(--font-weight-medium)',
                                marginBottom: '4px'
                            }}>
                                Bilans
                            </div>
                            <div style={{
                                fontSize: 'var(--font-size-xl)',
                                fontWeight: 'var(--font-weight-bold)',
                                color: balanceColor
                            }}>
                                {balance.toFixed(2)} zł
                            </div>
                        </div>

                        <div style={{
                            padding: 'var(--space-s)',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: 'var(--border-radius-small)',
                            border: '1px solid var(--border-primary)',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                fontSize: 'var(--font-size-s)',
                                color: 'var(--text-secondary)',
                                fontWeight: 'var(--font-weight-medium)',
                                marginBottom: '4px'
                            }}>
                                Oszczędności
                            </div>
                            <div style={{
                                fontSize: 'var(--font-size-xl)',
                                fontWeight: 'var(--font-weight-bold)',
                                color: savingsColor
                            }}>
                                {data.savingsRate.toFixed(1)}%
                            </div>
                        </div>
                    </div>

                    {/* Postęp miesiąca */}
                    <div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 'var(--space-s)'
                        }}>
                            <span style={{
                                fontSize: 'var(--font-size-s)',
                                color: 'var(--text-secondary)',
                                fontWeight: 'var(--font-weight-medium)'
                            }}>
                                📅 Do końca miesiąca: {data.daysRemaining} dni
                            </span>
                            <span style={{
                                fontSize: 'var(--font-size-s)',
                                color: dailyBudgetColor,
                                fontWeight: 'var(--font-weight-semibold)'
                            }}>
                                Dzienny budżet: {data.dailyBudget.toFixed(0)} zł
                            </span>
                        </div>
                        
                        <div style={{
                            width: '100%',
                            height: '12px',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            <div style={{
                                width: `${(data.monthProgress / data.totalDays) * 100}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))',
                                borderRadius: '6px',
                                transition: 'width 0.5s ease',
                                position: 'relative'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                    animation: 'shimmer 2s ease-in-out infinite'
                                }} />
                            </div>
                        </div>
                        
                        <div style={{
                            textAlign: 'center',
                            marginTop: 'var(--space-s)',
                            fontSize: 'var(--font-size-s)',
                            color: 'var(--text-secondary)',
                            fontWeight: 'var(--font-weight-medium)'
                        }}>
                            {data.monthProgress}/{data.totalDays} dni ({Math.round((data.monthProgress / data.totalDays) * 100)}%)
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
