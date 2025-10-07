'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { EXPENSE_CATEGORIES, getExpenseCategories, getCategoriesForEnvelope, trackCategoryUsage } from '@/lib/constants/categories'
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

    // Pobierz kategorie dla wybranej koperty
    const selectedEnvelopeData = envelopes.find(e => e.id === selectedEnvelope)
    const envelopeCategories = selectedEnvelopeData 
        ? getCategoriesForEnvelope(selectedEnvelopeData.name)
        : []

    useEffect(() => {
        if (amountInputRef.current) {
            amountInputRef.current.focus()
        }
    }, [])

    const handleEnvelopeSelect = (envelopeId: string) => {
        setSelectedEnvelope(envelopeId)
        setSelectedCategory('') // Reset kategorii przy zmianie koperty
    }

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategory(categoryId)
        // Zapisz użycie kategorii
        trackCategoryUsage(categoryId)
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
    const selectedCategoryData = envelopeCategories.find(c => c.id === selectedCategory)

    // Grupuj kategorie według typu (miesięczne/roczne)
    const monthlyCategories = envelopeCategories.filter(c => c.type === 'monthly')
    const yearlyCategories = envelopeCategories.filter(c => c.type === 'yearly')

    return (
        <Modal title="💸 DODAJ WYDATEK" onClose={onClose}>
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                maxHeight: '85vh',
                overflowY: 'auto',
                paddingRight: '8px'
            }}>
                {/* KOPERTA - PIERWSZY KROK */}
                <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: 'var(--text-primary)', fontSize: '16px' }}>
                        📁 Wybierz kopertę
                    </label>
                    <select
                        value={selectedEnvelope}
                        onChange={(e) => handleEnvelopeSelect(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid var(--border-primary)',
                            borderRadius: '8px',
                            fontSize: '16px',
                            backgroundColor: selectedEnvelope ? 'var(--success-light)' : 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            fontWeight: '500'
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

                {/* KATEGORIE - POKAZUJ TYLKO PO WYBORZE KOPERTY */}
                {selectedEnvelope && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: 'var(--text-primary)', fontSize: '16px' }}>
                            🏷️ Wybierz kategorię
                        </label>
                        
                        {envelopeCategories.length === 0 ? (
                            <div style={{ 
                                padding: '20px', 
                                textAlign: 'center', 
                                color: 'var(--text-secondary)',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: '8px',
                                border: '1px dashed var(--border-primary)'
                            }}>
                                Brak kategorii dla tej koperty
                            </div>
                        ) : (
                            <>

                    {/* Kategorie miesięczne */}
                    {monthlyCategories.length > 0 && (
                        <>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                                📅 Miesięczne
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '6px',
                                marginBottom: '8px'
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
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                                📆 Roczne
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '6px',
                                marginBottom: '8px'
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
                                padding: '6px',
                                border: '1px dashed var(--border-secondary)',
                                borderRadius: '6px',
                                backgroundColor: 'transparent',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            Pokaż wszystkie kategorie →
                        </button>
                    )}
                            </>
                        )}
                    </div>
                )}

                {/* KWOTA - POKAZUJ TYLKO PO WYBORZE KATEGORII */}
                {selectedCategory && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: 'var(--text-primary)', fontSize: '16px' }}>
                            💰 Kwota
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
                )}

                {/* DATA - POKAZUJ TYLKO PO WYBORZE KATEGORII */}
                {selectedCategory && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: 'var(--text-primary)', fontSize: '14px' }}>
                            📅 Data wydatku
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid var(--border-primary)',
                                borderRadius: '8px',
                                fontSize: '14px',
                                backgroundColor: 'var(--bg-primary)',
                                color: 'var(--text-primary)'
                            }}
                        />
                    </div>
                )}

                {/* OPIS - POKAZUJ TYLKO PO WYBORZE KATEGORII */}
                {selectedCategory && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: 'var(--text-primary)', fontSize: '14px' }}>
                            📝 Opis (opcjonalnie)
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