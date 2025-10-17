'use client'

import { useState, useMemo, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface GroupData {
    group: string
    amount: number
    percentage: number
    icon: string
    envelopes: Array<{
        name: string
        amount: number
        icon: string
        percentage: number
    }>
}

interface EnvelopeData {
    envelope: string
    amount: number
    percentage: number
    icon: string
    categories: Array<{
        categoryId: string
        categoryName: string
        amount: number
        icon: string
        percentage: number
    }>
}

interface SpendingBreakdownChartProps {
    data: {
        byGroup: GroupData[]
        byEnvelope: EnvelopeData[]
    }
    onEnvelopeSelect?: (envelopeName: string) => void
    selectedEnvelope?: string
    loading?: boolean
}

const COLORS = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
]

const SpendingBreakdownChart = ({ 
    data, 
    onEnvelopeSelect, 
    selectedEnvelope, 
    loading = false 
}: SpendingBreakdownChartProps) {
    const [drillDownLevel, setDrillDownLevel] = useState<'group' | 'envelope'>('group')
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    const chartData = useMemo(() => {
        if (drillDownLevel === 'group') {
            return data.byGroup.map((group, index) => ({
                name: group.group,
                amount: group.amount,
                percentage: group.percentage,
                icon: group.icon,
                color: COLORS[index % COLORS.length],
                envelopes: group.envelopes
            }))
        } else {
            return data.byEnvelope
                .filter(envelope => !selectedGroup || envelope.envelope.includes(selectedGroup))
                .map((envelope, index) => ({
                    name: envelope.envelope,
                    amount: envelope.amount,
                    percentage: envelope.percentage,
                    icon: envelope.icon,
                    color: COLORS[index % COLORS.length],
                    categories: envelope.categories
                }))
        }
    }, [data, drillDownLevel, selectedGroup])

    const handleSegmentClick = (data: any) => {
        if (drillDownLevel === 'group') {
            setSelectedGroup(data.name)
            setDrillDownLevel('envelope')
        } else {
            onEnvelopeSelect?.(data.name)
        }
    }

    const handleBackToGroups = () => {
        setDrillDownLevel('group')
        setSelectedGroup(null)
    }

    const formatMoney = (amount: number) => amount.toLocaleString('pl-PL') + ' zł'

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: 'var(--shadow-lg)',
                    fontSize: '14px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                    }}>
                        <span style={{ fontSize: '20px' }}>{data.icon}</span>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                            {data.name}
                        </span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                        Kwota: <span style={{ fontWeight: '600', color: 'var(--accent-error)' }}>
                            {formatMoney(data.amount)}
                        </span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                        Udział: <span style={{ fontWeight: '600' }}>
                            {data.percentage}%
                        </span>
                    </div>
                </div>
            )
        }
        return null
    }

    const CustomLegend = ({ payload }: any) => {
        return (
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                justifyContent: 'center',
                marginTop: '20px'
            }}>
                {payload?.map((entry: any, index: number) => (
                    <div
                        key={index}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: '6px',
                            border: '1px solid var(--border-primary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                            e.currentTarget.style.transform = 'translateY(-2px)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                            e.currentTarget.style.transform = 'translateY(0)'
                        }}
                        onClick={() => handleSegmentClick(entry.payload)}
                    >
                        <div style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: entry.color,
                            borderRadius: '50%'
                        }} />
                        <span style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            color: 'var(--text-primary)'
                        }}>
                            {entry.value}
                        </span>
                        <span style={{
                            fontSize: '11px',
                            color: 'var(--text-secondary)'
                        }}>
                            {entry.payload.percentage}%
                        </span>
                    </div>
                ))}
            </div>
        )
    }

    if (loading) {
        return (
            <div style={{
                backgroundColor: 'var(--bg-secondary)',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--border-primary)',
                boxShadow: 'var(--shadow-md)',
                marginBottom: '24px'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '400px'
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            border: '4px solid var(--border-primary)',
                            borderTop: '4px solid var(--accent-primary)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <div style={{
                            fontSize: '16px',
                            color: 'var(--text-secondary)'
                        }}>
                            Ładowanie wykresu...
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!isClient) {
        return (
            <div style={{
                backgroundColor: 'var(--bg-secondary)',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--border-primary)',
                boxShadow: 'var(--shadow-md)',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '300px'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                }} />
            </div>
        )
    }

    return (
        <div style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-md)',
            marginBottom: '24px'
        }}>
            {/* Nagłówek z nawigacją */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: 0
                }}>
                    🥧 {drillDownLevel === 'group' ? 'Wydatki według grup' : 'Wydatki według kopert'}
                </h3>
                
                {drillDownLevel === 'envelope' && (
                    <button
                        onClick={handleBackToGroups}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: 'var(--accent-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--accent-primary-dark)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--accent-primary)'
                        }}
                    >
                        ← Powrót do grup
                    </button>
                )}
            </div>

            {/* Wykres */}
            <div style={{ height: '400px', marginBottom: '20px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={120}
                            paddingAngle={2}
                            dataKey="amount"
                            onClick={handleSegmentClick}
                        >
                            {chartData.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.color}
                                    style={{ cursor: 'pointer' }}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Legenda */}
            <CustomLegend payload={chartData.map((item, index) => ({
                value: item.name,
                color: item.color,
                payload: item
            }))} />

            {/* Statystyki */}
            <div style={{
                marginTop: '20px',
                padding: '16px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '8px',
                border: '1px solid var(--border-primary)'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '16px'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            marginBottom: '4px'
                        }}>
                            Łączna kwota
                        </div>
                        <div style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: 'var(--accent-error)'
                        }}>
                            {formatMoney(chartData.reduce((sum, item) => sum + item.amount, 0))}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            marginBottom: '4px'
                        }}>
                            Liczba {drillDownLevel === 'group' ? 'grup' : 'kopert'}
                        </div>
                        <div style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: 'var(--accent-primary)'
                        }}>
                            {chartData.length}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            marginBottom: '4px'
                        }}>
                            Największy udział
                        </div>
                        <div style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: 'var(--accent-success)'
                        }}>
                            {Math.max(...chartData.map(item => item.percentage))}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Instrukcje */}
            <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: 'var(--bg-info)',
                borderRadius: '6px',
                border: '1px solid var(--accent-primary)',
                fontSize: '12px',
                color: 'var(--text-primary)'
            }}>
                💡 <strong>Wskazówka:</strong> Kliknij na segment wykresu lub element legendy, aby przejść do szczegółów. 
                {drillDownLevel === 'group' 
                    ? ' Wybierz grupę, aby zobaczyć wydatki według kopert.'
                    : ' Kliknij na kopertę, aby zobaczyć szczegóły w tabeli poniżej.'
                }
            </div>
        </div>
    )
}

export default SpendingBreakdownChart
