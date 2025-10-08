'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { EXPENSE_CATEGORIES, getExpenseCategories, getCategoriesForEnvelope, trackCategoryUsage, trackEnvelopeUsage, getPopularEnvelopes } from '@/lib/constants/categories'
import { useToast } from '@/components/ui/Toast'

interface Props {
    onClose: () => void
    onSave: (data: ExpenseData) => void
    envelopes: { id: string; name: string; icon: string; type: string }[]
}

interface ExpenseData {
    amount: number
    description: string
    envelopeId: string | null
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
    const [showAllEnvelopes, setShowAllEnvelopes] = useState(false)
    const [useFreeFunds, setUseFreeFunds] = useState(false)

    const amountInputRef = useRef<HTMLInputElement>(null)

    // Pobierz kategorie dla wybranej koperty
    const selectedEnvelopeData = envelopes.find(e => e.id === selectedEnvelope)
    const envelopeCategories = selectedEnvelopeData 
        ? getCategoriesForEnvelope(selectedEnvelopeData.name)
        : []
    
    // Wszystkie kategorie wydatków (dla opcji "Pokaż wszystkie")
    const allExpenseCategories = getExpenseCategories()
    
    // Kategorie do wyświetlenia (domyślnie wszystkie, lub dla koperty)
    const displayCategories = showAllCategories ? allExpenseCategories : envelopeCategories

    useEffect(() => {
        if (amountInputRef.current) {
            amountInputRef.current.focus()
        }
    }, [])

    const handleEnvelopeSelect = (envelopeId: string) => {
        setSelectedEnvelope(envelopeId)
        setSelectedCategory('') // Reset kategorii przy zmianie koperty
        setUseFreeFunds(false) // Odznacz wolne środki
        
        // Śledź użycie koperty
        trackEnvelopeUsage(envelopeId)
    }

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategory(categoryId)
        // Zapisz użycie kategorii
        trackCategoryUsage(categoryId)
        
