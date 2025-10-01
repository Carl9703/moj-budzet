'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'

interface Props {
    onClose: () => void
    onSave: (data: IncomeData) => void
    onSwitchToBonus: () => void
}

interface IncomeData {
    amount: number
    toSavings: number
    toVacation: number
    toInvestment: number
    toJoint: number
    forExpenses: number
    description?: string
    includeInStats?: boolean  // DODANE!
    type?: string  // DODANE!
    date?: string  // DODANE!
}

export function IncomeModal({ onClose, onSave, onSwitchToBonus }: Props) {
    const [incomeType, setIncomeType] = useState<'salary' | 'other'>('salary')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [includeInStats, setIncludeInStats] = useState(true)
    const [toSavings, setToSavings] = useState('1000')
    const [toVacation, setToVacation] = useState('420')
    const [toInvestment, setToInvestment] = useState('600')
    const [toJoint, setToJoint] = useState('1500')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    useEffect(() => {
        let isMounted = true

        const loadDefaults = async () => {
            try {
                const res = await fetch('/api/config', { cache: 'no-store' })
                if (!res.ok) return
                const data = await res.json()
                const cfg = data?.config
                if (!cfg) return

                if (!isMounted) return
                // Ustaw domyślne wartości dla pensji i stałych przelewów
                setAmount(String(cfg.defaultSalary ?? ''))
                setToJoint(String(cfg.defaultToJoint ?? ''))
                setToSavings(String(cfg.defaultToSavings ?? ''))
                setToVacation(String(cfg.defaultToVacation ?? ''))
                setToInvestment(String(cfg.defaultToInvestment ?? ''))
            } catch {
                // cicho pomiń, pozostaną wartości domyślne
            }
        }

        if (incomeType === 'salary') {
            loadDefaults()
        } else {
            setAmount('')
        }

        return () => { isMounted = false }
    }, [incomeType])

    const handleSubmit = () => {
        const amountNum = Number(amount || 0)

        if (incomeType === 'other') {
            if (amountNum <= 0) {
                alert('Wprowadź prawidłową kwotę!')
                return
            }

            onSave({
                amount: amountNum,
                toSavings: 0,
                toVacation: 0,
                toInvestment: 0,
                toJoint: 0,
                forExpenses: amountNum,
                description: description || (includeInStats ? 'Inny przychód' : 'Zwrot/Refundacja'),
                includeInStats,
                type: 'other',
                date: date
            })
        } else {
            const totalAllocated = Number(toSavings) + Number(toVacation) + Number(toInvestment) + Number(toJoint)
            const forExpenses = amountNum - totalAllocated

            if (amountNum <= 0) {
                alert('Wprowadź prawidłową kwotę wypłaty!')
                return
            }

            if (totalAllocated > amountNum) {
                alert('Suma przelewów przekracza kwotę wypłaty!')
                return
            }

            if (forExpenses < 0) {
                alert('Kwota na wydatki nie może być ujemna!')
                return
            }

            onSave({
                amount: amountNum,
                toSavings: Number(toSavings),
                toVacation: Number(toVacation),
                toInvestment: Number(toInvestment),
                toJoint: Number(toJoint),
                forExpenses,
                type: 'salary',
                date: date
            })
        }
        onClose()
    }

    const inputStyle = {
        width: '100px',
        padding: '8px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        textAlign: 'right' as const
    }

    const totalAllocated = Number(toSavings) + Number(toVacation) + Number(toInvestment) + Number(toJoint)
    const forExpenses = Number(amount || 0) - totalAllocated
    const canSubmit = incomeType === 'other' ?
        Number(amount || 0) > 0 :
        (Number(amount || 0) > 0 && totalAllocated <= Number(amount || 0))

    return (
        <Modal title="💰 DODAJ PRZYCHÓD" onClose={onClose}>
            {/* Wybór typu przychodu */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '20px',
                padding: '4px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px'
            }}>
                <button
                    onClick={() => setIncomeType('salary')}
                    style={{
                        flex: 1,
                        padding: '8px',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: incomeType === 'salary' ? 'white' : 'transparent',
                        fontWeight: incomeType === 'salary' ? '600' : '400',
                        cursor: 'pointer',
                        boxShadow: incomeType === 'salary' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                >
                    💼 Wypłata
                </button>
                <button
                    onClick={() => setIncomeType('other')}
                    style={{
                        flex: 1,
                        padding: '8px',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: incomeType === 'other' ? 'white' : 'transparent',
                        fontWeight: incomeType === 'other' ? '600' : '400',
                        cursor: 'pointer',
                        boxShadow: incomeType === 'other' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                >
                    💵 Inne
                </button>
                <button
                    onClick={onSwitchToBonus}
                    style={{
                        flex: 1,
                        padding: '8px',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: 'transparent',
                        fontWeight: '400',
                        cursor: 'pointer'
                    }}
                >
                    🎁 Premia
                </button>
            </div>

            <div style={{
                backgroundColor: canSubmit ? '#dbeafe' : '#fee2e2',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: canSubmit ? '1px solid #93c5fd' : '1px solid #fca5a5'
            }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: canSubmit ? '#1e40af' : '#991b1b' }}>
                    {incomeType === 'salary' ? 'Kwota wypłaty' : 'Kwota przychodu'}
                </label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={incomeType === 'other' ? 'Wprowadź kwotę...' : '5030'}
                    style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        border: '2px solid',
                        borderColor: canSubmit ? '#3b82f6' : '#ef4444',
                        borderRadius: '6px',
                        textAlign: 'center'
                    }}
                />
                
                {/* Pole daty */}
                <div style={{ marginTop: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>
                        Data przychodu
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    />
                </div>
                {incomeType === 'other' && (
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Opis przychodu (opcjonalnie)"
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            marginTop: '8px',
                            fontSize: '14px'
                        }}
                    />
                )}
            </div>

            {incomeType === 'salary' && (
                <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontWeight: '600', marginBottom: '12px' }}>PODZIAŁ AUTOMATYCZNY:</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>👫 Konto wspólne:</span>
                            <input
                                type="number"
                                value={toJoint}
                                onChange={(e) => setToJoint(e.target.value)}
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>💍 Wesele (cel):</span>
                            <input
                                type="number"
                                value={toSavings}
                                onChange={(e) => setToSavings(e.target.value)}
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>✈️ Wakacje (koperta):</span>
                            <input
                                type="number"
                                value={toVacation}
                                onChange={(e) => setToVacation(e.target.value)}
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>📈 Inwestycje:</span>
                            <input
                                type="number"
                                value={toInvestment}
                                onChange={(e) => setToInvestment(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {totalAllocated > Number(amount || 0) && (
                        <div style={{
                            marginTop: '8px',
                            padding: '8px',
                            backgroundColor: '#fee2e2',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#dc2626',
                            textAlign: 'center'
                        }}>
                            ⚠️ Suma przelewów ({totalAllocated} zł) przekracza wypłatę!
                        </div>
                    )}

                    <div style={{
                        borderTop: '1px solid #ddd',
                        marginTop: '16px',
                        paddingTop: '16px',
                        backgroundColor: forExpenses >= 0 ? '#f0fdf4' : '#fee2e2',
                        padding: '12px',
                        borderRadius: '6px'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '18px',
                            fontWeight: 'bold'
                        }}>
                            <span>💳 Na wydatki:</span>
                            <span style={{ color: forExpenses >= 0 ? '#059669' : '#dc2626' }}>
                                {forExpenses} zł
                            </span>
                        </div>
                        {forExpenses < 0 && (
                            <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px', textAlign: 'center' }}>
                                Zmniejsz przelewy lub zwiększ kwotę wypłaty
                            </div>
                        )}
                    </div>
                </div>
            )}

            {incomeType === 'other' && (
                <>
                    {/* Toggle dla includeInStats */}
                    <div style={{
                        marginBottom: '16px',
                        padding: '16px',
                        backgroundColor: includeInStats ? '#f0fdf4' : '#fef3c7',
                        borderRadius: '8px',
                        border: `1px solid ${includeInStats ? '#bbf7d0' : '#fde68a'}`
                    }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer'
                        }}>
                            <div>
                                <div style={{
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    marginBottom: '4px'
                                }}>
                                    📊 Wliczaj do statystyk miesięcznych
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: '#6b7280'
                                }}>
                                    {includeInStats
                                        ? "✓ Przychód - wpłynie na bilans i stopę oszczędności"
                                        : "✗ Tylko zwrot - nie wpłynie na statystyki"
                                    }
                                </div>
                            </div>

                            {/* Toggle Switch */}
                            <div style={{
                                position: 'relative',
                                width: '48px',
                                height: '24px',
                                backgroundColor: includeInStats ? '#10b981' : '#d1d5db',
                                borderRadius: '12px',
                                transition: 'background-color 0.2s'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={includeInStats}
                                    onChange={(e) => setIncludeInStats(e.target.checked)}
                                    style={{
                                        opacity: 0,
                                        width: '100%',
                                        height: '100%',
                                        cursor: 'pointer'
                                    }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    top: '2px',
                                    left: includeInStats ? '26px' : '2px',
                                    width: '20px',
                                    height: '20px',
                                    backgroundColor: 'white',
                                    borderRadius: '50%',
                                    transition: 'left 0.2s',
                                    pointerEvents: 'none'
                                }} />
                            </div>
                        </label>
                    </div>

                    {/* Informacja o przeznaczeniu */}
                    <div style={{
                        padding: '16px',
                        backgroundColor: '#f0fdf4',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '14px', color: '#059669', marginBottom: '8px' }}>
                            {includeInStats
                                ? '💵 Przychód zostanie wliczony do statystyk'
                                : '↩️ Zwrot - tylko zwiększy saldo konta'}
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>
                            Kwota: {Number(amount || 0).toLocaleString()} zł
                        </div>
                    </div>
                </>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                    onClick={onClose}
                    style={{
                        padding: '8px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                    }}
                >
                    Anuluj
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: canSubmit ? '#3b82f6' : '#d1d5db',
                        color: canSubmit ? 'white' : '#6b7280',
                        cursor: canSubmit ? 'pointer' : 'not-allowed',
                        fontWeight: '500'
                    }}
                >
                    ✓ {incomeType === 'salary' ? 'ZATWIERDŹ PODZIAŁ' :
                        includeInStats ? 'DODAJ PRZYCHÓD' : 'DODAJ ZWROT'}
                </button>
            </div>
        </Modal>
    )
}