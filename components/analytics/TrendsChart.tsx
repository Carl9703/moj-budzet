'use client'

import { useState, useMemo, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface TrendData {
    period: string
    totalExpenses: number
    income?: number
    balance?: number
    [key: string]: any // dla dynamicznych danych kopert/kategorii
}

interface TrendsChartProps {
    data: TrendData[]
    selectedEnvelope?: string
    chartType?: 'line' | 'bar'
    loading?: boolean
    onPeriodClick?: (period: string) => void
}

export function TrendsChart({ 
    data, 
    selectedEnvelope, 
    chartType = 'line',
    loading = false,
    onPeriodClick 
}: TrendsChartProps) {
    const [hoveredPeriod, setHoveredPeriod] = useState<string | null>(null)
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    const chartData = useMemo(() => {
        return data.map(item => ({
            ...item,
            formattedPeriod: formatPeriod(item.period),
            displayValue: selectedEnvelope ? item[selectedEnvelope] || 0 : item.totalExpenses
        }))
    }, [data, selectedEnvelope])

    const formatPeriod = (period: string) => {
        // Konwertuj format YYYY-MM na czytelny format
        const [year, month] = period.split('-')
        const monthNames = [
            'Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze',
            'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'
        ]
        return `${monthNames[parseInt(month) - 1]} ${year.slice(-2)}`
    }

    const formatMoney = (amount: number) => amount.toLocaleString('pl-PL') + ' zł'

    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
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
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        marginBottom: '8px'
                    }}>
                        {data.formattedPeriod}
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                        {selectedEnvelope ? (
                            <>
                                <div style={{ marginBottom: '4px' }}>
                                    {selectedEnvelope}: <span style={{ fontWeight: '600', color: 'var(--accent-error)' }}>
                                        {formatMoney(data.displayValue)}
                                    </span>
                                </div>
                                <div>
                                    Łączne wydatki: <span style={{ fontWeight: '600' }}>
                                        {formatMoney(data.totalExpenses)}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ marginBottom: '4px' }}>
                                    Wydatki: <span style={{ fontWeight: '600', color: 'var(--accent-error)' }}>
                                        {formatMoney(data.totalExpenses)}
                                    </span>
                                </div>
                                {data.income && (
                                    <div style={{ marginBottom: '4px' }}>
                                        Przychody: <span style={{ fontWeight: '600', color: 'var(--accent-success)' }}>
                                            {formatMoney(data.income)}
                                        </span>
                                    </div>
                                )}
                                {data.balance && (
                                    <div>
                                        Bilans: <span style={{ 
                                            fontWeight: '600', 
                                            color: data.balance >= 0 ? 'var(--accent-success)' : 'var(--accent-error)' 
                                        }}>
                                            {formatMoney(data.balance)}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )
        }
        return null
    }

    const getChartColor = () => {
        if (selectedEnvelope) {
            return 'var(--accent-primary)'
        }
        return 'var(--accent-error)'
    }

    const getChartGradient = () => {
        if (selectedEnvelope) {
            return 'url(#envelopeGradient)'
        }
        return 'url(#expenseGradient)'
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
                    height: '300px'
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '4px solid var(--border-primary)',
                            borderTop: '4px solid var(--accent-primary)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <div style={{
                            fontSize: '16px',
                            color: 'var(--text-secondary)'
                        }}>
                            Ładowanie trendów...
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!data || data.length === 0) {
        return (
            <div style={{
                backgroundColor: 'var(--bg-secondary)',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--border-primary)',
                boxShadow: 'var(--shadow-md)',
                marginBottom: '24px',
                textAlign: 'center'
            }}>
                <div style={{
                    fontSize: '48px',
                    marginBottom: '16px'
                }}>
                    📈
                </div>
                <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '8px'
                }}>
                    Brak danych do wyświetlenia
                </div>
                <div style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)'
                }}>
                    Wybierz inny okres lub dodaj transakcje
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
            {/* Nagłówek */}
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
                    📈 {selectedEnvelope ? `Trend: ${selectedEnvelope}` : 'Trend wydatków'}
                </h3>
                
                <div style={{
                    display: 'flex',
                    gap: '8px'
                }}>
                    <button
                        onClick={() => {/* Zmień na liniowy */}}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: chartType === 'line' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                            color: chartType === 'line' ? 'white' : 'var(--text-primary)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        📈 Linia
                    </button>
                    <button
                        onClick={() => {/* Zmień na słupkowy */}}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: chartType === 'bar' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                            color: chartType === 'bar' ? 'white' : 'var(--text-primary)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        📊 Słupki
                    </button>
                </div>
            </div>

            {/* Wykres */}
            <div style={{ height: '300px', marginBottom: '20px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'line' ? (
                        <LineChart data={chartData}>
                            <defs>
                                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--accent-error)" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="var(--accent-error)" stopOpacity={0.05}/>
                                </linearGradient>
                                <linearGradient id="envelopeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0.05}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                            <XAxis 
                                dataKey="formattedPeriod" 
                                stroke="var(--text-secondary)"
                                fontSize={12}
                            />
                            <YAxis 
                                stroke="var(--text-secondary)"
                                fontSize={12}
                                tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="displayValue"
                                stroke={getChartColor()}
                                strokeWidth={3}
                                dot={{ fill: getChartColor(), strokeWidth: 2, r: 6 }}
                                activeDot={{ r: 8, stroke: getChartColor(), strokeWidth: 2 }}
                            />
                        </LineChart>
                    ) : (
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                            <XAxis 
                                dataKey="formattedPeriod" 
                                stroke="var(--text-secondary)"
                                fontSize={12}
                            />
                            <YAxis 
                                stroke="var(--text-secondary)"
                                fontSize={12}
                                tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar 
                                dataKey="displayValue" 
                                fill={getChartColor()}
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>

            {/* Statystyki trendu */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '16px',
                padding: '16px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '8px',
                border: '1px solid var(--border-primary)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        marginBottom: '4px'
                    }}>
                        Średnia
                    </div>
                    <div style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'var(--accent-primary)'
                    }}>
                        {formatMoney(chartData.reduce((sum, item) => sum + item.displayValue, 0) / chartData.length)}
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        marginBottom: '4px'
                    }}>
                        Maksimum
                    </div>
                    <div style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'var(--accent-error)'
                    }}>
                        {formatMoney(Math.max(...chartData.map(item => item.displayValue)))}
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        marginBottom: '4px'
                    }}>
                        Minimum
                    </div>
                    <div style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'var(--accent-success)'
                    }}>
                        {formatMoney(Math.min(...chartData.map(item => item.displayValue)))}
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        marginBottom: '4px'
                    }}>
                        Trend
                    </div>
                    <div style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: chartData.length > 1 && chartData[chartData.length - 1].displayValue > chartData[0].displayValue 
                            ? 'var(--accent-error)' 
                            : 'var(--accent-success)'
                    }}>
                        {chartData.length > 1 && chartData[chartData.length - 1].displayValue > chartData[0].displayValue ? '📈' : '📉'}
                    </div>
                </div>
            </div>

            {/* Instrukcje */}
            {selectedEnvelope && (
                <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: 'var(--bg-info)',
                    borderRadius: '6px',
                    border: '1px solid var(--accent-primary)',
                    fontSize: '12px',
                    color: 'var(--text-primary)'
                }}>
                    💡 <strong>Wskazówka:</strong> Ten wykres pokazuje trendy wydatków dla wybranej koperty "{selectedEnvelope}". 
                    Kliknij na wykres kołowy powyżej, aby zmienić kopertę lub wróć do widoku wszystkich wydatków.
                </div>
            )}
        </div>
    )
}
