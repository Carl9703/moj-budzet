'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Trash2, Calendar, CreditCard, ChevronDown, Check } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { recurringPaymentSchema, RecurringPaymentFormData } from '@/lib/schemas'
import { useCategories } from '@/lib/contexts/CategoryContext'

interface RecurringPaymentModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: RecurringPaymentFormData) => Promise<void>
    onDelete?: (id: string) => Promise<void>
    initialData?: any
    envelopes: any[]
}

export function RecurringPaymentModal({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialData,
    envelopes
}: RecurringPaymentModalProps) {
    const [loading, setLoading] = useState(false)
    const { categories, getCategoriesForEnvelope } = useCategories()

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        control,
        formState: { errors },
    } = useForm<RecurringPaymentFormData>({
        resolver: zodResolver(recurringPaymentSchema),
        defaultValues: {
            name: '',
            dayOfMonth: 1,
            type: 'expense',
            envelopeId: '',
            category: '',
            fromEnvelopeId: '',
            toEnvelopeId: '',
            isActive: true
        }
    })

    const watchedType = watch('type')
    const watchedEnvelopeId = watch('envelopeId')
    const watchedIsActive = watch('isActive')
    const watchedAmount = watch('amount')

    const daysOptions = Array.from({ length: 31 }, (_, i) => ({ label: (i + 1).toString(), value: i + 1 }))

    const selectedEnvelopeData = envelopes.find((e: any) => e.id === watchedEnvelopeId)
    const envelopeCategories = selectedEnvelopeData ? getCategoriesForEnvelope(selectedEnvelopeData.name) : []
    const allExpenseCategories = categories.filter((c: any) => c.defaultEnvelope !== null && c.defaultEnvelope !== '')
    const displayCategories = envelopeCategories.length > 0 ? envelopeCategories : allExpenseCategories

    const targetEnvelopes = envelopes.filter((e: any) => e.isAccumulating)

    useEffect(() => {
        if (isOpen && initialData) {
            reset({
                name: initialData.name,
                amount: initialData.amount,
                dayOfMonth: initialData.dayOfMonth,
                type: initialData.type,
                envelopeId: initialData.envelopeId || '',
                category: initialData.category || '',
                fromEnvelopeId: initialData.fromEnvelopeId || '',
                toEnvelopeId: initialData.toEnvelopeId || '',
                isActive: initialData.isActive ?? true
            })
        } else if (isOpen) {
            reset({
                name: '',
                dayOfMonth: 1,
                type: 'expense',
                envelopeId: '',
                category: '',
                fromEnvelopeId: '',
                toEnvelopeId: '',
                isActive: true
            })
        }
    }, [isOpen, initialData, reset])

    const onSubmitForm = async (data: RecurringPaymentFormData) => {
        setLoading(true)
        try {
            await onSave(data)
            onClose()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (onDelete && initialData?.id) {
            setLoading(true)
            try {
                await onDelete(initialData.id)
                onClose()
            } catch (e) { console.error(e) }
            finally { setLoading(false) }
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="glass-card w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-white/10"
            >
                {/* Header */}
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">
                                {initialData ? 'Edytuj Płatność' : 'Nowa Płatność'}
                            </h2>
                            <p className="text-xs text-slate-400">Automatyczne płatności cykliczne</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit(onSubmitForm)} className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-900/20">
                    <div className="space-y-4">

                        {/* HERO AMOUNT */}
                        <div className={`py-3 px-4 rounded-xl border transition-all ${Number(watchedAmount) > 0
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-slate-800/30 border-slate-700/50'}`}>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-center">
                                Kwota Płatności
                            </label>
                            <div className="relative flex items-baseline justify-center">
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('amount', { valueAsNumber: true })}
                                    className="w-full bg-transparent text-3xl font-black text-center text-white placeholder:text-slate-700 focus:outline-none"
                                    placeholder="0.00"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-600">PLN</span>
                            </div>
                            {errors.amount && <p className="text-rose-400 text-[10px] text-center mt-1">{errors.amount.message}</p>}
                        </div>

                        {/* TYPE SEGMENTED CONTROL */}
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider text-center">Rodzaj</label>
                            <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 relative">
                                <button
                                    type="button"
                                    onClick={() => setValue('type', 'expense')}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all relative z-10 flex items-center justify-center gap-2 ${watchedType === 'expense' ? 'text-white' : 'text-slate-400'}`}
                                >
                                    <CreditCard size={14} /> Wydatek
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setValue('type', 'transfer')}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all relative z-10 flex items-center justify-center gap-2 ${watchedType === 'transfer' ? 'text-white' : 'text-slate-400'}`}
                                >
                                    <span>🔄</span> Transfer
                                </button>
                                <div className={`absolute top-1 bottom-1 rounded-xl transition-all duration-300 ${watchedType === 'expense'
                                    ? 'bg-indigo-600 left-1 right-[50%]'
                                    : 'bg-purple-600 left-[50%] right-1'}`}
                                />
                            </div>
                        </div>

                        {/* NAME & DAY GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Nazwa</label>
                                <input
                                    {...register('name')}
                                    className="w-full bg-slate-800/30 border border-slate-700/50 rounded-xl px-3 py-3 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                                />
                                {errors.name && <p className="text-rose-400 text-[10px] mt-1">{errors.name.message}</p>}
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Dzień</label>
                                <div className="relative">
                                    <select
                                        {...register('dayOfMonth', { valueAsNumber: true })}
                                        className="w-full appearance-none bg-slate-800/30 border border-slate-700/50 rounded-xl px-3 py-3 text-sm text-white font-bold focus:outline-none focus:border-indigo-500/50 text-center"
                                    >
                                        {daysOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                                </div>
                            </div>
                        </div>

                        {/* EXPENSE FIELDS */}
                        {watchedType === 'expense' && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Z koperty</label>
                                    <div className="relative">
                                        <select
                                            {...register('envelopeId')}
                                            className="w-full appearance-none bg-slate-800/30 border border-slate-700/50 rounded-xl px-3 py-3 text-xs font-medium text-white focus:outline-none focus:border-indigo-500/50"
                                        >
                                            <option value="">Wybierz...</option>
                                            {envelopes.map((e: any) => (
                                                <option key={e.id} value={e.id}>{e.icon} {e.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                                    </div>
                                    {errors.envelopeId && <p className="text-rose-400 text-[10px] mt-1">Wymagane</p>}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Kategoria</label>
                                    <div className="relative">
                                        <select
                                            {...register('category')}
                                            className="w-full appearance-none bg-slate-800/30 border border-slate-700/50 rounded-xl px-3 py-3 text-xs font-medium text-white focus:outline-none focus:border-indigo-500/50"
                                        >
                                            <option value="">Wybierz...</option>
                                            {displayCategories.map((c: any) => (
                                                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                                    </div>
                                    {errors.category && <p className="text-rose-400 text-[10px] mt-1">Wymagane</p>}
                                </div>
                            </div>
                        )}

                        {/* TRANSFER FIELDS */}
                        {watchedType === 'transfer' && (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Do koperty (Cel)</label>
                                    <div className="relative">
                                        <select
                                            {...register('toEnvelopeId')}
                                            className="w-full appearance-none bg-slate-800/30 border border-slate-700/50 rounded-xl px-3 py-3 text-xs font-medium text-white focus:outline-none focus:border-purple-500/50"
                                        >
                                            <option value="">Wybierz cel...</option>
                                            {targetEnvelopes.map((e: any) => (
                                                <option key={e.id} value={e.id}>{e.icon} {e.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                                    </div>
                                    {errors.toEnvelopeId && <p className="text-rose-400 text-[10px] mt-1">Wymagane</p>}
                                </div>
                            </div>
                        )}

                        {/* ACTIVE SWITCH */}
                        <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${watchedIsActive
                            ? 'bg-indigo-500/10 border-indigo-500/30'
                            : 'bg-slate-800/30 border-slate-700/50'}`}>
                            <div className="flex-1 pr-3">
                                <div className={`font-bold text-sm ${watchedIsActive ? 'text-indigo-400' : 'text-slate-300'}`}>
                                    Płatność Aktywna
                                </div>
                                <div className="text-[10px] text-slate-500">
                                    Odznacz, aby zawiesić płatność bez usuwania
                                </div>
                            </div>
                            <div className={`w-10 h-6 rounded-full relative transition-colors ${watchedIsActive ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                                <input type="checkbox" {...register('isActive')} className="sr-only" />
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${watchedIsActive ? 'left-5' : 'left-1'}`} />
                            </div>
                        </label>

                        {/* FOOTER */}
                        <div className="pt-2 flex gap-2">
                            {initialData && onDelete && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="px-4 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-sm font-semibold flex items-center gap-2"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}

                            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 text-sm font-semibold transition-colors">
                                Anuluj
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                            >
                                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                                {initialData ? 'Zapisz' : 'Dodaj'}
                            </button>
                        </div>

                    </div>
                </form>
            </motion.div>
        </div>
    )
}
