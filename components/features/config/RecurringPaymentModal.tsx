'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Trash2, Calendar, CreditCard, ChevronDown, Check } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { recurringPaymentSchema, RecurringPaymentFormData } from '@/lib/schemas'
import { useCategories } from '@/lib/contexts/CategoryContext'
import { RecurringPayment, Envelope } from '@/lib/types'
import { blockInvalidDecimals } from '@/lib/utils/input'

interface RecurringPaymentModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: RecurringPaymentFormData) => Promise<void>
    onDelete?: (id: string) => Promise<void>
    initialData?: RecurringPayment | null
    envelopes: Envelope[]
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
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-xl">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">
                                {initialData ? 'Edytuj Płatność' : 'Nowa Płatność'}
                            </h2>
                            <p className="text-xs text-zinc-400">Automatyczne płatności cykliczne</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-zinc-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit(onSubmitForm)} className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-zinc-900/20">
                    <div className="space-y-4">

                        {/* HERO AMOUNT */}
                        <div className={`py-3 px-4 rounded-xl border transition-all ${Number(watchedAmount) > 0
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-zinc-800/30 border-zinc-700/50'}`}>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 text-center">
                                Kwota Płatności
                            </label>
                            <div className="relative flex items-baseline justify-center">
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('amount', { valueAsNumber: true })}
                                    onInput={blockInvalidDecimals}
                                    className="w-full bg-transparent text-3xl font-black text-center text-white placeholder:text-zinc-700 focus:outline-none"
                                    placeholder="0.00"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-600">PLN</span>
                            </div>
                            {errors.amount && <p className="text-rose-400 text-xs text-center mt-1">{errors.amount.message}</p>}
                        </div>

                        {/* TYPE SEGMENTED CONTROL */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider text-center">Rodzaj</label>
                            <div className="flex bg-zinc-800/50 p-1 rounded-xl border border-zinc-700/50 relative">
                                <button
                                    type="button"
                                    onClick={() => setValue('type', 'expense')}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all relative z-10 flex items-center justify-center gap-2 ${watchedType === 'expense' ? 'text-white' : 'text-zinc-400'}`}
                                >
                                    <CreditCard size={14} /> Wydatek
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setValue('type', 'transfer')}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all relative z-10 flex items-center justify-center gap-2 ${watchedType === 'transfer' ? 'text-white' : 'text-zinc-400'}`}
                                >
                                    <span>🔄</span> Transfer
                                </button>
                                <div className={`absolute top-1 bottom-1 rounded-xl transition-all duration-300 ${watchedType === 'expense'
                                    ? 'bg-amber-600 left-1 right-[50%]'
                                    : 'bg-purple-600 left-[50%] right-1'}`}
                                />
                            </div>
                        </div>

                        {/* NAME & DAY GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Nazwa</label>
                                <input
                                    {...register('name')}
                                    className="w-full bg-zinc-800/30 border border-zinc-700/50 rounded-xl px-3 py-3 text-sm font-bold text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 transition-all"
                                />
                                {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name.message}</p>}
                            </div>

                            <CustomSelect
                                label="Dzień"
                                value={watch('dayOfMonth')}
                                onChange={(val) => setValue('dayOfMonth', val)}
                                options={daysOptions.map(opt => ({ label: opt.label, value: opt.value }))}
                            />
                        </div>

                        {/* EXPENSE FIELDS */}
                        {watchedType === 'expense' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <CustomSelect
                                    label="Z koperty"
                                    value={watchedEnvelopeId}
                                    onChange={(val) => {
                                        setValue('envelopeId', val)
                                        setValue('category', '') // Reset category when envelope changes
                                    }}
                                    options={envelopes.map(e => ({ label: e.name, value: e.id, icon: e.icon || undefined }))}
                                    placeholder="Wybierz kopertę..."
                                    error={errors.envelopeId ? 'Wymagane' : undefined}
                                />
                                <CustomSelect
                                    label="Kategoria"
                                    value={watch('category')}
                                    onChange={(val) => setValue('category', val)}
                                    options={displayCategories.map(c => ({ label: c.name, value: c.id, icon: c.icon || undefined }))}
                                    placeholder="Wybierz kategorię..."
                                    error={errors.category ? 'Wymagane' : undefined}
                                />
                            </div>
                        )}

                        {/* TRANSFER FIELDS */}
                        {watchedType === 'transfer' && (
                            <div className="space-y-3">
                                <CustomSelect
                                    label="Do koperty (Cel)"
                                    value={watch('toEnvelopeId')}
                                    onChange={(val) => setValue('toEnvelopeId', val)}
                                    options={targetEnvelopes.map(e => ({ label: e.name, value: e.id, icon: e.icon || undefined }))}
                                    placeholder="Wybierz cel..."
                                    error={errors.toEnvelopeId ? 'Wymagane' : undefined}
                                />
                            </div>
                        )}

                        {/* ACTIVE SWITCH */}
                        <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${watchedIsActive
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-zinc-800/30 border-zinc-700/50'}`}>
                            <div className="flex-1 pr-3">
                                <div className={`font-bold text-sm ${watchedIsActive ? 'text-amber-400' : 'text-zinc-300'}`}>
                                    Płatność Aktywna
                                </div>
                                <div className="text-xs text-zinc-500">
                                    Odznacz, aby zawiesić płatność bez usuwania
                                </div>
                            </div>
                            <div className={`w-10 h-6 rounded-full relative transition-colors ${watchedIsActive ? 'bg-amber-500' : 'bg-zinc-700'}`}>
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

                            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 text-sm font-semibold transition-colors">
                                Anuluj
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
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

function CustomSelect({
    label,
    value,
    onChange,
    options,
    placeholder = "Wybierz...",
    error
}: {
    label: string,
    value: any,
    onChange: (val: any) => void,
    options: { label: string, value: any, icon?: string }[],
    placeholder?: string,
    error?: string
}) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const selectedOption = options.find(opt => opt.value === value)

    return (
        <div className="relative" ref={containerRef}>
            <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between bg-zinc-800/30 border border-zinc-700/50 rounded-xl px-3 py-3 text-xs font-bold text-white transition-all hover:bg-zinc-800/50 ${isOpen ? 'ring-2 ring-amber-500/30 border-amber-500/50' : ''}`}
            >
                <span className="truncate flex items-center gap-2">
                    {selectedOption ? (
                        <>
                            {selectedOption.icon && <span className="text-base">{selectedOption.icon}</span>}
                            <span>{selectedOption.label}</span>
                        </>
                    ) : (
                        <span className="text-zinc-600 font-medium">{placeholder}</span>
                    )}
                </span>
                <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 4, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute z-[100] left-0 right-0 max-h-60 overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl backdrop-blur-3xl p-1.5 custom-scrollbar"
                    >
                        {options.length === 0 ? (
                            <div className="px-3 py-4 text-center text-xs font-black uppercase text-zinc-600 tracking-widest italic">
                                Brak opcji
                            </div>
                        ) : (
                            options.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.value)
                                        setIsOpen(false)
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all hover:bg-white/5 group ${value === opt.value ? 'bg-amber-600/20 text-amber-400' : 'text-zinc-300'}`}
                                >
                                    <span className="flex items-center gap-3">
                                        {opt.icon && <span className="text-lg group-hover:scale-125 transition-transform duration-300">{opt.icon}</span>}
                                        {opt.label}
                                    </span>
                                    {value === opt.value && <Check size={14} className="animate-in zoom-in duration-300" />}
                                </button>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
            {error && <p className="text-rose-400 text-xs mt-1">{error}</p>}
        </div>
    )
}
