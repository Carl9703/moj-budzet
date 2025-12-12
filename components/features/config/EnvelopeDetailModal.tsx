'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Trash2, Plus, AlertCircle, Check } from 'lucide-react'
import { Category } from '@/lib/contexts/CategoryContext'
import { ConfirmationModal } from '@/components/shared/modals'

interface Envelope {
    id: string
    name: string
    icon: string | null
    plannedAmount: number
    group?: string
    type: 'monthly' | 'yearly'
    isAccumulating?: boolean
}

interface EnvelopeDetailModalProps {
    isOpen: boolean
    onClose: () => void
    envelope: Envelope
    categories: Category[]
    onSaveEnvelope: (id: string, updates: Partial<Envelope>) => Promise<void>
    onDeleteEnvelope: (id: string) => Promise<void>
    onAddCategory: (category: Omit<Category, 'id'>) => Promise<void>
    onUpdateCategory: (id: string, updates: Partial<Category>) => Promise<void>
    onDeleteCategory: (id: string) => Promise<void>
}

export function EnvelopeDetailModal({
    isOpen,
    onClose,
    envelope,
    categories,
    onSaveEnvelope,
    onDeleteEnvelope,
    onAddCategory,
    onUpdateCategory,
    onDeleteCategory
}: EnvelopeDetailModalProps) {
    const [formData, setFormData] = useState<Envelope>(envelope)
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'details' | 'categories'>('details')
    const [newCategoryName, setNewCategoryName] = useState('')

    const [deleteConfirmation, setDeleteConfirmation] = useState(false)

    // Reset form data when envelope changes
    useEffect(() => {
        setFormData(envelope)
    }, [envelope])

    const handleSave = async () => {
        setLoading(true)
        try {
            await onSaveEnvelope(envelope.id, formData)
            onClose()
        } catch (error) {
            console.error('Failed to save envelope:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = () => {
        setDeleteConfirmation(true)
    }

    const confirmDelete = async () => {
        setLoading(true)
        setDeleteConfirmation(false)
        try {
            await onDeleteEnvelope(envelope.id)
            onClose()
        } catch (error) {
            console.error('Failed to delete envelope:', error)
            setLoading(false)
        }
    }

    const handleAddCategoryClick = async () => {
        if (!newCategoryName.trim()) return
        await onAddCategory({
            name: newCategoryName,
            icon: '🏷️',
            defaultEnvelope: envelope.name,
            type: envelope.type
        })
        setNewCategoryName('')
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
                            {formData.icon}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">{formData.name}</h2>
                            <p className="text-xs text-slate-400">Edycja szczegółów i kategorii</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 px-5 gap-4 bg-slate-900/30">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`py-3 text-xs font-bold border-b-2 transition-colors uppercase tracking-wider ${activeTab === 'details' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        Szczegóły
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 uppercase tracking-wider ${activeTab === 'categories' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        Kategorie <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px]">{categories.length}</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-900/20">
                    {activeTab === 'details' ? (
                        <div className="space-y-4">
                            {/* Icon & Name */}
                            <div className="flex gap-3 items-start">
                                <div className="w-20">
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider text-center">Ikona</label>
                                    <div className="bg-slate-800/30 p-1.5 rounded-xl border border-slate-700/50 flex justify-center">
                                        <input
                                            value={formData.icon || ''}
                                            onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                            className="w-full bg-transparent text-2xl text-center focus:outline-none"
                                            placeholder="📦"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Nazwa koperty</label>
                                    <input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-slate-800/30 border border-slate-700/50 rounded-xl px-3 py-3 text-base font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            {/* HERO LIMIT */}
                            <div className={`py-3 px-4 rounded-xl border transition-all ${formData.plannedAmount > 0
                                ? 'bg-emerald-500/5 border-emerald-500/20'
                                : 'bg-slate-800/30 border-slate-700/50'}`}>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-center">
                                    {formData.type === 'monthly' ? 'Miesięczny Limit' : 'Cel Oszczędności'}
                                </label>
                                <div className="relative flex items-baseline justify-center">
                                    <input
                                        type="number"
                                        value={formData.plannedAmount || ''}
                                        onChange={e => setFormData({ ...formData, plannedAmount: Number(e.target.value) })}
                                        className="w-full bg-transparent text-3xl font-black text-center text-white placeholder:text-slate-700 focus:outline-none"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-600">PLN</span>
                                </div>
                            </div>

                            {/* SETTINGS GRID */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Group Selection */}
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Grupa</label>
                                    <div className="relative">
                                        <select
                                            value={formData.group || 'needs'}
                                            onChange={e => setFormData({ ...formData, group: e.target.value })}
                                            className="w-full appearance-none bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-indigo-500/50 transition-all"
                                        >
                                            <option value="needs">Potrzeby (Needs)</option>
                                            <option value="lifestyle">Styl Życia (Lifestyle)</option>
                                            <option value="assets">Cele i Majątek (Assets)</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                                            ▼
                                        </div>
                                    </div>
                                </div>

                                {/* Type Selection - Segmented Control */}
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Typ</label>
                                    <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 relative">
                                        <button
                                            onClick={() => setFormData({ ...formData, type: 'monthly' })}
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all relative z-10 ${formData.type === 'monthly' ? 'text-white' : 'text-slate-400'}`}
                                        >
                                            Miesięczna
                                        </button>
                                        <button
                                            onClick={() => setFormData({ ...formData, type: 'yearly' })}
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all relative z-10 ${formData.type === 'yearly' ? 'text-white' : 'text-slate-400'}`}
                                        >
                                            Roczna
                                        </button>

                                        {/* Animated Background for Segment */}
                                        <div className={`absolute top-1 bottom-1 rounded-xl bg-indigo-600 transition-all duration-300 ${formData.type === 'monthly' ? 'left-1 right-[50%]' : 'left-[50%] right-1'
                                            }`} />
                                    </div>
                                </div>
                            </div>

                            {/* ACCUMULATING SWITCH */}
                            <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${formData.isAccumulating
                                ? 'bg-indigo-500/10 border-indigo-500/30'
                                : 'bg-slate-800/30 border-slate-700/50'
                                }`}>
                                <div className="flex-1 pr-3">
                                    <div className={`font-bold text-sm ${formData.isAccumulating ? 'text-indigo-400' : 'text-slate-300'}`}>
                                        Koperta Akumulująca
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                        Środki przechodzą na kolejny miesiąc
                                    </div>
                                </div>
                                <div className={`w-10 h-6 rounded-full relative transition-colors ${formData.isAccumulating ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                                    <input
                                        type="checkbox"
                                        checked={!!formData.isAccumulating}
                                        onChange={e => setFormData({ ...formData, isAccumulating: e.target.checked })}
                                        className="sr-only"
                                    />
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isAccumulating ? 'left-5' : 'left-1'}`} />
                                </div>
                            </label>

                            {/* FOOTER ACTIONS */}
                            <div className="pt-2 flex gap-2">
                                <button
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="px-4 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-sm font-semibold flex items-center gap-2"
                                >
                                    <Trash2 size={16} /> Usuń
                                </button>

                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                >
                                    {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                                    Zapisz zmiany
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Add Category */}
                            <div className="flex gap-3">
                                <input
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    placeholder="Nowa kategoria..."
                                    className="input-glass flex-1"
                                    onKeyDown={e => e.key === 'Enter' && handleAddCategoryClick()}
                                />
                                <button
                                    onClick={handleAddCategoryClick}
                                    disabled={!newCategoryName.trim()}
                                    className="btn-primary px-4"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>

                            {/* Category List */}
                            <div className="space-y-2">
                                {categories.length === 0 ? (
                                    <div className="text-center p-8 border border-dashed border-slate-700 rounded-xl bg-slate-800/30">
                                        <p className="text-slate-400 text-sm">Brak kategorii w tej kopercie. Dodaj pierwszą powyżej.</p>
                                    </div>
                                ) : (
                                    categories.map(cat => (
                                        <div key={cat.id} className="group flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 border border-white/5 hover:border-indigo-500/30 transition-all">
                                            <input
                                                className="w-8 h-8 text-center bg-transparent border border-transparent hover:border-slate-600 rounded text-lg focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all"
                                                value={cat.icon}
                                                onChange={e => onUpdateCategory(cat.id, { icon: e.target.value })}
                                            />
                                            <input
                                                className="flex-1 bg-transparent border-none text-slate-200 focus:text-white font-medium outline-none placeholder-slate-600"
                                                value={cat.name}
                                                onChange={e => onUpdateCategory(cat.id, { name: e.target.value })}
                                            />
                                            <button
                                                onClick={() => onDeleteCategory(cat.id)}
                                                className="p-2 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex gap-3 text-sm text-indigo-200">
                                <AlertCircle size={20} className="shrink-0 text-indigo-400" />
                                <p>Kategorie są przypisane do koperty. Zmiana nazwy koperty automatycznie zaktualizuje powiązanie dla wszystkich kategorii.</p>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            <ConfirmationModal
                isOpen={deleteConfirmation}
                onClose={() => setDeleteConfirmation(false)}
                onConfirm={confirmDelete}
                title="Usuń kopertę"
                description="Czy na pewno chcesz usunąć tę kopertę? To może wpłynąć na historię transakcji."
                confirmText="Usuń"
                variant="danger"
                isLoading={loading}
            />
        </div>
    )
}
