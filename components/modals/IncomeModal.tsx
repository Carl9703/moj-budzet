'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { authorizedFetch } from '@/lib/utils/api'
import { useToast } from '@/components/ui/Toast'

interface Props {
    onClose: () => void
    onSave: (data: IncomeData) => void
    onSwitchToBonus?: () => void // Deprecated - nie używamy już
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

export function IncomeModal({ onClose, onSave }: Props) {
    const { showToast } = useToast()
    const [incomeType, setIncomeType] = useState<'salary' | 'other' | 'bonus'>('salary')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [includeInStats, setIncludeInStats] = useState(true)
    const [toSavings, setToSavings] = useState('1000')
    const [toVacation, setToVacation] = useState('420')
    const [toInvestment, setToInvestment] = useState('600')
    const [toJoint, setToJoint] = useState('1500')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    
    // Stany dla premii
    const [bonusPercentages, setBonusPercentages] = useState({
        gifts: 20,
        insurance: 15,
        holidays: 20,
        freedom: 45
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

    const calculateBonusAmount = (percentage: number) => {
        return Math.round((Number(amount) * percentage) / 100)
    }

    const totalBonusPercentage = Object.values(bonusPercentages).reduce((a, b) => a + b, 0)

    const handleSubmit = () => {
        const amountNum = Number(amount || 0)

        if (incomeType === 'bonus') {
            if (totalBonusPercentage !== 100) {
                showToast('Suma procentów musi wynosić 100%!', 'warning')
                return
            }

            onSave({
                amount: amountNum,
                toSavings: 0,
                toVacation: 0,
                toInvestment: 0,
                toJoint: 0,
                forExpenses: 0,
                type: 'bonus',
                date: date
            })
            onClose()
            return
        }

        if (incomeType === 'other') {
            if (amountNum <= 0) {
                showToast('Wprowadź prawidłową kwotę!', 'warning')
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
                showToast('Wprowadź prawidłową kwotę wypłaty!', 'warning')
                return
            }

            if (totalAllocated > amountNum) {
                showToast('Suma przelewów przekracza kwotę wypłaty!', 'warning')
                return
            }

            if (forExpenses < 0) {
                showToast('Kwota na wydatki nie może być ujemna!', 'error')
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
        border: '1px solid var(--border-primary)',
        borderRadius: '4px',
        textAlign: 'right' as const,
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
    }

    const totalAllocated = Number(toSavings) + Number(toVacation) + Number(toInvestment) + Number(toJoint)
    const forExpenses = Number(amount || 0) - totalAllocated
    const canSubmit = incomeType === 'bonus' ?
        (Number(amount || 0) > 0 && totalBonusPercentage === 100) :
        incomeType === 'other' ?
        Number(amount || 0) > 0 :
        (Number(amount || 0) > 0 && totalAllocated <= Number(amount || 0))

    return (
        <Modal title="💰 DODAJ PRZYCHÓD" onClose={onClose}>
            <div style={{ 
                maxHeight: '70vh',
                overflowY: 'auto',
                paddingRight: '8px'
            }}>
                {/* Wybór typu przychodu */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '20px',
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
                marginBottom: '16px',
                border: canSubmit ? '1px solid var(--success-border)' : '1px solid var(--error-border)'
            }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: canSubmit ? 'var(--success-dark)' : 'var(--error-dark)' }}>
                    {incomeType === 'bonus' ? 'Kwota premii kwartalnej' : incomeType === 'salary' ? 'Kwota wypłaty' : 'Kwota przychodu'}
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
                            backgroundColor: 'var(--error-light)',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: 'var(--error-primary)',
                            textAlign: 'center'
                        }}>
                            ⚠️ Suma przelewów ({totalAllocated} zł) przekracza wypłatę!
                        </div>
                    )}

                    <div style={{
                        borderTop: '1px solid var(--border-primary)',
                        marginTop: '16px',
                        paddingTop: '16px',
                        backgroundColor: forExpenses >= 0 ? 'var(--bg-success)' : 'var(--error-light)',
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
                            <span style={{ color: forExpenses >= 0 ? 'var(--success-primary)' : 'var(--error-primary)' }}>
                                {forExpenses} zł
                            </span>
                        </div>
                        {forExpenses < 0 && (
                            <div style={{ fontSize: '12px', color: 'var(--error-primary)', marginTop: '4px', textAlign: 'center' }}>
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
                        marginBottom: '16px',
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
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>PODZIAŁ PROCENTOWY:</h3>

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
                            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Prezenty</span>
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
                                {calculateBonusAmount(bonusPercentages.gifts)} zł
                            </span>
                        </div>

                        {/* OC */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '40px 1fr 80px 100px',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: '6px'
                        }}>
                            <span style={{ fontSize: '20px' }}>📋</span>
                            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>OC</span>
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
                                {calculateBonusAmount(bonusPercentages.insurance)} zł
                            </span>
                        </div>

                        {/* Święta */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '40px 1fr 80px 100px',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: '6px'
                        }}>
                            <span style={{ fontSize: '20px' }}>🎄</span>
                            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Święta</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                    type="number"
                                    value={bonusPercentages.holidays}
                                    onChange={(e) => setBonusPercentages(prev => ({...prev, holidays: parseInt(e.target.value) || 0}))}
                                    style={inputStyle}
                                />
                                <span style={{ color: 'var(--text-primary)' }}>%</span>
                            </div>
                            <span style={{ textAlign: 'right', fontWeight: '600', color: 'var(--success-primary)' }}>
                                {calculateBonusAmount(bonusPercentages.holidays)} zł
                            </span>
                        </div>

                        {/* Wolne środki */}
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
                            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Wolne środki</span>
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
                                {calculateBonusAmount(bonusPercentages.freedom)} zł
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