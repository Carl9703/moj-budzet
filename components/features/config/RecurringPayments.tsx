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

import { RecurringPayment, Envelope } from '@/lib/types'

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
        let response: Response
        try {
            response = await authorizedFetch(
                editingPayment ? `/api/config/recurring-payments/${editingPayment.id}` : '/api/config/recurring-payments',
                {
                    method: editingPayment ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                }
            )
        } catch (error) {
            console.error('Error saving payment:', error)
            showToast('Błąd zapisywania płatności', 'error')
            throw error
        }

        const resData = await response.json()
        if (resData.success) {
            showToast(resData.message, 'success')
            setIsModalOpen(false)
            setEditingPayment(null)
            fetchPayments()
        } else {
            showToast(resData.error || 'Błąd zapisywania płatności', 'error')
            throw new Error(resData.error || 'Błąd zapisywania płatności')
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
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 p-6 rounded-3xl border border-white/5 bg-slate-900/50 backdrop-blur-xl gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shadow-inner">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">
                            Płatności Cykliczne
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">Zarządzaj automatycznymi przypomnieniami</p>
                    </div>
                </div>
                <button
                    onClick={handleAddNew}
                    className="px-6 py-3 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all active:scale-95 flex items-center gap-3"
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
                                className="p-5 rounded-3xl border border-white/5 bg-slate-900/50 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-slate-800/80 hover:border-white/10 transition-all group shadow-xl"
                            >
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner ${payment.isActive ? (payment.type === 'transfer' ? 'bg-purple-500/10 text-purple-400' : 'bg-indigo-500/10 text-indigo-400') : 'bg-slate-900 text-slate-600'}`}>
                                        {payment.type === 'transfer' ? '🔄' : '💳'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-3 mb-1.5 mt-1">
                                            <span className={`font-bold text-white text-base tracking-tight truncate ${!payment.isActive && 'line-through opacity-50'}`}>{payment.name}</span>
                                            {!payment.isActive && <span className="text-[8px] font-black bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-md border border-white/5 uppercase tracking-widest">NIEAKTYWNA</span>}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                            <span className="font-black text-indigo-400 text-sm bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20 tabular-nums">{payment.amount.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN</span>
                                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                <Calendar size={12} className="text-slate-600" /> Dzień: <span className="text-slate-300">{payment.dayOfMonth}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-1 rounded-full bg-slate-700 hidden sm:block"></div>
                                                {payment.type === 'transfer' ? (
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transfer do: <span className="text-indigo-400">{payment.toEnvelope?.icon} {payment.toEnvelope?.name}</span></span>
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{payment.envelope?.icon} {payment.envelope?.name}</span>
                                                        <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{getCategoryIcon(payment.category)} {getCategoryName(payment.category)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto justify-end opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => handleEdit(payment)} className="w-10 h-10 bg-slate-900 hover:bg-indigo-600 hover:text-white rounded-xl transition-all text-slate-500 flex items-center justify-center border border-white/5 shadow-inner">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(payment.id)} className="w-10 h-10 bg-slate-900 hover:bg-rose-600 hover:text-white rounded-xl transition-all text-slate-500 flex items-center justify-center border border-white/5 shadow-inner">
                                        <Trash2 size={16} />
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
