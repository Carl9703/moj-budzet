'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus,
    Trash2,
    Edit2,
    Save,
    X,
    Tag,
    Box,
    RefreshCw,
    FolderOpen
} from 'lucide-react'
import { useCategories, Category } from '@/lib/contexts/CategoryContext'
import { useToast } from '@/components/ui/feedback/Toast'
import { ConfirmationModal } from '@/components/shared/modals'

export const CategoryManager = () => {
    const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories()
    const { showToast } = useToast()

    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean
        type: 'delete' | 'migrate'
        data?: any
    }>({ isOpen: false, type: 'delete' })

    // Form states
    const [formData, setFormData] = useState<Partial<Category>>({
        name: '',
        icon: '🏷️',
        type: 'monthly',
        defaultEnvelope: undefined
    })

    // Filter state
    // const [filterType, setFilterType] = useState<'all' | 'monthly' | 'yearly'>('all')

    const resetForm = () => {
        setFormData({
            name: '',
            icon: '🏷️',
            type: 'monthly',
            defaultEnvelope: undefined
        })
        setIsAdding(false)
        setEditingId(null)
    }

    const handleStartEdit = (category: Category) => {
        setFormData({
            name: category.name,
            icon: category.icon,
            type: category.type as 'monthly' | 'yearly', // Cast if needed
            defaultEnvelope: category.defaultEnvelope || undefined
        })
        setEditingId(category.id)
        setIsAdding(false)
    }

    const handleDelete = (id: string, name: string) => {
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            data: { id, name } as Category
        })
    }

    const confirmDelete = async () => {
        if (!confirmModal.data) return
        const { id, name } = confirmModal.data
        if (!id) return

        try {
            await deleteCategory(id)
            showToast(`Kategoria ${name} została usunięta.`, 'success')
        } catch (error) {
            showToast("Nie udało się usunąć kategorii.", 'error')
        } finally {
            setConfirmModal(prev => ({ ...prev, isOpen: false }))
        }
    }

    const [legacyCategories, setLegacyCategories] = useState<Category[]>([])
    const [migrating, setMigrating] = useState(false)

    // Check for legacy data
    useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('expenseCategories')
            if (saved) {
                try {
                    const parsed = JSON.parse(saved)
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setLegacyCategories(parsed)
                    }
                } catch (e) {
                    console.error('Error parsing legacy categories', e)
                }
            }
        }
    })

    const handleMigrate = () => {
        setConfirmModal({
            isOpen: true,
            type: 'migrate',
            data: { count: legacyCategories.length }
        })
    }

    const confirmMigrate = async () => {
        setMigrating(true)
        setConfirmModal(prev => ({ ...prev, isOpen: false }))

        let successCount = 0
        let failCount = 0

        for (const cat of legacyCategories) {
            try {
                // Check if exists (by name)
                const exists = categories.some(c => c.name === cat.name)
                if (!exists) {
                    await addCategory({
                        name: cat.name,
                        icon: cat.icon,
                        type: 'monthly', // Default, legacy type ignored
                        defaultEnvelope: cat.defaultEnvelope || null
                    })
                    successCount++
                } else {
                    // console.log(`Skipping ${cat.name} - already exists`)
                }
            } catch (e) {
                console.error(`Failed to migrate ${cat.name}`, e)
                failCount++
            }
        }

        showToast(`Migracja zakończona: zaimportowano ${successCount}, błędy ${failCount}`, successCount > 0 ? 'success' : 'info')
        setMigrating(false)
        setLegacyCategories([]) // Clear local state, maybe keep in localStorage for safety
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name) {
            showToast("Nazwa kategorii jest wymagana.", 'error')
            return
        }

        try {
            if (editingId) {
                await updateCategory(editingId, formData)
                showToast(`Kategoria ${formData.name} została zaktualizowana.`, 'success')
            } else {
                await addCategory(formData as Omit<Category, "id" | "createdAt" | "updatedAt" | "userId">)
                showToast(`Kategoria ${formData.name} została dodana.`, 'success')
            }
            resetForm()
        } catch (error) {
            showToast("Wystąpił błąd podczas zapisywania kategorii.", 'error')
        }
    }

    const filteredCategories = categories.filter(c => true)

    // const getTypeLabel = (type: string) => {
    //     return type === 'monthly' ? 'Miesięczna' : 'Roczna'
    // }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center shadow-inner">
                        <Tag size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">Kategorie Wydatków</h2>
                        <p className="text-xs text-zinc-500 font-medium">Zarządzaj klasyfikacją swoich wydatków</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Filters removed per user request */}
                    <button
                        onClick={() => {
                            resetForm()
                            setIsAdding(!isAdding)
                        }}
                        className={`px-6 py-3 rounded-2xl transition-all text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 active:scale-95 shadow-xl ${isAdding
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20'}`}
                    >
                        {isAdding ? <X size={18} /> : <Plus size={18} />}
                        {isAdding ? 'Anuluj' : 'Dodaj kategorię'}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {(isAdding || editingId) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <form onSubmit={handleSubmit} className="p-6 rounded-3xl border border-amber-500/20 bg-zinc-900/40 backdrop-blur-xl mb-6 shadow-2xl relative overflow-hidden group/form">
                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50" />

                            <h3 className="text-xs font-black text-white mb-6 flex items-center gap-3 uppercase tracking-[0.2em]">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                                    {editingId ? <Edit2 size={14} /> : <Plus size={14} />}
                                </div>
                                {editingId ? 'Edytuj kategorię' : 'Nowa kategoria'}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Ikona</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={formData.icon}
                                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                            className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-500/50 transition-all text-center text-2xl shadow-inner"
                                            placeholder="🏷️"
                                            maxLength={2}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 lg:col-span-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Nazwa kategorii</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl px-5 py-4 text-sm font-black text-white focus:outline-none focus:border-amber-500/50 transition-all shadow-inner placeholder:text-zinc-700"
                                        placeholder="NP. ZAKUPY SPOŻYWCZE"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Domyślna koperta</label>
                                    <input
                                        type="text"
                                        value={formData.defaultEnvelope || ''}
                                        onChange={(e) => setFormData({ ...formData, defaultEnvelope: e.target.value || undefined })}
                                        className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl px-5 py-4 text-sm font-black text-white focus:outline-none focus:border-amber-500/50 transition-all shadow-inner placeholder:text-zinc-700"
                                        placeholder="NP. JEDZENIE"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-3 text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center gap-3 active:scale-95 text-[10px] font-black uppercase tracking-[0.2em]"
                                >
                                    <Save size={16} />
                                    Zapisz kategorię
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {legacyCategories.length > 0 && categories.length === 0 && (
                <div className="glass-card mb-6 p-4 border-amber-500/30 bg-amber-500/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                            <Box size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Znaleziono ustawienia lokalne</h3>
                            <p className="text-sm text-zinc-400">
                                Wykryto {legacyCategories.length} kategorii zapisanych w przeglądarce. Baza danych jest pusta.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleMigrate}
                        disabled={migrating}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                    >
                        {migrating ? <RefreshCw className="animate-spin" size={18} /> : 'Importuj do bazy'}
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {loading ? (
                    // Loading skeletons
                    Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="glass-card p-4 h-32 animate-pulse flex flex-col justify-between">
                            <div className="h-8 w-8 bg-zinc-700/50 rounded-full mb-2" />
                            <div className="h-4 w-3/4 bg-zinc-700/50 rounded mb-2" />
                            <div className="h-3 w-1/2 bg-zinc-700/30 rounded" />
                        </div>
                    ))
                ) : filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                        <motion.div
                            key={category.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-5 rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-xl group hover:bg-zinc-800/80 transition-all shadow-xl"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-950/50 border border-white/5 flex items-center justify-center text-2xl shadow-inner">
                                    {category.icon}
                                </div>
                                <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={() => handleStartEdit(category)}
                                        className="w-9 h-9 flex items-center justify-center bg-zinc-900 hover:bg-amber-600 text-zinc-500 hover:text-white rounded-xl border border-white/5 transition-all shadow-inner"
                                        title="Edytuj"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category.id, category.name)}
                                        className="w-9 h-9 flex items-center justify-center bg-zinc-900 hover:bg-rose-600 text-zinc-500 hover:text-white rounded-xl border border-white/5 transition-all shadow-inner"
                                        title="Usuń"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-bold text-white text-base tracking-tight mb-2">{category.name}</h3>

                            <div className="flex flex-col gap-1">
                                {category.defaultEnvelope ? (
                                    <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 w-fit">
                                        <FolderOpen size={10} className="text-emerald-400" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">{category.defaultEnvelope}</span>
                                    </div>
                                ) : (
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 px-2">Brak domyślnej koperty</span>
                                )}
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-zinc-400 flex flex-col items-center">
                        <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                            <Box size={24} className="opacity-50" />
                        </div>
                        <p>Brak kategorii spełniających kryteria.</p>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.type === 'delete' ? confirmDelete : confirmMigrate}
                title={confirmModal.type === 'delete' ? 'Usuń kategorię' : 'Importuj kategorie'}
                description={confirmModal.type === 'delete'
                    ? `Czy na pewno chcesz usunąć kategorię "${confirmModal.data?.name}"?`
                    : `Znaleziono ${confirmModal.data?.count} kategorii w pamięci przeglądarki. Czy chcesz je zaimportować do bazy danych?`}
                confirmText={confirmModal.type === 'delete' ? 'Usuń' : 'Importuj'}
                variant={confirmModal.type === 'delete' ? 'danger' : 'info'}
            />
        </div>
    )
}
