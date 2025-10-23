'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Calendar, CreditCard, AlertCircle } from 'lucide-react'
import { authorizedFetch } from '@/lib/utils/api'
import { getCategoryIcon, getCategoryName, getCategoriesForEnvelope, getExpenseCategories } from '@/lib/constants/categories'

interface RecurringPayment {
    id: string
    name: string
    amount: number
    dayOfMonth: number
    envelopeId: string
    category: string
    type: 'expense' | 'transfer'
    fromEnvelopeId?: string
    toEnvelopeId?: string
    isActive: boolean
    envelope: {
        id: string
        name: string
        icon: string
    }
    fromEnvelope?: {
        id: string
        name: string
        icon: string
    }
    toEnvelope?: {
        id: string
        name: string
        icon: string
    }
}

interface Envelope {
    id: string
    name: string
    icon: string
    type: string
}

interface RecurringPaymentsProps {
    envelopes: Envelope[]
}

export function RecurringPayments({ envelopes }: RecurringPaymentsProps) {
    const [payments, setPayments] = useState<RecurringPayment[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingPayment, setEditingPayment] = useState<RecurringPayment | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        dayOfMonth: 1,
        envelopeId: '',
        category: '',
        type: 'expense' as 'expense' | 'transfer',
        fromEnvelopeId: '',
        toEnvelopeId: '',
        isActive: true
    })

    // Pobierz kategorie dla wybranej koperty
    const selectedEnvelopeData = envelopes.find(e => e.id === formData.envelopeId)
    const envelopeCategories = selectedEnvelopeData 
        ? getCategoriesForEnvelope(selectedEnvelopeData.name)
        : []
    
    // Wszystkie kategorie wydatków (dla opcji "Pokaż wszystkie")
    const allExpenseCategories = getExpenseCategories()
    
    // Kategorie do wyświetlenia (domyślnie dla koperty, lub wszystkie)
    const displayCategories = envelopeCategories.length > 0 ? envelopeCategories : allExpenseCategories

    const fetchPayments = async () => {
        try {
            setLoading(true)
            const response = await authorizedFetch('/api/config/recurring-payments')
            const data = await response.json()
            
            if (data.recurringPayments) {
                setPayments(data.recurringPayments)
            }
        } catch (error) {
            console.error('Error fetching recurring payments:', error)
            setMessage({ type: 'error', text: 'Błąd pobierania płatności cyklicznych' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPayments()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        try {
            // Przygotuj dane w zależności od typu
            const submitData: any = {
                name: formData.name,
                amount: parseFloat(formData.amount),
                dayOfMonth: formData.dayOfMonth,
                type: formData.type,
                isActive: formData.isActive
            }

            // Dla wydatków dodaj envelopeId i category
            if (formData.type === 'expense') {
                submitData.envelopeId = formData.envelopeId
                submitData.category = formData.category
            }

            // Dla transferów dodaj toEnvelopeId
            if (formData.type === 'transfer') {
                submitData.toEnvelopeId = formData.toEnvelopeId
            }

            const response = await authorizedFetch(
                editingPayment 
                    ? `/api/config/recurring-payments/${editingPayment.id}`
                    : '/api/config/recurring-payments',
                {
                    method: editingPayment ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(submitData)
                }
            )

            const data = await response.json()

            if (data.success) {
                setMessage({ type: 'success', text: data.message })
                setShowForm(false)
                setEditingPayment(null)
                resetForm()
                fetchPayments()
            } else {
                console.error('API Error:', data)
                setMessage({ type: 'error', text: data.error || 'Błąd zapisywania płatności' })
            }
        } catch (error) {
            console.error('Error saving payment:', error)
            setMessage({ type: 'error', text: 'Błąd zapisywania płatności' })
        }
    }

    const handleEnvelopeChange = (envelopeId: string) => {
        setFormData(prev => ({
            ...prev,
            envelopeId,
            category: '' // Reset kategorii przy zmianie koperty
        }))
    }

    const handleEdit = (payment: RecurringPayment) => {
        setEditingPayment(payment)
        setFormData({
            name: payment.name,
            amount: payment.amount.toString(),
            dayOfMonth: payment.dayOfMonth,
            envelopeId: payment.envelopeId,
            category: payment.category,
            type: payment.type,
            fromEnvelopeId: payment.fromEnvelopeId || '',
            toEnvelopeId: payment.toEnvelopeId || '',
            isActive: payment.isActive
        })
        setShowForm(true)
    }

    const handleDelete = async (paymentId: string) => {
        if (!confirm('Czy na pewno chcesz usunąć tę płatność cykliczną?')) {
            return
        }

        try {
            const response = await authorizedFetch(`/api/config/recurring-payments/${paymentId}`, {
                method: 'DELETE'
            })

            const data = await response.json()

            if (data.success) {
                setMessage({ type: 'success', text: data.message })
                fetchPayments()
            } else {
                setMessage({ type: 'error', text: data.error || 'Błąd usuwania płatności' })
            }
        } catch (error) {
            console.error('Error deleting payment:', error)
            setMessage({ type: 'error', text: 'Błąd usuwania płatności' })
        }
    }

    const resetForm = () => {
        setFormData({
            name: '',
            amount: '',
            dayOfMonth: 1,
            envelopeId: '',
            category: '',
            type: 'expense',
            fromEnvelopeId: '',
            toEnvelopeId: '',
            isActive: true
        })
    }

    const handleCancel = () => {
        setShowForm(false)
        setEditingPayment(null)
        resetForm()
    }

    // Ukryj wiadomość po 3 sekundach
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 3000)
            return () => clearTimeout(timer)
        }
    }, [message])

    // Dodaj informację o tym, które kategorie są dostępne
    const categoryInfo = selectedEnvelopeData 
        ? `Kategorie dla koperty "${selectedEnvelopeData.name}"`
        : 'Wszystkie kategorie'

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid var(--border-primary)',
                    borderTop: '3px solid var(--text-primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px'
                }} />
                <p style={{ color: 'var(--text-secondary)' }}>Ładowanie płatności cyklicznych...</p>
            </div>
        )
    }

    return (
        <div>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--border-primary)'
            }}>
                <div>
                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Calendar size={24} />
                        Płatności Cykliczne
                    </h2>
                    <p style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        margin: '4px 0 0 0'
                    }}>
                        Zarządzaj automatycznymi przypomnieniami o płatnościach
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        backgroundColor: 'var(--accent-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <Plus size={16} />
                    Dodaj płatność
                </button>
            </div>

            {/* Formularz */}
            {showForm && (
                <div style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '24px'
                }}>
                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        margin: '0 0 20px 0'
                    }}>
                        {editingPayment ? 'Edytuj płatność' : 'Nowa płatność cykliczna'}
                    </h3>

                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
                        {/* Typ płatności */}
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: 'var(--text-primary)',
                                marginBottom: '8px'
                            }}>
                                Typ automatyzacji *
                            </label>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                                    style={{
                                        padding: '12px 20px',
                                        backgroundColor: formData.type === 'expense' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                        color: formData.type === 'expense' ? '#ffffff' : 'var(--text-primary)',
                                        border: '2px solid var(--border-primary)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontWeight: '600'
                                    }}
                                >
                                    💳 Płatność
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'transfer' })}
                                    style={{
                                        padding: '12px 20px',
                                        backgroundColor: formData.type === 'transfer' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                        color: formData.type === 'transfer' ? '#ffffff' : 'var(--text-primary)',
                                        border: '2px solid var(--border-primary)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontWeight: '600'
                                    }}
                                >
                                    🔄 Transfer
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: 'var(--text-primary)',
                                    marginBottom: '6px'
                                }}>
                                    Nazwa płatności *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="np. Rachunek za telefon"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid var(--border-primary)',
                                        borderRadius: '6px',
                                        backgroundColor: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: 'var(--text-primary)',
                                    marginBottom: '6px'
                                }}>
                                    Kwota (zł) *
                                </label>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0.00"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid var(--border-primary)',
                                        borderRadius: '6px',
                                        backgroundColor: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Pola dla wydatków */}
                        {formData.type === 'expense' && (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: 'var(--text-primary)',
                                            marginBottom: '6px'
                                        }}>
                                            Dzień miesiąca *
                                        </label>
                                        <select
                                            value={formData.dayOfMonth}
                                            onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                border: '1px solid var(--border-primary)',
                                                borderRadius: '6px',
                                                backgroundColor: 'var(--bg-primary)',
                                                color: 'var(--text-primary)',
                                                fontSize: '14px'
                                            }}
                                        >
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                                <option key={day} value={day}>{day}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: 'var(--text-primary)',
                                            marginBottom: '6px'
                                        }}>
                                            Koperta *
                                        </label>
                                        <select
                                            value={formData.envelopeId}
                                            onChange={(e) => handleEnvelopeChange(e.target.value)}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                border: '1px solid var(--border-primary)',
                                                borderRadius: '6px',
                                                backgroundColor: 'var(--bg-primary)',
                                                color: 'var(--text-primary)',
                                                fontSize: '14px'
                                            }}
                                        >
                                            <option value="">Wybierz kopertę</option>
                                            {envelopes.map(envelope => (
                                                <option key={envelope.id} value={envelope.id}>
                                                    {envelope.icon} {envelope.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: 'var(--text-primary)',
                                        marginBottom: '6px'
                                    }}>
                                        Kategoria *
                                        {selectedEnvelopeData && (
                                            <span style={{
                                                fontSize: '12px',
                                                color: 'var(--text-secondary)',
                                                marginLeft: '8px',
                                                fontStyle: 'italic'
                                            }}>
                                                ({categoryInfo})
                                            </span>
                                        )}
                                    </label>
                                    {displayCategories.length > 0 ? (
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                border: '1px solid var(--border-primary)',
                                                borderRadius: '6px',
                                                backgroundColor: 'var(--bg-primary)',
                                                color: 'var(--text-primary)',
                                                fontSize: '14px'
                                            }}
                                        >
                                            <option value="">Wybierz kategorię</option>
                                            {displayCategories.map(category => (
                                                <option key={category.id} value={category.id}>
                                                    {category.icon} {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div style={{
                                            padding: '10px 12px',
                                            border: '1px solid var(--border-primary)',
                                            borderRadius: '6px',
                                            backgroundColor: 'var(--bg-tertiary)',
                                            color: 'var(--text-secondary)',
                                            fontSize: '14px',
                                            textAlign: 'center'
                                        }}>
                                            Wybierz kopertę, aby zobaczyć dostępne kategorie
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Pola dla transferów */}
                        {formData.type === 'transfer' && (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: 'var(--text-primary)',
                                            marginBottom: '6px'
                                        }}>
                                            Dzień miesiąca *
                                        </label>
                                        <select
                                            value={formData.dayOfMonth}
                                            onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                border: '1px solid var(--border-primary)',
                                                borderRadius: '6px',
                                                backgroundColor: 'var(--bg-primary)',
                                                color: 'var(--text-primary)',
                                                fontSize: '14px'
                                            }}
                                        >
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                                <option key={day} value={day}>{day}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: 'var(--text-primary)',
                                            marginBottom: '6px'
                                        }}>
                                            Koperta docelowa *
                                        </label>
                                        <select
                                            value={formData.toEnvelopeId}
                                            onChange={(e) => {
                                                const selectedEnvelope = envelopes.find(env => env.id === e.target.value)
                                                let category = 'transfer' // domyślna kategoria
                                                
                                                // Automatycznie ustaw kategorię na podstawie koperty
                                                if (selectedEnvelope) {
                                                    if (selectedEnvelope.name === 'Wesele') category = 'wedding'
                                                    else if (selectedEnvelope.name === 'Fundusz Awaryjny') category = 'emergency'
                                                    else if (selectedEnvelope.name === 'Podróże') category = 'vacation'
                                                }
                                                
                                                setFormData({ 
                                                    ...formData, 
                                                    toEnvelopeId: e.target.value,
                                                    category: category
                                                })
                                            }}
                                            required={formData.type === 'transfer'}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                border: '1px solid var(--border-primary)',
                                                borderRadius: '6px',
                                                backgroundColor: 'var(--bg-primary)',
                                                color: 'var(--text-primary)',
                                                fontSize: '14px'
                                            }}
                                        >
                                            <option value="">Wybierz kopertę docelową</option>
                                            {envelopes
                                                .filter(envelope => 
                                                    envelope.name === 'Wesele' || 
                                                    envelope.name === 'Fundusz Awaryjny' || 
                                                    envelope.name === 'Podróże'
                                                )
                                                .map(envelope => (
                                                    <option key={envelope.id} value={envelope.id}>
                                                        {envelope.icon} {envelope.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{
                                    fontSize: '12px',
                                    color: 'var(--text-secondary)',
                                    marginTop: '8px',
                                    fontStyle: 'italic',
                                    padding: '8px 12px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderRadius: '6px'
                                }}>
                                    💡 Transfer będzie pobierał środki z głównego salda konta
                                </div>
                            </>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                style={{ margin: 0 }}
                            />
                            <label htmlFor="isActive" style={{
                                fontSize: '14px',
                                color: 'var(--text-primary)',
                                cursor: 'pointer'
                            }}>
                                Aktywna (będzie pokazywana w Centrum Akcji)
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={handleCancel}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-primary)',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                Anuluj
                            </button>
                            <button
                                type="submit"
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: 'var(--accent-primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                {editingPayment ? 'Zapisz zmiany' : 'Dodaj płatność'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lista płatności */}
            {payments.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '12px'
                }}>
                    <CreditCard size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        margin: '0 0 8px 0'
                    }}>
                        Brak płatności cyklicznych
                    </h3>
                    <p style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        margin: 0
                    }}>
                        Dodaj pierwszą płatność cykliczną, aby otrzymywać przypomnienia
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                    {payments.map(payment => (
                        <div
                            key={payment.id}
                            style={{
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border-primary)',
                                borderRadius: '8px',
                                padding: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '16px'
                            }}
                        >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: 'var(--text-primary)'
                                    }}>
                                        {payment.name}
                                    </span>
                                    {!payment.isActive && (
                                        <span style={{
                                            fontSize: '12px',
                                            padding: '2px 6px',
                                            backgroundColor: 'var(--bg-tertiary)',
                                            color: 'var(--text-secondary)',
                                            borderRadius: '4px'
                                        }}>
                                            Nieaktywna
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                    <span style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>
                                        {payment.amount.toFixed(2)} zł
                                    </span>
                                    <span>•</span>
                                    <span>Dzień: {payment.dayOfMonth}</span>
                                    <span>•</span>
                                    {payment.type === 'transfer' ? (
                                        <>
                                            <span>🔄 Transfer: Główne saldo → {payment.toEnvelope?.icon} {payment.toEnvelope?.name}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{payment.envelope.icon} {payment.envelope.name}</span>
                                            <span>•</span>
                                            <span>{getCategoryIcon(payment.category)} {getCategoryName(payment.category)}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                <button
                                    onClick={() => handleEdit(payment)}
                                    style={{
                                        padding: '6px 10px',
                                        backgroundColor: 'var(--bg-tertiary)',
                                        color: 'var(--text-secondary)',
                                        border: '1px solid var(--border-primary)',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <Edit size={12} />
                                    Edytuj
                                </button>
                                <button
                                    onClick={() => handleDelete(payment.id)}
                                    style={{
                                        padding: '6px 10px',
                                        backgroundColor: 'var(--error-primary)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <Trash2 size={12} />
                                    Usuń
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Toast message */}
            {message && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    backgroundColor: message.type === 'success' ? 'var(--success-primary)' : 'var(--error-primary)',
                    color: 'white',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 1000,
                    fontSize: '14px',
                    fontWeight: '500',
                    maxWidth: '300px'
                }}>
                    {message.text}
                </div>
            )}
        </div>
    )
}