        // Automatycznie wybierz kopertę na podstawie kategorii
        const category = EXPENSE_CATEGORIES.find(c => c.id === categoryId)
        if (category && category.defaultEnvelope) {
            const envelope = envelopes.find(e => e.name === category.defaultEnvelope)
            if (envelope) {
                setSelectedEnvelope(envelope.id)
            }
        }
    }

    const handleSubmit = () => {
        if (!amount || (!useFreeFunds && !selectedEnvelope) || (!useFreeFunds && !selectedCategory)) {
            showToast('Wypełnij wszystkie pola!', 'warning')
            return
        }

        // Znajdź kopertę "Wolne środki (roczne)" jeśli używamy wolnych środków
        const freeFundsEnvelope = useFreeFunds ? envelopes.find(e => e.name === 'Wolne środki (roczne)') : null

        onSave({
            amount: Number(amount),
            description,
            envelopeId: useFreeFunds ? (freeFundsEnvelope?.id || null) : selectedEnvelope,
            category: useFreeFunds ? 'Wolne środki' : selectedCategory,
            date
        })
        onClose()
    }

    // Znajdź wybraną kategorię
    const selectedCategoryData = envelopeCategories.find(c => c.id === selectedCategory)

    // Grupuj kategorie według typu (miesięczne/roczne)
    const monthlyCategories = displayCategories.filter(c => c.type === 'monthly')
    const yearlyCategories = displayCategories.filter(c => c.type === 'yearly')

    return (
        <Modal title="💸 DODAJ WYDATEK" onClose={onClose}>
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px',
                maxHeight: '85vh',
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
                    
                    {/* DATA - pod kwotą */}
                    <div style={{ marginTop: '8px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Data wydatku
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
                </div>

                {/* KOPERTY */}
                <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: 'var(--text-primary)', fontSize: '14px' }}>
                        Wybierz kopertę
                        {!showAllCategories && (
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                                (najpopularniejsze)
                            </span>
                        )}
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

                    {/* Opcja Wolne środki */}
                    <div style={{ marginBottom: '12px' }}>
                        <button
                            onClick={() => {
                                setUseFreeFunds(true)
                                setSelectedEnvelope('')
                                setSelectedCategory('')
                            }}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: useFreeFunds ? '2px solid var(--accent-primary)' : '1px solid var(--border-primary)',
                                borderRadius: '8px',
                                backgroundColor: useFreeFunds ? 'var(--success-light)' : 'var(--bg-secondary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            <span style={{ fontSize: '20px' }}>💰</span>
                            <span>Wolne środki</span>
                            {useFreeFunds && (
                                <span style={{ 
                                    fontSize: '12px', 
                                    color: 'var(--success-primary)',
                                    backgroundColor: 'var(--bg-success)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    marginLeft: 'auto'
                                }}>
                                    ✓ Wybrane
                                </span>
                            )}
                        </button>
                        {useFreeFunds && (
                            <div style={{ 
                                fontSize: '11px', 
                                color: 'var(--text-secondary)', 
                                marginTop: '4px',
                                textAlign: 'center'
                            }}>
                                Wydatek bez przypisania do koperty
                            </div>
                        )}
                    </div>

                    {/* Pobierz popularne koperty */}
                    {!useFreeFunds && (() => {
                        const popularEnvelopes = getPopularEnvelopes(envelopes, 12) // Zwiększ limit
                        const monthlyEnvelopes = popularEnvelopes.filter(e => e.type === 'monthly')
                        const yearlyEnvelopes = popularEnvelopes.filter(e => e.type === 'yearly')
                        
                        // Jeśli brak rocznych w popularnych, dodaj wszystkie roczne
                        const allYearlyEnvelopes = envelopes.filter(e => e.type === 'yearly')
                        const finalYearlyEnvelopes = yearlyEnvelopes.length > 0 ? yearlyEnvelopes : allYearlyEnvelopes
                        
                        return (
                            <>
                                {/* Koperty miesięczne - zawsze widoczne */}
                                {monthlyEnvelopes.length > 0 && (
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
                                            {monthlyEnvelopes.map((env) => (
                                                <button
                                                    key={env.id}
                                                    onClick={() => handleEnvelopeSelect(env.id)}
                                                    style={{
                                                        padding: '6px 4px',
                                                        border: selectedEnvelope === env.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-primary)',
                                                        borderRadius: '6px',
                                                        backgroundColor: selectedEnvelope === env.id ? 'var(--success-light)' : 'var(--bg-secondary)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '2px',
                                                        transition: 'all 0.2s',
                                                        fontSize: '11px'
                                                    }}
                                                >
                                                    <span style={{ fontSize: '20px' }}>{env.icon}</span>
                                                    <span style={{ fontSize: '11px', textAlign: 'center', color: 'var(--text-primary)' }}>{env.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* Koperty roczne - tylko po rozwinięciu */}
                                {showAllEnvelopes && finalYearlyEnvelopes.length > 0 && (
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
                                            {finalYearlyEnvelopes.map((env) => (
                                                <button
                                                    key={env.id}
                                                    onClick={() => handleEnvelopeSelect(env.id)}
                                                    style={{
                                                        padding: '10px 8px',
                                                        border: selectedEnvelope === env.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-primary)',
                                                        borderRadius: '8px',
                                                        backgroundColor: selectedEnvelope === env.id ? 'var(--success-light)' : 'var(--bg-tertiary)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <span style={{ fontSize: '20px' }}>{env.icon}</span>
                                                    <span style={{ fontSize: '11px', textAlign: 'center', color: 'var(--text-primary)' }}>{env.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* Przyciski przełączania widoku kopert */}
                                {!showAllEnvelopes ? (
                                    <button
                                        onClick={() => setShowAllEnvelopes(true)}
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
                                        Pokaż wszystkie koperty →
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setShowAllEnvelopes(false)}
                                        style={{
                                            width: '100%',
                                            padding: '6px',
                                            border: '1px solid var(--accent-primary)',
                                            borderRadius: '6px',
                                            backgroundColor: 'var(--accent-light)',
                                            color: 'var(--accent-primary)',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        ← Pokaż tylko popularne koperty
                                    </button>
                                )}
                            </>
                        )
                    })()}
                </div>

                {/* KATEGORIE - tylko gdy nie używamy wolnych środków */}
                {!useFreeFunds && (
                <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: 'var(--text-primary)', fontSize: '14px' }}>
                        Wybierz kategorię
                        {!showAllCategories && (
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                                (najpopularniejsze)
                            </span>
                        )}
                    </label>

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
                                {monthlyCategories.map((cat) => {
                                    const isFromSelectedEnvelope = cat.defaultEnvelope === selectedEnvelopeData?.name
                                    return (
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
                                                fontSize: '11px',
                                                opacity: isFromSelectedEnvelope ? 1 : 0.7
                                            }}
                                        >
                                            <span style={{ fontSize: '20px' }}>{cat.icon}</span>
                                            <span style={{ fontSize: '11px', textAlign: 'center', color: 'var(--text-primary)' }}>{cat.name}</span>
                                            {!isFromSelectedEnvelope && (
                                                <span style={{ fontSize: '8px', color: 'var(--text-secondary)' }}>
                                                    {cat.defaultEnvelope}
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
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
                                {yearlyCategories.map((cat) => {
                                    const isFromSelectedEnvelope = cat.defaultEnvelope === selectedEnvelopeData?.name
                                    return (
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
                                                transition: 'all 0.2s',
                                                opacity: isFromSelectedEnvelope ? 1 : 0.7
                                            }}
                                        >
                                            <span style={{ fontSize: '20px' }}>{cat.icon}</span>
                                            <span style={{ fontSize: '11px', textAlign: 'center', color: 'var(--text-primary)' }}>{cat.name}</span>
                                            {!isFromSelectedEnvelope && (
                                                <span style={{ fontSize: '8px', color: 'var(--text-secondary)' }}>
                                                    {cat.defaultEnvelope}
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </>
                    )}

                    {/* Przyciski przełączania widoku kategorii */}
                    {!showAllCategories ? (
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
                    ) : (
                        <button
                            onClick={() => setShowAllCategories(false)}
                            style={{
                                width: '100%',
                                padding: '6px',
                                border: '1px solid var(--accent-primary)',
                                borderRadius: '6px',
                                backgroundColor: 'var(--accent-light)',
                                color: 'var(--accent-primary)',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500'
                            }}
                        >
                            ← Pokaż tylko kategorie dla {selectedEnvelopeData?.name}
                        </button>
                    )}
                </div>
                )}

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
                    disabled={!amount || (!useFreeFunds && (!selectedCategory || !selectedEnvelope))}
                    style={{
                        padding: '12px 24px',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: amount && (useFreeFunds || (selectedCategory && selectedEnvelope)) ? 'var(--accent-error)' : 'var(--border-secondary)',
                        color: amount && (useFreeFunds || (selectedCategory && selectedEnvelope)) ? 'white' : 'var(--text-secondary)',
                        cursor: amount && (useFreeFunds || (selectedCategory && selectedEnvelope)) ? 'pointer' : 'not-allowed',
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