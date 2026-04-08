'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Trash2, Plus, AlertCircle, RefreshCw } from 'lucide-react'
import { Category } from '@/lib/contexts/CategoryContext'
import { ConfirmationModal } from '@/components/shared/modals'
import { authorizedFetch } from '@/lib/api/client'

interface Envelope {
    id: string
    name: string
    icon: string | null
    plannedAmount: number
    group?: string
    type: 'monthly' | 'yearly'
    isAccumulating?: boolean
}

interface CategoryDraft {
    id: string
    icon: string
    name: string
    isDirty: boolean
}

interface CategoryDeleteInfo {
    categoryId: string
    categoryName: string
    transactionCount: number
    willArchive: boolean
}

interface EnvelopeDeleteInfo {
    envelopeId: string
    envelopeName: string
    transactionCount: number
    willArchive: boolean
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

    // Category drafts - local edits that won't trigger API until Save
    const [categoryDrafts, setCategoryDrafts] = useState<CategoryDraft[]>([])
    const [savingCategories, setSavingCategories] = useState(false)

    // Category delete confirmation state
    const [categoryDeleteConfirm, setCategoryDeleteConfirm] = useState<CategoryDeleteInfo | null>(null)
    const [checkingCategory, setCheckingCategory] = useState<string | null>(null)

    // Envelope delete confirmation state
    const [envelopeDeleteConfirm, setEnvelopeDeleteConfirm] = useState<EnvelopeDeleteInfo | null>(null)
    const [checkingEnvelope, setCheckingEnvelope] = useState(false)

    // Reset form data when envelope changes
    useEffect(() => {
        setFormData(envelope)
    }, [envelope])

    // Initialize category drafts when categories change
    useEffect(() => {
        setCategoryDrafts(categories.map(cat => ({
            id: cat.id,
            icon: cat.icon,
            name: cat.name,
            isDirty: false
        })))
    }, [categories])

    // Check if any category has unsaved changes
    const hasUnsavedCategories = categoryDrafts.some(d => d.isDirty)

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

    const handleDelete = async () => {
        setCheckingEnvelope(true)
        try {
            const response = await authorizedFetch(`/api/envelopes/${envelope.id}`)
            if (response.ok) {
                const data = await response.json()
                setEnvelopeDeleteConfirm({
                    envelopeId: envelope.id,
                    envelopeName: envelope.name,
                    transactionCount: data.transactionCount || 0,
                    willArchive: data.willArchive || false
                })
            } else {
                setEnvelopeDeleteConfirm({
                    envelopeId: envelope.id,
                    envelopeName: envelope.name,
                    transactionCount: 0,
                    willArchive: false
                })
            }
        } catch (error) {
            setEnvelopeDeleteConfirm({
                envelopeId: envelope.id,
                envelopeName: envelope.name,
                transactionCount: 0,
                willArchive: false
            })
        } finally {
            setCheckingEnvelope(false)
        }
    }

    const confirmDelete = async () => {
        if (!envelopeDeleteConfirm) return
        setLoading(true)
        setEnvelopeDeleteConfirm(null)
        try {
            await onDeleteEnvelope(envelope.id)
            onClose()
        } catch (error) {
            console.error('Failed to delete envelope:', error)
        }
    }

    const handleAddCategoryClick = async () => {
        if (!newCategoryName.trim()) return
        await onAddCategory({
            name: newCategoryName,
            icon: '',
            defaultEnvelope: envelope.name,
            type: envelope.type
        })
        setNewCategoryName('')
    }

    const updateCategoryDraft = (id: string, updates: Partial<CategoryDraft>) => {
        setCategoryDrafts(prev => prev.map(cat => {
            if (cat.id !== id) return cat
            return { ...cat, ...updates, isDirty: true }
        }))
    }

    const handleSaveAllCategories = async () => {
        setSavingCategories(true)
        try {
            const dirtyCategories = categoryDrafts.filter(c => c.isDirty)
            for (const cat of dirtyCategories) {
                await onUpdateCategory(cat.id, { name: cat.name, icon: cat.icon })
            }
            setCategoryDrafts(prev => prev.map(c => ({ ...c, isDirty: false })))
        } catch (error) {
            console.error('Failed to save categories:', error)
        } finally {
            setSavingCategories(false)
        }
    }

    const handleDiscardCategoryChanges = () => {
        setCategoryDrafts(categories.map(cat => ({
            id: cat.id,
            icon: cat.icon,
            name: cat.name,
            isDirty: false
        })))
    }

