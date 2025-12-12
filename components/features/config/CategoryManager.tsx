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
            data: { id, name }
        })
    }

    const confirmDelete = async () => {
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
                    console.log(`Skipping ${cat.name} - already exists`)
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Tag className="text-pink-500" />
                        Kategorie Wydatków
                    </h2>
                    <p className="text-slate-400 text-sm">
                        Zarządzaj kategoriami wydatków i przypisuj je do domyślnych kopert
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Filters removed per user request */}
                    <button
                        onClick={() => {
                            resetForm()
                            setIsAdding(!isAdding)
                        }}
                        className={`
              flex items-center gap-2 px-4 py-2 rounded-xl transition-all
              ${isAdding
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'}
            `}
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
                        <form onSubmit={handleSubmit} className="glass-card p-6 border-indigo-500/30 mb-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                {editingId ? <Edit2 size={18} className="text-indigo-400" /> : <Plus size={18} className="text-indigo-400" />}
                                {editingId ? 'Edytuj kategorię' : 'Nowa kategoria'}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400">Ikona</label>
                                    <input
                                        type="text"
                                        value={formData.icon}
                                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-center text-xl"
                                        placeholder="🏷️"
                                        maxLength={2}
                                    />
                                </div>

                                <div className="space-y-2 lg:col-span-1">
                                    <label className="text-xs text-slate-400">Nazwa kategorii</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        required
                                    />
                                </div>

                                {/* Type selector removed per user request */}
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400">Domyślna koperta (opcjonalnie)</label>
                                    <input
                                        type="text"
                                        value={formData.defaultEnvelope || ''}
                                        onChange={(e) => setFormData({ ...formData, defaultEnvelope: e.target.value || undefined })}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    Zapisz
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
                            <p className="text-sm text-slate-400">
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
                            <div className="h-8 w-8 bg-slate-700/50 rounded-full mb-2" />
                            <div className="h-4 w-3/4 bg-slate-700/50 rounded mb-2" />
                            <div className="h-3 w-1/2 bg-slate-700/30 rounded" />
                        </div>
                    ))
                ) : filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                        <motion.div
                            key={category.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card p-4 group hover:border-indigo-500/30 transition-all"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="w-10 h-10 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center text-xl">
                                    {category.icon}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleStartEdit(category)}
                                        className="p-1.5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 rounded-lg transition-colors"
                                        title="Edytuj"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category.id, category.name)}
                                        className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                                        title="Usuń"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-semibold text-white mb-1">{category.name}</h3>

                            <div className="flex flex-col gap-1 text-xs text-slate-400">
                                {category.defaultEnvelope && (
                                    <div className="flex items-center gap-1.5">
                                        <FolderOpen size={10} className="text-emerald-400" />
                                        <span>{category.defaultEnvelope}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-slate-400 flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
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
