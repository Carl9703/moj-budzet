// components/modals/OtherIncomeModal.tsx
'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'

interface Props {
    onClose: () => void
    onSave: (data: OtherIncomeData) => void
}

interface OtherIncomeData {
    amount: number
    description: string
    includeInStats: boolean
}

export function OtherIncomeModal({ onClose, onSave }: Props) {
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [includeInStats, setIncludeInStats] = useState(true)

    const handleSubmit = () => {
        if (!amount || Number(amount) <= 0) {
            alert('Wprowadź prawidłową kwotę!')
            return
        }

        onSave({
            amount: Number(amount),
            description: description || (includeInStats ? 'Inny przychód' : 'Zwrot/Refundacja'),
            includeInStats
        })
        onClose()
    }

    return (
        <Modal title="💰 INNE PRZYCHODY" onClose={onClose}>
            {/* Kwota */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '500',
                    fontSize: '14px',
                    color: '#374151'
                }}>
                    Kwota
                </label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}
                    autoFocus
                />
            </div>

            {/* Opis */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '500',
                    fontSize: '14px',
                    color: '#374151'
                }}>
                    Opis
                </label>
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={includeInStats ? "np. Zlecenie, zwrot podatku" : "np. Zwrot pożyczki, refundacja"}
                    style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px'
                    }}
                />
            </div>

            {/* Suwak - Wliczaj do statystyk */}
            <div style={{
                marginBottom: '24px',
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
                            marginBottom: '4px',
                            color: '#111827'
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

                {/* Przykłady */}
                <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #e5e7eb',
                    fontSize: '11px',
                    color: '#6b7280'
                }}>
                    <div style={{ marginBottom: '4px' }}>
                        <strong>Przykłady {includeInStats ? 'przychodów' : 'zwrotów'}:</strong>
                    </div>
                    {includeInStats ? (
                        <ul style={{ margin: '0', paddingLeft: '20px' }}>
                            <li>Dodatkowe zlecenie</li>
                            <li>Zwrot podatku (PIT)</li>
                            <li>Premia uznaniowa</li>
                            <li>Sprzedaż na Vinted</li>
                        </ul>
                    ) : (
                        <ul style={{ margin: '0', paddingLeft: '20px' }}>
                            <li>Zwrot pożyczki od kolegi</li>
                            <li>Refundacja za bilety</li>
                            <li>Wyrównanie za wspólne zakupy</li>
                            <li>Zwrot kaucji</li>
                        </ul>
                    )}
                </div>
            </div>

            {/* Przyciski */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                    onClick={onClose}
                    style={{
                        padding: '10px 20px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}
                >
                    Anuluj
                </button>
                <button
                    onClick={handleSubmit}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px'
                    }}
                >
                    ✓ Dodaj {includeInStats ? 'przychód' : 'zwrot'}
                </button>
            </div>
        </Modal>
    )
}