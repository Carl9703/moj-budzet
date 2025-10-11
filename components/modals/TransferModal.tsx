'use client'

import { useState, useRef, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/Toast'
import { getCategoriesForEnvelope } from '../../lib/constants/categories'

interface Envelope {
    id: string
    name: string
    icon: string
    type: 'monthly' | 'yearly'
    currentAmount: number
}

interface Props {
    onClose: () => void
    onSave: (data: TransferData) => void
    envelopes: Envelope[]
}

interface TransferData {
    fromEnvelopeId: string
    toEnvelopeId: string
    amount: number
    description: string
    date: string
    toCategory?: string
}

export function TransferModal({ onClose, onSave, envelopes }: Props) {
    const { showToast } = useToast()
    const [fromEnvelopeId, setFromEnvelopeId] = useState('')
    const [toEnvelopeId, setToEnvelopeId] = useState('')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [toCategory, setToCategory] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    
    const amountInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (amountInputRef.current) {
            amountInputRef.current.focus()
        }
    }, [])

    const handleSubmit = () => {
        if (!fromEnvelopeId || !toEnvelopeId) {
            showToast('Wybierz koperty źródłową i docelową!', 'warning')
            return
        }

        if (fromEnvelopeId === toEnvelopeId) {
            showToast('Nie można transferować do tej samej koperty!', 'warning')
            return
        }

        const amountNum = Number(amount)
        if (!amountNum || amountNum <= 0) {
            showToast('Kwota musi być większa od 0!', 'warning')
            return
        }

        const fromEnvelope = envelopes.find(e => e.id === fromEnvelopeId)
        if (fromEnvelope && amountNum > fromEnvelope.currentAmount) {
            showToast(`Brak środków! Dostępne: ${fromEnvelope.currentAmount.toFixed(2)} zł`, 'error')
            return
        }

        onSave({
            fromEnvelopeId,
            toEnvelopeId,
            amount: amountNum,
            description: description.trim() || 'Transfer między kopertami',
            date,
            toCategory: toCategory || undefined
        })
        onClose()
    }

    const fromEnvelope = envelopes.find(e => e.id === fromEnvelopeId)
    const toEnvelope = envelopes.find(e => e.id === toEnvelopeId)
    
    // Kategorie dostępne dla koperty docelowej
    const getAvailableCategories = (envelopeId: string) => {
        const envelope = envelopes.find(e => e.id === envelopeId)
        if (!envelope) return []
        
        // Pobierz kategorie dla koperty z systemu
        return getCategoriesForEnvelope(envelope.name)
    }
    
    const availableCategories = getAvailableCategories(toEnvelopeId)

    return (
        <Modal title="💸 TRANSFER MIĘDZY KOPERTAMI" onClose={onClose}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* KOPERTA ŹRÓDŁOWA */}
                <div>
                    <label style={{ 
                        display: 'block', 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        marginBottom: '8px',
                        color: 'var(--text-primary)'
                    }}>
                        📤 Z koperty:
                    </label>
                    <select
                        value={fromEnvelopeId}
                        onChange={(e) => setFromEnvelopeId(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '14px'
                        }}
                    >
                        <option value="">Wybierz kopertę źródłową</option>
                        {envelopes
                            .filter(e => e.currentAmount > 0)
                            .map(envelope => (
                                <option key={envelope.id} value={envelope.id}>
                                    {envelope.icon} {envelope.name} ({envelope.currentAmount.toFixed(2)} zł)
                                </option>
                            ))}
                    </select>
                    {fromEnvelope && (
                        <div style={{ 
                            fontSize: '12px', 
                            color: 'var(--text-secondary)', 
                            marginTop: '4px' 
                        }}>
                            Dostępne środki: {fromEnvelope.currentAmount.toFixed(2)} zł
                        </div>
                    )}
                </div>

                {/* KOPERTA DOCELOWA */}
                <div>
                    <label style={{ 
                        display: 'block', 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        marginBottom: '8px',
                        color: 'var(--text-primary)'
                    }}>
                        📥 Do koperty:
                    </label>
                    <select
                        value={toEnvelopeId}
                        onChange={(e) => setToEnvelopeId(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '14px'
                        }}
                    >
                        <option value="">Wybierz kopertę docelową</option>
                        {envelopes
                            .filter(e => e.id !== fromEnvelopeId)
                            .map(envelope => (
                                <option key={envelope.id} value={envelope.id}>
                                    {envelope.icon} {envelope.name} ({envelope.currentAmount.toFixed(2)} zł)
                                </option>
                            ))}
                    </select>
                </div>

                {/* KATEGORIA (jeśli dostępna) */}
                {availableCategories.length > 0 && (
                    <div>
                        <label style={{ 
                            display: 'block', 
                            fontSize: '14px', 
                            fontWeight: '600', 
                            marginBottom: '8px',
                            color: 'var(--text-primary)'
                        }}>
                            🏷️ Kategoria:
                        </label>
                        <select
                            value={toCategory}
                            onChange={(e) => setToCategory(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid var(--border-primary)',
                                borderRadius: '8px',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                fontSize: '14px'
                            }}
                        >
                            <option value="">Wybierz kategorię (opcjonalnie)</option>
                            {availableCategories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.icon} {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* KWOTA */}
                <div>
                    <label style={{ 
                        display: 'block', 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        marginBottom: '8px',
                        color: 'var(--text-primary)'
                    }}>
                        💰 Kwota:
                    </label>
                    <input
                        ref={amountInputRef}
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={fromEnvelope?.currentAmount || undefined}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '16px',
                            fontWeight: '600'
                        }}
                    />
                </div>

                {/* OPIS */}
                <div>
                    <label style={{ 
                        display: 'block', 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        marginBottom: '8px',
                        color: 'var(--text-primary)'
                    }}>
                        📝 Opis (opcjonalny):
                    </label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="np. Transfer do funduszu awaryjnego"
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '14px'
                        }}
                    />
                </div>

                {/* DATA */}
                <div>
                    <label style={{ 
                        display: 'block', 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        marginBottom: '8px',
                        color: 'var(--text-primary)'
                    }}>
                        📅 Data:
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '14px'
                        }}
                    />
                </div>

                {/* PODSUMOWANIE */}
                {fromEnvelope && toEnvelope && amount && (
                    <div style={{
                        padding: '12px',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-primary)'
                    }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                            📋 Podsumowanie transferu:
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <div>📤 Z: {fromEnvelope.icon} {fromEnvelope.name}</div>
                            <div>📥 Do: {toEnvelope.icon} {toEnvelope.name}</div>
                            <div>💰 Kwota: {Number(amount).toFixed(2)} zł</div>
                            <div>📅 Data: {new Date(date).toLocaleDateString('pl-PL')}</div>
                        </div>
                    </div>
                )}

                {/* PRZYCISKI */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '12px',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                        }}
                    >
                        Anuluj
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!fromEnvelopeId || !toEnvelopeId || !amount}
                        style={{
                            flex: 1,
                            padding: '12px',
                            border: 'none',
                            borderRadius: '8px',
                            backgroundColor: fromEnvelopeId && toEnvelopeId && amount 
                                ? 'var(--accent-primary)' 
                                : 'var(--bg-disabled)',
                            color: fromEnvelopeId && toEnvelopeId && amount 
                                ? 'white' 
                                : 'var(--text-disabled)',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: fromEnvelopeId && toEnvelopeId && amount 
                                ? 'pointer' 
                                : 'not-allowed'
                        }}
                    >
                        💸 Wykonaj transfer
                    </button>
                </div>
            </div>
        </Modal>
    )
}
