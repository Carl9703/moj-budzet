'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/layout/Modal'
import { authorizedFetch } from '@/lib/utils/api'
import { useToast } from '@/components/ui/feedback/Toast'

interface Props {
    onClose: () => void
    onSave: (data: IncomeData) => void
    onSwitchToBonus?: () => void
}

interface IncomeData {
    amount: number
    description?: string
    includeInStats?: boolean
    type?: string
    date?: string
    toGifts?: number
    toInsurance?: number
    toFreedom?: number
}

export function IncomeModal({ onClose, onSave }: Props) {
    const { showToast } = useToast()
    const [incomeType, setIncomeType] = useState<'salary' | 'other' | 'bonus'>('salary')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [includeInStats, setIncludeInStats] = useState(true)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    
    // Stany dla premii
    const [bonusPercentages, setBonusPercentages] = useState({
        gifts: 40,
        insurance: 40,
        freedom: 20
    })

    useEffect(() => {
        let isMounted = true

        const loadDefaults = async () => {
            try {
                const res = await authorizedFetch('/api/config', { cache: 'no-store' })
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
                setToWedding(String(cfg.defaultToWedding ?? ''))
                setToGroceries(String(cfg.defaultToGroceries ?? ''))
                setToInvestment(String(cfg.defaultToInvestment ?? ''))
            } catch {
                // cicho pomiń, pozostaną wartości domyślne
            }
        }

        if (incomeType === 'salary') {
            loadDefaults()
        } else if (incomeType === 'bonus') {
            setAmount('1300')
        } else {
            setAmount('')
        }

        return () => { isMounted = false }
    }, [incomeType])

    const totalBonusPercentage = Object.values(bonusPercentages).reduce((a, b) => a + b, 0)
    
    const calculateAmount = (percentage: number) => {
        return Math.round((Number(amount) * percentage) / 100)
    }

    const handleSubmit = () => {
        const amountNum = Number(amount || 0)

        if (amountNum <= 0) {
            showToast('Wprowadź prawidłową kwotę!', 'warning')
            return
        }

        onSave({
            amount: amountNum,
            description: description || (incomeType === 'salary' ? 'Wypłata' : incomeType === 'bonus' ? 'Premia' : 'Inny przychód'),
            includeInStats,
            type: incomeType,
            date: date
        })
        onClose()
    }

    const inputStyle = {
        width: '100px',
        padding: '8px',
        border: '1px solid var(--border-primary)',
        borderRadius: '4px',
        textAlign: 'right' as const,
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
    }

    const canSubmit = Number(amount || 0) > 0

    return (
        <Modal title="💰 DODAJ PRZYCHÓD" onClose={onClose}>
            <div>
                {/* Wybór typu przychodu */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '12px',
                    padding: '4px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '8px'
                }}>
                <button
                    onClick={() => setIncomeType('salary')}
                    style={{
                        flex: 1,
                        padding: '8px',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: incomeType === 'salary' ? 'var(--bg-secondary)' : 'transparent',
                        color: 'var(--text-primary)',
                        fontWeight: incomeType === 'salary' ? '600' : '400',
                        cursor: 'pointer',
                        boxShadow: incomeType === 'salary' ? 'var(--shadow-sm)' : 'none'
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
                        backgroundColor: incomeType === 'other' ? 'var(--bg-secondary)' : 'transparent',
                        color: 'var(--text-primary)',
                        fontWeight: incomeType === 'other' ? '600' : '400',
                        cursor: 'pointer',
                        boxShadow: incomeType === 'other' ? 'var(--shadow-sm)' : 'none'
                    }}
                >
                    💵 Inne
                </button>
                <button
                    onClick={() => setIncomeType('bonus')}
                    style={{
                        flex: 1,
                        padding: '8px',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: incomeType === 'bonus' ? 'var(--bg-secondary)' : 'transparent',
                        color: 'var(--text-primary)',
                        fontWeight: incomeType === 'bonus' ? '600' : '400',
                        cursor: 'pointer',
                        boxShadow: incomeType === 'bonus' ? 'var(--shadow-sm)' : 'none'
                    }}
                >
                    🎁 Premia
                </button>
            </div>

            <div style={{
                backgroundColor: canSubmit ? 'var(--success-light)' : 'var(--error-light)',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '12px',
                border: canSubmit ? '1px solid var(--success-border)' : '1px solid var(--error-border)'
            }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: canSubmit ? 'var(--success-dark)' : 'var(--error-dark)' }}>
                    {incomeType === 'bonus' ? 'Kwota premii kwartalnej' : incomeType === 'salary' ? 'Kwota wypłaty' : 'Kwota przychodu'}
                </label>
                <input
                    type="number"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={incomeType === 'other' ? 'Wprowadź kwotę...' : '5030'}
                    style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        border: '2px solid',
                        borderColor: canSubmit ? 'var(--accent-primary)' : 'var(--error-primary)',
                        borderRadius: '6px',
                        textAlign: 'center',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                    }}
                />
                
                {/* Pole daty */}
                <div style={{ marginTop: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Data przychodu
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '4px',
                            fontSize: '14px',
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)'
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
                            border: '1px solid var(--border-primary)',
                            borderRadius: '4px',
                            marginTop: '8px',
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            fontSize: '14px'
                        }}
                    />
                )}
            </div>


            {incomeType === 'other' && (
                <>
                    {/* Toggle dla includeInStats */}
                    <div style={{
                        marginBottom: '12px',
                        padding: '16px',
                        backgroundColor: includeInStats ? 'var(--bg-success)' : 'var(--bg-warning)',
                        borderRadius: '8px',
                        border: `1px solid ${includeInStats ? 'var(--success-border)' : 'var(--accent-warning)'}`
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
                                    color: 'var(--text-secondary)'
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
                                backgroundColor: includeInStats ? 'var(--success-primary)' : 'var(--border-secondary)',
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
                        backgroundColor: 'var(--bg-success)',
                        borderRadius: '8px',
                        marginBottom: '12px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '14px', color: 'var(--success-primary)', marginBottom: '8px' }}>
                            {includeInStats
                                ? '💵 Przychód zostanie wliczony do statystyk'
                                : '↩️ Zwrot - tylko zwiększy saldo konta'}
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--success-primary)' }}>
                            Kwota: {Number(amount || 0).toLocaleString()} zł
                        </div>
                    </div>
                </>
            )}

            {incomeType === 'bonus' && (
                <div style={{ marginBottom: '12px' }}>
                    <h3 style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>PODZIAŁ PROCENTOWY:</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Prezenty */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '40px 1fr 80px 100px',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: '6px'
                        }}>
                            <span style={{ fontSize: '20px' }}>🎁</span>
                            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Prezenty i Okazje</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                    type="number"
                                    value={bonusPercentages.gifts}
                                    onChange={(e) => setBonusPercentages(prev => ({...prev, gifts: parseInt(e.target.value) || 0}))}
                                    style={inputStyle}
                                />
                                <span style={{ color: 'var(--text-primary)' }}>%</span>
                            </div>
                            <span style={{ textAlign: 'right', fontWeight: '600', color: 'var(--success-primary)' }}>
                                {calculateAmount(bonusPercentages.gifts)} zł
                            </span>
                        </div>

                        {/* Auto: Serwis i Ubezpieczenie */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '40px 1fr 80px 100px',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: '6px'
                        }}>
                            <span style={{ fontSize: '20px' }}>🚗</span>
                            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Auto: Serwis i Ubezpieczenie</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                    type="number"
                                    value={bonusPercentages.insurance}
                                    onChange={(e) => setBonusPercentages(prev => ({...prev, insurance: parseInt(e.target.value) || 0}))}
                                    style={inputStyle}
                                />
                                <span style={{ color: 'var(--text-primary)' }}>%</span>
                            </div>
                            <span style={{ textAlign: 'right', fontWeight: '600', color: 'var(--success-primary)' }}>
                                {calculateAmount(bonusPercentages.insurance)} zł
                            </span>
                        </div>


                        {/* Wolne środki (roczne) */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '40px 1fr 80px 100px',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: '6px'
                        }}>
                            <span style={{ fontSize: '20px' }}>💰</span>
                            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Wolne środki (roczne)</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                    type="number"
                                    value={bonusPercentages.freedom}
                                    onChange={(e) => setBonusPercentages(prev => ({...prev, freedom: parseInt(e.target.value) || 0}))}
                                    style={inputStyle}
                                />
                                <span style={{ color: 'var(--text-primary)' }}>%</span>
                            </div>
                            <span style={{ textAlign: 'right', fontWeight: '600', color: 'var(--success-primary)' }}>
                                {calculateAmount(bonusPercentages.freedom)} zł
                            </span>
                        </div>
                    </div>

                    <div style={{
                        marginTop: '12px',
                        padding: '8px',
                        backgroundColor: totalBonusPercentage === 100 ? 'var(--bg-success)' : 'var(--error-light)',
                        borderRadius: '6px',
                        textAlign: 'center',
                        border: `1px solid ${totalBonusPercentage === 100 ? 'var(--success-border)' : 'var(--error-border)'}`
                    }}>
                        <span style={{
                            fontWeight: '600',
                            color: totalBonusPercentage === 100 ? 'var(--success-primary)' : 'var(--error-primary)'
                        }}>
                            Suma: {totalBonusPercentage}%
                            {totalBonusPercentage !== 100 && ' (musi być 100%)'}
                        </span>
                    </div>
                </div>
            )}

            </div>
            
            {/* PRZYCISKI - sticky na dole */}
            <div style={{ 
                position: 'sticky',
                bottom: 0,
                backgroundColor: 'var(--bg-primary)',
                padding: '16px 0 0 0',
                marginTop: '24px',
                borderTop: '1px solid var(--border-primary)',
                display: 'flex', 
                gap: '8px', 
                justifyContent: 'flex-end'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        padding: '12px 24px',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}
                >
                    Anuluj
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    style={{
                        padding: '12px 24px',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: canSubmit ? 'var(--accent-primary)' : 'var(--border-secondary)',
                        color: canSubmit ? 'white' : 'var(--text-secondary)',
                        cursor: canSubmit ? 'pointer' : 'not-allowed',
                        fontWeight: '600',
                        fontSize: '14px'
                    }}
                >
                    ✓ {incomeType === 'bonus' ? 'ZATWIERDŹ PODZIAŁ' :
                        incomeType === 'salary' ? 'ZATWIERDŹ PODZIAŁ' :
                        includeInStats ? 'DODAJ PRZYCHÓD' : 'DODAJ ZWROT'}
                </button>
            </div>
        </Modal>
    )
}