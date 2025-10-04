'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { EXPENSE_CATEGORIES, getPopularCategories, trackCategoryUsage, findEnvelopeForCategory } from '@/lib/constants/categories'
import { useToast } from '@/components/ui/Toast'

interface Props {
    onClose: () => void
    onSave: (data: ExpenseData) => void
    envelopes: { id: string; name: string; icon: string; type: string }[]
}

interface ExpenseData {
    amount: number
    description: string
    envelopeId: string
    category: string
    date: string
}

export function ExpenseModal({ onClose, onSave, envelopes }: Props) {
    const { showToast } = useToast()
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')
    const [selectedEnvelope, setSelectedEnvelope] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [showAllCategories, setShowAllCategories] = useState(false)

    const amountInputRef = useRef<HTMLInputElement>(null)

    // Pobierz popularne kategorie
    const popularCategories = getPopularCategories(9)

    // Filtruj kategorie do wyświetlenia
    const displayCategories = showAllCategories ? EXPENSE_CATEGORIES : popularCategories

    useEffect(() => {
        if (amountInputRef.current) {
            amountInputRef.current.focus()
        }
    }, [])

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategory(categoryId)

        // Zapisz użycie kategorii
        trackCategoryUsage(categoryId)

        // Automatycznie wybierz kopertę
        const envelopeId = findEnvelopeForCategory(categoryId, envelopes)
        if (envelopeId) {
            setSelectedEnvelope(envelopeId)
        }
    }

    const handleSubmit = () => {
        if (!amount || !selectedEnvelope || !selectedCategory) {
            showToast('Wypełnij wszystkie pola!', 'warning')
            return
        }

        onSave({
            amount: Number(amount),
            description,
            envelopeId: selectedEnvelope,
            category: selectedCategory,
            date
        })
        onClose()
    }

    // Znajdź wybraną kategorię
    const selectedCategoryData = EXPENSE_CATEGORIES.find(c => c.id === selectedCategory)

    // Grupuj kategorie według typu (miesięczne/roczne)
    const monthlyCategories = displayCategories.filter(c => c.type === 'monthly')
    const yearlyCategories = displayCategories.filter(c => c.type === 'yearly')

    return (
        <Modal title="💸 DODAJ WYDATEK" onClose={onClose}>
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                maxHeight: '75vh',
                overflowY: 'auto',
                paddingRight: '8px'
            }}>
                {/* KWOTA */}
                <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: 'var(--text-primary)' }}>
                        Kwota
                    </label>
                    <input
                        ref={amountInputRef}
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid var(--border-primary)',
                            borderRadius: '8px',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)'
                        }}
                    />
                </div>

                {/* KATEGORIE */}
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-primary)' }}>
                        Wybierz kategorię
                        {!showAllCategories && (
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                                (najpopularniejsze)
                            </span>
                        )}
                    </label>

                    {/* Kategorie miesięczne */}
                    {monthlyCategories.length > 0 && (
                        <>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                📅 Miesięczne
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '8px',
                                marginBottom: '12px'
                            }}>
                                {monthlyCategories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleCategorySelect(cat.id)}
                                        style={{
                                            padding: '6px 4px',
                                            border: selectedCategory === cat.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-primary)',
                                            borderRadius: '6px',
                                            backgroundColor: selectedCategory === cat.id ? 'var(--success-light)' : 'var(--bg-secondary)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '2px',
                                            transition: 'all 0.2s',
                                            fontSize: '11px'
                                        }}
                                    >
                                        <span style={{ fontSize: '20px' }}>{cat.icon}</span>
                                        <span style={{ fontSize: '11px', textAlign: 'center', color: 'var(--text-primary)' }}>{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Kategorie roczne */}
                    {yearlyCategories.length > 0 && (
                        <>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                📆 Roczne
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '8px',
                                marginBottom: '12px'
                            }}>
                                {yearlyCategories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleCategorySelect(cat.id)}
                                        style={{
                                            padding: '10px 8px',
                                            border: selectedCategory === cat.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-primary)',
                                            borderRadius: '8px',
                                            backgroundColor: selectedCategory === cat.id ? 'var(--success-light)' : 'var(--bg-tertiary)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '4px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <span style={{ fontSize: '20px' }}>{cat.icon}</span>
                                        <span style={{ fontSize: '11px', textAlign: 'center', color: 'var(--text-primary)' }}>{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Przycisk pokaż wszystkie */}
                    {!showAllCategories && (
                        <button
                            onClick={() => setShowAllCategories(true)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px dashed var(--border-secondary)',
                                borderRadius: '8px',
                                backgroundColor: 'transparent',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '13px'
                            }}
                        >
                            Pokaż wszystkie kategorie →
                        </button>
                    )}
                </div>

                {/* KOPERTA */}
                <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: 'var(--text-primary)' }}>
                        Koperta
                        {selectedCategoryData && (
                            <span style={{
                                fontSize: '12px',
                                color: 'var(--success-primary)',
                                marginLeft: '8px',
                                backgroundColor: 'var(--bg-success)',
                                padding: '2px 6px',
                                borderRadius: '4px'
                            }}>
                                ✓ Auto: {selectedCategoryData.defaultEnvelope}
                            </span>
                        )}
                    </label>
                    <select
                        value={selectedEnvelope}
                        onChange={(e) => setSelectedEnvelope(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: selectedEnvelope ? 'var(--bg-success)' : 'var(--bg-primary)',
                            color: 'var(--text-primary)'
                        }}
                    >
                        <option value="">Wybierz kopertę</option>
                        <optgroup label="📅 Koperty miesięczne">
                            {envelopes.filter(e => e.type === 'monthly').map((env) => (
                                <option key={env.id} value={env.id}>
                                    {env.icon} {env.name}
                                </option>
                            ))}
                        </optgroup>
                        <optgroup label="📆 Koperty roczne">
                            {envelopes.filter(e => e.type === 'yearly').map((env) => (
                                <option key={env.id} value={env.id}>
                                    {env.icon} {env.name}
                                </option>
                            ))}
                        </optgroup>
                    </select>
                </div>

                {/* OPIS */}
                <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: 'var(--text-primary)' }}>
                        Opis (opcjonalnie)
                    </label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="np. Zakupy w Biedronce"
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)'
                        }}
                    />
                </div>

                {/* DATA */}
                <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: 'var(--text-primary)' }}>
                        Data
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)'
                        }}
                    />
                </div>
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
                    disabled={!amount || !selectedCategory || !selectedEnvelope}
                    style={{
                        padding: '12px 24px',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: amount && selectedCategory && selectedEnvelope ? 'var(--accent-error)' : 'var(--border-secondary)',
                        color: amount && selectedCategory && selectedEnvelope ? 'white' : 'var(--text-secondary)',
                        cursor: amount && selectedCategory && selectedEnvelope ? 'pointer' : 'not-allowed',
                        fontWeight: '600',
                        fontSize: '14px'
                    }}
                >
                    ✓ Dodaj wydatek
                </button>
            </div>
        </Modal>
    )
}