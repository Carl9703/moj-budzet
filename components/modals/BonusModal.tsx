'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

interface Props {
    onClose: () => void
    onSave: (data: BonusData) => void
    onSwitchToIncome?: () => void
}

interface BonusData {
    amount: number
    toGifts: number
    toInsurance: number
    toHolidays: number
    toFreedom: number
}

export function BonusModal({ onClose, onSave, onSwitchToIncome }: Props) {
    const { showToast } = useToast()
    const [amount, setAmount] = useState('1300')
    const [percentages, setPercentages] = useState({
        gifts: 20,
        insurance: 15,
        holidays: 20,
        freedom: 45
    })

    const calculateAmount = (percentage: number) => {
        return Math.round((Number(amount) * percentage) / 100)
    }

    const totalPercentage = Object.values(percentages).reduce((a, b) => a + b, 0)

    const handlePercentageChange = (key: string, value: string) => {
        const numValue = parseInt(value) || 0
        if (numValue >= 0 && numValue <= 100) {
            setPercentages(prev => ({
                ...prev,
                [key]: numValue
            }))
        }
    }

    const handleSubmit = () => {
        if (totalPercentage !== 100) {
            showToast('Suma procentów musi wynosić 100%!', 'warning')
            return
        }

        onSave({
            amount: Number(amount),
            toGifts: calculateAmount(percentages.gifts),
            toInsurance: calculateAmount(percentages.insurance),
            toHolidays: calculateAmount(percentages.holidays),
            toFreedom: calculateAmount(percentages.freedom)
        })
        onClose()
    }

    const inputStyle = {
        width: '60px',
        padding: '4px 8px',
        border: '1px solid var(--border-primary)',
        borderRadius: '4px',
        textAlign: 'center' as const,
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
    }

    return (
        <Modal title="💰 WPŁYNĘŁA PREMIA" onClose={onClose}>
            {/* Przycisk powrotu */}
            {onSwitchToIncome && (
                <button
                    onClick={onSwitchToIncome}
                    style={{
                        marginBottom: '16px',
                        padding: '8px 12px',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    ← Powrót do wyboru typu przychodu
                </button>
            )}
            
            <div style={{ backgroundColor: 'var(--bg-success)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--success-border)' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--success-dark)' }}>
                    Kwota premii kwartalnej
                </label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        border: '2px solid #10b981',
                        borderRadius: '6px',
                        textAlign: 'center'
                    }}
                />
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>PODZIAŁ PROCENTOWY:</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 1fr 80px 100px',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px'
                    }}>
                        <span style={{ fontSize: '20px' }}>🎁</span>
                        <span style={{ fontWeight: '500' }}>Prezenty</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                                type="number"
                                value={percentages.gifts}
                                onChange={(e) => handlePercentageChange('gifts', e.target.value)}
                                style={inputStyle}
                            />
                            <span>%</span>
                        </div>
                        <span style={{ textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                            {calculateAmount(percentages.gifts)} zł
                        </span>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 1fr 80px 100px',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px'
                    }}>
                        <span style={{ fontSize: '20px' }}>📋</span>
                        <span style={{ fontWeight: '500' }}>OC</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                                type="number"
                                value={percentages.insurance}
                                onChange={(e) => handlePercentageChange('insurance', e.target.value)}
                                style={inputStyle}
                            />
                            <span>%</span>
                        </div>
                        <span style={{ textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                            {calculateAmount(percentages.insurance)} zł
                        </span>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 1fr 80px 100px',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px'
                    }}>
                        <span style={{ fontSize: '20px' }}>🎄</span>
                        <span style={{ fontWeight: '500' }}>Święta</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                                type="number"
                                value={percentages.holidays}
                                onChange={(e) => handlePercentageChange('holidays', e.target.value)}
                                style={inputStyle}
                            />
                            <span>%</span>
                        </div>
                        <span style={{ textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                            {calculateAmount(percentages.holidays)} zł
                        </span>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 1fr 80px 100px',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px'
                    }}>
                        <span style={{ fontSize: '20px' }}>💰</span>
                        <span style={{ fontWeight: '500' }}>Wolne środki</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                                type="number"
                                value={percentages.freedom}
                                onChange={(e) => handlePercentageChange('freedom', e.target.value)}
                                style={inputStyle}
                            />
                            <span>%</span>
                        </div>
                        <span style={{ textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                            {calculateAmount(percentages.freedom)} zł
                        </span>
                    </div>
                </div>

                <div style={{
                    marginTop: '12px',
                    padding: '8px',
                    backgroundColor: totalPercentage === 100 ? '#d1fae5' : '#fee2e2',
                    borderRadius: '6px',
                    textAlign: 'center'
                }}>
                    <span style={{
                        fontWeight: '600',
                        color: totalPercentage === 100 ? '#059669' : '#dc2626'
                    }}>
                        Suma: {totalPercentage}%
                        {totalPercentage !== 100 && ' (musi być 100%)'}
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                    onClick={onClose}
                    style={{
                        padding: '10px 20px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    Anuluj
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={totalPercentage !== 100}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: totalPercentage === 100 ? '#10b981' : '#d1d5db',
                        color: totalPercentage === 100 ? 'white' : '#6b7280',
                        cursor: totalPercentage === 100 ? 'pointer' : 'not-allowed',
                        fontWeight: '600',
                        fontSize: '14px'
                    }}
                >
                    ✓ ZATWIERDŹ PODZIAŁ
                </button>
            </div>
        </Modal>
    )
}