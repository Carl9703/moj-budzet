'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Calendar, CreditCard } from 'lucide-react'
import { RecurringPaymentFormData } from '@/lib/schemas'
import { authorizedFetch } from '@/lib/api/client'
import { useCategories } from '@/lib/contexts/CategoryContext'
import { useToast } from '@/components/ui/feedback/Toast'
import { motion, AnimatePresence } from 'framer-motion'
import { ConfirmationModal } from '@/components/shared/modals'
import { RecurringPaymentModal } from './RecurringPaymentModal'

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
    envelope: { id: string; name: string; icon: string }
    fromEnvelope?: { id: string; name: string; icon: string }
    toEnvelope?: { id: string; name: string; icon: string }
}

interface Envelope {
    id: string
    name: string
    icon: string
    type: string
    isAccumulating?: boolean
}

interface RecurringPaymentsProps {
    envelopes: Envelope[]
}

export function RecurringPayments({ envelopes }: RecurringPaymentsProps) {
    const [payments, setPayments] = useState<RecurringPayment[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingPayment, setEditingPayment] = useState<RecurringPayment | null>(null)

    const { showToast } = useToast()
    const { getCategoryIcon, getCategoryName } = useCategories()

    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null })
    const [deleting, setDeleting] = useState(false)

    const fetchPayments = async () => {
        try {
            setLoading(true)
            const response = await authorizedFetch('/api/config/recurring-payments')
            const data = await response.json()
            if (data.recurringPayments) setPayments(data.recurringPayments)
        } catch (error) {
            console.error('Error fetching recurring payments:', error)
            showToast('Błąd pobierania płatności cyklicznych', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchPayments() }, [])

    const handleSave = async (data: RecurringPaymentFormData) => {
        try {
            const response = await authorizedFetch(
                editingPayment ? `/api/config/recurring-payments/${editingPayment.id}` : '/api/config/recurring-payments',
                {
                    method: editingPayment ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                }
            )
            const resData = await response.json()

            if (resData.success) {
                showToast(resData.message, 'success')
                setIsModalOpen(false)
                setEditingPayment(null)
                fetchPayments()
            } else {
                showToast(resData.error || 'Błąd zapisywania płatności', 'error')
            }
        } catch (error) {
            console.error('Error saving payment:', error)
            showToast('Błąd zapisywania płatności', 'error')
        }
    }

    const handleEdit = (payment: RecurringPayment) => {
        setEditingPayment(payment)
        setIsModalOpen(true)
    }

    const handleAddNew = () => {
        setEditingPayment(null)
        setIsModalOpen(true)
    }

    const handleDelete = (paymentId: string) => {
        setDeleteConfirmation({ isOpen: true, id: paymentId })
    }

    const confirmDelete = async (idOverride?: string) => {
        const idToDelete = idOverride || deleteConfirmation.id
        if (!idToDelete) return

        setDeleting(true)
        try {
            const response = await authorizedFetch(`/api/config/recurring-payments/${idToDelete}`, { method: 'DELETE' })
            const data = await response.json()
            if (data.success) {
                showToast(data.message, 'success')
                fetchPayments()
                if (idOverride) {
                    setIsModalOpen(false) // Close modal if deleted from within
                }
            } else {
                showToast(data.error || 'Błąd usuwania płatności', 'error')
            }
        } catch (error) {
            console.error('Error deleting payment:', error)
            showToast('Błąd usuwania płatności', 'error')
        } finally {
            setDeleting(false)
            setDeleteConfirmation({ isOpen: false, id: null })
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 gap-4">
                <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-slate-400 text-sm animate-pulse">Ładowanie płatności cyklicznych...</p>
            </div>
        )
    }

    return (
        <div className="p-1">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 p-4 glass-card bg-indigo-900/10 border-indigo-500/20">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20 text-white">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white leading-tight">
                            Płatności Cykliczne
                        </h2>
                        <p className="text-xs text-indigo-200/70">Zarządzaj automatycznymi przypomnieniami</p>
                    </div>
                </div>
                <button
                    onClick={handleAddNew}
                    className="btn-primary py-2 px-4 shadow-lg shadow-indigo-500/20 text-xs flex items-center gap-2"
                >
                    <Plus size={16} /> Dodaj płatność
                </button>
            </div>

            {/* List */}
            {payments.length === 0 ? (
                <div className="text-center p-12 glass-card-static flex flex-col items-center">
                    <div className="p-4 bg-slate-800/50 rounded-full mb-4">
                        <CreditCard size={32} className="text-slate-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Brak płatności cyklicznych</h3>
                    <p className="text-slate-400 text-sm">Dodaj pierwszą płatność, aby system pamiętał o Twoich rachunkach.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    <AnimatePresence>
                        {payments.map((payment, index) => (
                            <motion.div
                                key={payment.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="glass-card-static p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-white/5 hover:border-indigo-500/30 transition-all group"
                            >
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${payment.isActive ? (payment.type === 'transfer' ? 'bg-purple-500/10 text-purple-400' : 'bg-indigo-500/10 text-indigo-400') : 'bg-slate-800 text-slate-600'}`}>
                                        {payment.type === 'transfer' ? '🔄' : '💳'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`font-bold text-white ${!payment.isActive && 'line-through opacity-50'}`}>{payment.name}</span>
                                            {!payment.isActive && <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">NIEAKTYWNA</span>}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                                            <span className="font-bold text-indigo-300 text-sm bg-indigo-500/10 px-1.5 rounded">{payment.amount.toFixed(2)} zł</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                            <span className="flex items-center gap-1"><Calendar size={10} /> Dzień: {payment.dayOfMonth}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                            {payment.type === 'transfer' ? (
                                                <span>Transfer do: {payment.toEnvelope?.icon} {payment.toEnvelope?.name}</span>
                                            ) : (
                                                <>
                                                    <span>{payment.envelope?.icon} {payment.envelope?.name}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                                    <span>{getCategoryIcon(payment.category)} {getCategoryName(payment.category)}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto justify-end opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(payment)} className="p-2 bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors text-slate-400">
                                        <Edit size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(payment.id)} className="p-2 bg-slate-800 hover:bg-rose-600 hover:text-white rounded-lg transition-colors text-slate-400">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <RecurringPaymentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                onDelete={editingPayment ? () => confirmDelete(editingPayment.id) : undefined}
                initialData={editingPayment}
                envelopes={envelopes}
            />

            <ConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ isOpen: false, id: null })}
                onConfirm={() => confirmDelete()}
                title="Usuń płatność cykliczną"
                description="Czy na pewno chcesz usunąć tę płatność cykliczną? Tej operacji nie można cofnąć."
                confirmText="Usuń"
                variant="danger"
                isLoading={deleting}
            />
        </div>
    )
}