    const handleDeleteCategoryClick = async (categoryId: string, categoryName: string) => {
        setCheckingCategory(categoryId)
        try {
            const response = await authorizedFetch(`/api/categories/${categoryId}`)
            if (response.ok) {
                const data = await response.json()
                setCategoryDeleteConfirm({
                    categoryId,
                    categoryName,
                    transactionCount: data.transactionCount || 0,
                    willArchive: data.willArchive || false
                })
            } else {
                setCategoryDeleteConfirm({
                    categoryId,
                    categoryName,
                    transactionCount: 0,
                    willArchive: false
                })
            }
        } catch (error) {
            setCategoryDeleteConfirm({
                categoryId,
                categoryName,
                transactionCount: 0,
                willArchive: false
            })
        } finally {
            setCheckingCategory(null)
        }
    }

    const confirmCategoryDelete = async () => {
        if (!categoryDeleteConfirm) return
        try {
            await onDeleteCategory(categoryDeleteConfirm.categoryId)
        } catch (error) {
            console.error('Failed to delete/archive category:', error)
        } finally {
            setCategoryDeleteConfirm(null)
        }
    }

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col rounded-3xl border border-white/10 bg-zinc-900/90 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-2xl shadow-inner border border-white/5">
                            {formData.icon}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight">{formData.name}</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Edycja szczegółów i kategorii</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all text-zinc-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5 px-6 gap-6 bg-zinc-950/20">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`py-4 text-[10px] font-black transition-all uppercase tracking-[0.2em] border-b-2 ${activeTab === 'details' ? 'border-amber-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Szczegóły
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`py-4 text-[10px] font-black transition-all flex items-center gap-2 uppercase tracking-[0.2em] border-b-2 ${activeTab === 'categories' ? 'border-amber-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Kategorie <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 text-[9px] border border-amber-500/20">{categories.length}</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-zinc-950/20">
                    {activeTab === 'details' ? (
                        <div className="space-y-6">
                            {/* Icon & Name */}
                            <div className="flex gap-4 items-start">
                                <div className="w-24 shrink-0">
                                    <label className="block text-[9px] font-black text-zinc-500 mb-2 uppercase tracking-[0.2em] text-center">Ikona</label>
                                    <div className="bg-zinc-950/50 p-2 rounded-2xl border border-white/10 flex justify-center shadow-inner hover:border-amber-500/50 transition-all">
                                        <input
                                            value={formData.icon || ''}
                                            onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                            className="w-full bg-transparent text-3xl text-center focus:outline-none"
                                            placeholder="📦"
                                            maxLength={2}
                                        />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[9px] font-black text-zinc-500 mb-2 uppercase tracking-[0.2em]">Nazwa koperty</label>
                                    <input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl px-5 py-4 text-base font-black text-white placeholder:text-zinc-700 focus:outline-none focus:border-amber-500/50 transition-all shadow-inner"
                                    />
                                </div>
                            </div>

                            {/* HERO LIMIT - Reduced size */}
                            <div className={`p-4 rounded-2xl border transition-all shadow-lg ${formData.plannedAmount > 0
                                ? 'bg-emerald-500/5 border-emerald-500/20'
                                : 'bg-zinc-950/50 border-white/10'}`}>
                                <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 text-center">
                                    {formData.type === 'monthly' ? 'Miesięczny Limit' : 'Cel Oszczędności'}
                                </label>
                                <div className="relative flex items-baseline justify-center">
                                    <input
                                        type="number"
                                        value={formData.plannedAmount || ''}
                                        onChange={e => setFormData({ ...formData, plannedAmount: Number(e.target.value) })}
                                        className="w-full bg-transparent text-3xl font-black text-center text-white placeholder:text-zinc-800 focus:outline-none tracking-tighter"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-4 bottom-1 text-[9px] font-black text-zinc-600 uppercase tracking-widest">zł</span>
                                </div>
                            </div>

                            {/* SETTINGS GRID */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[9px] font-black text-zinc-500 mb-2 uppercase tracking-[0.2em]">Grupa</label>
                                    <div className="relative">
                                        <select
                                            value={formData.group || 'needs'}
                                            onChange={e => setFormData({ ...formData, group: e.target.value })}
                                            className="w-full appearance-none bg-zinc-950/50 border border-white/10 rounded-2xl px-4 py-3.5 text-xs text-white font-black uppercase tracking-widest focus:outline-none focus:border-amber-500/50 transition-all shadow-inner"
                                        >
                                            <option value="needs">POTRZEBY</option>
                                            <option value="lifestyle">STYL ŻYCIA</option>
                                            <option value="assets">CELE I MAJĄTEK</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-[10px]">
                                            ▼
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black text-zinc-500 mb-2 uppercase tracking-[0.2em]">Typ</label>
                                    <div className="flex bg-zinc-950/50 p-1.5 rounded-2xl border border-white/10 relative shadow-inner">
                                        <button
                                            onClick={() => setFormData({ ...formData, type: 'monthly' })}
                                            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 ${formData.type === 'monthly' ? 'text-white' : 'text-zinc-500'}`}
                                        >
                                            Miesięczna
                                        </button>
                                        <button
                                            onClick={() => setFormData({ ...formData, type: 'yearly' })}
                                            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 ${formData.type === 'yearly' ? 'text-white' : 'text-zinc-500'}`}
                                        >
                                            Roczna
                                        </button>
                                        <div className={`absolute top-1.5 bottom-1.5 rounded-xl bg-amber-600 transition-all duration-300 shadow-lg ${formData.type === 'monthly' ? 'left-1.5 right-[50%]' : 'left-[50%] right-1.5'}`} />
                                    </div>
                                </div>
                            </div>

                            <label className={`flex items-center justify-between p-4 rounded-3xl border cursor-pointer transition-all shadow-lg ${formData.isAccumulating ? 'bg-amber-500/10 border-amber-500/30' : 'bg-zinc-950/50 border-white/10'}`}>
                                <div className="flex-1 pr-4">
                                    <div className={`font-black text-xs uppercase tracking-widest ${formData.isAccumulating ? 'text-amber-400' : 'text-zinc-400'}`}>
                                        Koperta Akumulująca
                                    </div>
                                    <div className="text-[9px] text-zinc-600 font-medium uppercase tracking-[0.05em] mt-0.5">
                                        Środki przechodzą na kolejny miesiąc
                                    </div>
                                </div>
                                <div className={`w-12 h-7 rounded-full relative transition-colors shadow-inner ${formData.isAccumulating ? 'bg-amber-600' : 'bg-zinc-800'}`}>
                                    <input
                                        type="checkbox"
                                        checked={!!formData.isAccumulating}
                                        onChange={e => setFormData({ ...formData, isAccumulating: e.target.checked })}
                                        className="sr-only"
                                    />
                                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-md ${formData.isAccumulating ? 'left-6' : 'left-1'}`} />
                                </div>
                            </label>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="px-6 py-4 rounded-2xl bg-zinc-900/50 border border-white/5 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-lg"
                                >
                                    <Trash2 size={16} /> Usuń
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex-1 py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save size={18} />}
                                    Zapisz zmiany
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <input
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    placeholder="Nowa kategoria..."
                                    className="flex-1 bg-zinc-950/50 border border-white/10 rounded-2xl px-5 py-4 text-sm font-black text-white focus:outline-none focus:border-amber-500/50 transition-all shadow-inner"
                                    onKeyDown={e => e.key === 'Enter' && handleAddCategoryClick()}
                                />
                                <button
                                    onClick={handleAddCategoryClick}
                                    disabled={!newCategoryName.trim()}
                                    className="w-14 h-14 shrink-0 flex items-center justify-center rounded-2xl bg-amber-600 hover:bg-amber-500 text-white shadow-xl shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    <Plus size={24} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {categoryDrafts.length === 0 ? (
                                    <div className="text-center p-12 border border-dashed border-white/5 rounded-3xl bg-zinc-950/20">
                                        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Brak kategorii w tej kopercie</p>
                                    </div>
                                ) : (
                                    categoryDrafts.map(cat => (
                                        <div key={cat.id} className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all shadow-lg ${cat.isDirty ? 'bg-amber-500/5 border-amber-500/20' : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800/80 hover:border-amber-500/20'}`}>
                                            <div className="w-10 h-10 rounded-xl bg-zinc-950/50 border border-white/5 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                                                <input
                                                    className="w-full bg-transparent text-center focus:outline-none"
                                                    value={cat.icon}
                                                    onChange={e => updateCategoryDraft(cat.id, { icon: e.target.value })}
                                                    maxLength={2}
                                                />
                                            </div>
                                            <input
                                                className="flex-1 bg-transparent border-none text-zinc-200 focus:text-white font-black text-sm tracking-tight outline-none placeholder-zinc-700"
                                                value={cat.name}
                                                onChange={e => updateCategoryDraft(cat.id, { name: e.target.value })}
                                            />
                                            {cat.isDirty && <span className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest">Zmieniono</span>}
                                            <button
                                                onClick={() => handleDeleteCategoryClick(cat.id, cat.name)}
                                                disabled={checkingCategory === cat.id}
                                                className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-rose-500 hover:text-white rounded-xl border border-white/5 transition-all text-zinc-500 disabled:opacity-50 shadow-inner"
                                            >
                                                {checkingCategory === cat.id ? <RefreshCw size={14} className="animate-spin" /> : <X size={16} />}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {hasUnsavedCategories && (
                                <div className="p-5 bg-amber-500/5 rounded-3xl border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                                    <div className="flex items-center gap-3 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                                        <AlertCircle size={18} className="text-amber-600" /> Niezapisane zmiany
                                    </div>
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <button onClick={handleDiscardCategoryChanges} className="flex-1 sm:flex-none px-4 py-2 text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">Odrzuć</button>
                                        <button onClick={handleSaveAllCategories} disabled={savingCategories} className={`flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest ${savingCategories ? 'opacity-70 cursor-wait' : ''}`}>
                                            {savingCategories ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />} Zapisz zmiany
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="p-5 bg-zinc-950/40 rounded-3xl border border-white/5 flex gap-4 text-zinc-500 shadow-inner">
                                <AlertCircle size={22} className="shrink-0 text-amber-500/50" />
                                <p className="text-[11px] font-medium leading-relaxed">Kategorie są przypisane do koperty. Zmiana nazwy koperty automatycznie zaktualizuje powiązanie dla wszystkich kategorii.</p>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            <ConfirmationModal
                isOpen={!!envelopeDeleteConfirm}
                onClose={() => setEnvelopeDeleteConfirm(null)}
                onConfirm={confirmDelete}
                title={envelopeDeleteConfirm?.willArchive ? "Archiwizuj kopertę" : "Usuń kopertę"}
                description={envelopeDeleteConfirm?.transactionCount && envelopeDeleteConfirm.transactionCount > 0
                    ? `Koperta "${envelopeDeleteConfirm?.envelopeName}" zostanie zarchiwizowana, ponieważ zawiera ${envelopeDeleteConfirm.transactionCount} transakcji. Spokojnie - Twoja historia wydatków pozostanie nienaruszona, a dane nie zmienią się w "Inne". Koperta po prostu przestanie być widoczna na listach wyboru.`
                    : `Czy na pewno chcesz trwale usunąć pustą kopertę "${envelopeDeleteConfirm?.envelopeName}"? Ta operacja jest nieodwracalna.`}
                confirmText={envelopeDeleteConfirm?.willArchive ? "Archiwizuj bezpiecznie" : "Usuń trwale"}
                variant={envelopeDeleteConfirm?.willArchive ? "info" : "danger"}
                isLoading={loading}
            />

            <ConfirmationModal
                isOpen={!!categoryDeleteConfirm}
                onClose={() => setCategoryDeleteConfirm(null)}
                onConfirm={confirmCategoryDelete}
                title={categoryDeleteConfirm?.willArchive ? "Archiwizuj kategorię" : "Usuń kategorię"}
                description={categoryDeleteConfirm?.transactionCount && categoryDeleteConfirm.transactionCount > 0
                    ? `Kategoria "${categoryDeleteConfirm?.categoryName}" zostanie zarchiwizowana. Zawiera ona ${categoryDeleteConfirm.transactionCount} transakcji, które muszą zostać zachowane w Twojej historii budżetu. Dane pozostaną precyzyjne (nie zmienią się w "Inne"), ale nie będziesz mógł już przypisywać do niej nowych wydatków.`
                    : `Czy na pewno chcesz usunąć nową kategorię "${categoryDeleteConfirm?.categoryName}"? Nie posiada ona jeszcze żadnych transakcji.`}
                confirmText={categoryDeleteConfirm?.willArchive ? "Zarchiwizuj dane" : "Usuń kategorię"}
                variant={categoryDeleteConfirm?.willArchive ? "info" : "danger"}
            />
        </div>
    , document.body)
}
