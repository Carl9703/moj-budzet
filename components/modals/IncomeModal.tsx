'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { authorizedFetch } from '@/lib/utils/api'
import { useToast } from '@/components/ui/Toast'

interface Props {
    onClose: () => void
    onSave: (data: IncomeData) => void
}

interface IncomeData {
    amount: number
    description?: string
    includeInStats?: boolean
    type?: string
    date?: string
}

export function IncomeModal({ onClose, onSave }: Props) {
    const { showToast } = useToast()
    const [incomeType, setIncomeType] = useState<'salary' | 'other'>('salary')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [includeInStats, setIncludeInStats] = useState(true)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [loading, setLoading] = useState(false)

    const handleSubmit = () => {
        const amountNum = Number(amount || 0)

        if (amountNum <= 0) {
            showToast('Wprowadź prawidłową kwotę!', 'warning')
            return
        }

        onSave({
            amount: amountNum,
            description: description || (incomeType === 'salary' ? 'Wypłata miesięczna' : 'Inny przychód'),
            includeInStats,
            type: incomeType,
            date
        })
        onClose()
    }

    return (
        <Modal isOpen={true} onClose={onClose} title="Dodaj Przychód">
            <div style={{ padding: '20px' }}>
                {/* Typ przychodu */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        Typ przychodu
                    </label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => setIncomeType('salary')}
                            style={{
                                padding: '12px 20px',
                                backgroundColor: incomeType === 'salary' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                color: incomeType === 'salary' ? '#ffffff' : 'var(--text-primary)',
                                border: '2px solid var(--border-primary)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontWeight: '600'
                            }}
                        >
                            💰 Wypłata
                        </button>
                        <button
                            onClick={() => setIncomeType('other')}
                            style={{
                                padding: '12px 20px',
                                backgroundColor: incomeType === 'other' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                color: incomeType === 'other' ? '#ffffff' : 'var(--text-primary)',
                                border: '2px solid var(--border-primary)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontWeight: '600'
                            }}
                        >
                            💵 Inny
                        </button>
                    </div>
                </div>

                {/* Kwota */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        Kwota (zł)
                    </label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Wprowadź kwotę"
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid var(--border-primary)',
                            borderRadius: '8px',
                            fontSize: '16px',
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)'
                        }}
                    />
                </div>

                {/* Opis */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        Opis (opcjonalny)
                    </label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={incomeType === 'salary' ? 'Wypłata miesięczna' : 'Opis przychodu'}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid var(--border-primary)',
                            borderRadius: '8px',
                            fontSize: '16px',
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)'
                        }}
                    />
                </div>

                {/* Data */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        Data
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid var(--border-primary)',
                            borderRadius: '8px',
                            fontSize: '16px',
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)'
                        }}
                    />
                </div>

                {/* Uwzględnij w statystykach */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={includeInStats}
                            onChange={(e) => setIncludeInStats(e.target.checked)}
                            style={{ transform: 'scale(1.2)' }}
                        />
                        <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                            Uwzględnij w statystykach
                        </span>
                    </label>
                </div>

                {/* Przyciski */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            border: '2px solid var(--border-primary)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontWeight: '600'
                        }}
                    >
                        Anuluj
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: 'var(--accent-primary)',
                            color: '#ffffff',
                            border: '2px solid var(--accent-primary)',
                            borderRadius: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            fontWeight: '600',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Zapisywanie...' : 'Dodaj Przychód'}
                    </button>
                </div>
            </div>
        </Modal>
    )
}