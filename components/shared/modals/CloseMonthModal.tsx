'use client'

import { Modal } from '@/components/ui/layout/Modal'
import { useState, useEffect } from 'react'
import { formatMoney, roundToCents } from '@/lib/utils/money'
import { authorizedFetch } from '@/lib/utils/api'

interface EnvelopeStatus {
    name: string
    icon: string
    current: number
    planned: number
    spent: number
}

interface Props {
    onClose: () => void
    onConfirm: () => void | Promise<void>
    surplus?: number
    monthSummary: {
        income: number
        expenses: number
        savings: number
    }
    monthName?: string
}

export function CloseMonthModal({ onClose, onConfirm, surplus, monthSummary, monthName }: Props) {
    const [envelopeStatus, setEnvelopeStatus] = useState<EnvelopeStatus[]>([])
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const displayMonth = monthName || new Date().toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
    // Użyj surplus jeśli podany, inaczej oblicz z monthSummary
    const balance = surplus !== undefined ? roundToCents(surplus) : roundToCents(monthSummary.income - monthSummary.expenses)

    useEffect(() => {
        authorizedFetch('/api/dashboard')
            .then(res => res.json())
            .then(data => {
                const status = data.monthlyEnvelopes
                    ?.filter((e: any) => e.name !== 'Budowanie Przyszłości' && e.name !== 'Fundusz Awaryjny') // Wyklucz fundusze oszczędnościowe
                    ?.map((e: EnvelopeStatus) => {
                        const remaining = e.planned - e.spent // Pozostałe środki (planowane - wydane)
                        return {
                            name: e.name,
                            icon: e.icon,
                            current: remaining, // Pozostałe środki
                            planned: e.planned,
                            spent: e.spent
                        }
                    })
                setEnvelopeStatus(status || [])
                setLoading(false)
            })
            .catch(() => {
                setLoading(false)
            })
    }, [])

    return (
        <Modal title={`🔒 Zamknij miesiąc - ${displayMonth}`} onClose={onClose}>
            <div style={{ marginBottom: '20px' }}>
                <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                    Czy na pewno chcesz zamknąć bieżący miesiąc? Spowoduje to:
                </p>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--success-primary)' }}>✓</span>
                        Reset wszystkich kopert miesięcznych do 0 zł
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--success-primary)' }}>✓</span>
                        {balance > 0
                            ? `Przeniesienie ${formatMoney(balance, false)} zł (bilans miesiąca) do "Wolnych środków (roczne)"`
                            : balance < 0
                                ? `Zapisanie deficytu ${formatMoney(Math.abs(balance), false)} zł`
                                : 'Bilans miesiąca wynosi 0 zł'}
                    </li>
                    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--success-primary)' }}>✓</span>
                        Zapisanie podsumowania miesiąca w historii
                    </li>
                </ul>
            </div>

            {!loading && envelopeStatus.length > 0 && (
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                        Stan kopert (informacyjnie):
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                        {envelopeStatus.map((e, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-primary)' }}>{e.icon} {e.name}:</span>
                                <span style={{
                                    fontWeight: '500',
                                    color: e.current > 0 ? 'var(--success-primary)' : e.current < 0 ? 'var(--error-primary)' : 'var(--text-secondary)'
                                }}>
                                    {e.current > 0 ? `Zostało ${formatMoney(e.current, false)}` :
                                        e.current < 0 ? `Przekroczono o ${formatMoney(Math.abs(e.current), false)}` :
                                            'Wykorzystano w całości'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{
                backgroundColor: balance >= 0 ? 'var(--bg-success)' : 'var(--bg-error)',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: `1px solid ${balance >= 0 ? 'var(--success-primary)' : 'var(--error-primary)'}`
            }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                    Podsumowanie miesiąca:
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-primary)' }}>Przychody:</span>
                        <span style={{ fontWeight: '600', color: 'var(--success-primary)' }}>+{formatMoney(monthSummary.income, false)} zł</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-primary)' }}>Wydatki:</span>
                        <span style={{ fontWeight: '600', color: 'var(--error-primary)' }}>-{formatMoney(monthSummary.expenses, false)} zł</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderTop: '1px solid',
                        borderColor: balance >= 0 ? 'var(--success-primary)' : 'var(--error-primary)',
                        paddingTop: '8px',
                        fontWeight: '600'
                    }}>
                        <span style={{ color: 'var(--text-primary)' }}>BILANS (do przeniesienia):</span>
                        <span style={{ color: balance >= 0 ? 'var(--success-primary)' : 'var(--error-primary)', fontSize: '16px' }}>
                            {balance >= 0 ? '+' : ''}{formatMoney(balance, false)} zł
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-primary)' }}>Stopa oszczędności:</span>
                        <span style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>
                            {monthSummary.income > 0 ? Math.round((balance / monthSummary.income) * 100) : 0}%
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                    onClick={onClose}
                    disabled={isSubmitting}
                    style={{
                        padding: '8px 16px',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.6 : 1
                    }}
                >
                    Anuluj
                </button>
                <button
                    onClick={async () => {
                        setIsSubmitting(true)
                        try {
                            await onConfirm()
                        } finally {
                            setIsSubmitting(false)
                        }
                    }}
                    disabled={isSubmitting}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: 'var(--accent-primary)',
                        color: 'white',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        fontWeight: '500',
                        opacity: isSubmitting ? 0.6 : 1
                    }}
                >
                    {isSubmitting ? '⏳ Zamykanie...' : '✓ Zamknij miesiąc'}
                </button>
            </div>
        </Modal>
    )
}