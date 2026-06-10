import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Package, Archive, RefreshCw, AlertTriangle, CheckCircle2, Tag, RotateCcw, Wallet, TrendingUp } from 'lucide-react'
import { EnvelopeCard } from './EnvelopeCard'
import { EnvelopeDetailModal } from './EnvelopeDetailModal'
import { AddEnvelopeModal } from './AddEnvelopeModal'
import { Category } from '@/lib/contexts/CategoryContext'
import { authorizedFetch } from '@/lib/api/client'
import { useToast } from '@/components/ui/feedback/Toast'

interface Envelope {
    id: string
    name: string
    icon: string | null
    plannedAmount: number
    currentAmount: number
    group?: string
    type: 'monthly' | 'yearly'
    isArchived?: boolean
    currencyCode?: string
    parentEnvelopeId?: string | null
}

interface ArchivedCategory {
    id: string
    name: string
    icon: string
    defaultEnvelope?: string
    isArchived: boolean
}

interface EnvelopeManagerProps {
    envelopes: Envelope[]
    categories: Category[]
    defaultSalary: number
    onSaveEnvelope: (id: string, updates: Partial<Envelope>) => Promise<void>
    onDeleteEnvelope: (id: string) => Promise<void>
    onAddEnvelope: (data: Partial<Envelope>) => Promise<void>
    onAddCategory: (category: Omit<Category, 'id'>) => Promise<void>
    onUpdateCategory: (id: string, updates: Partial<Category>) => Promise<void>
    onDeleteCategory: (id: string) => Promise<void>
    onRefreshCategories?: () => Promise<void>
}

export function EnvelopeManager({
    envelopes,
    categories,
    defaultSalary,
    onSaveEnvelope,
    onDeleteEnvelope,
    onAddEnvelope,
    onAddCategory,
    onUpdateCategory,
    onDeleteCategory,
    onRefreshCategories
}: EnvelopeManagerProps) {
    const { showToast } = useToast()
    const [showArchived, setShowArchived] = useState(false)
    const [selectedEnvelope, setSelectedEnvelope] = useState<Envelope | null>(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [initialGroupForAdd, setInitialGroupForAdd] = useState('needs')

    // Archived categories state
    const [archivedCategories, setArchivedCategories] = useState<ArchivedCategory[]>([])
    const [loadingArchived, setLoadingArchived] = useState(false)
    const [restoringId, setRestoringId] = useState<string | null>(null)

    // Fetch archived categories when showing archive
    useEffect(() => {
        if (showArchived) {
            fetchArchivedCategories()
        }
    }, [showArchived])

    const fetchArchivedCategories = async () => {
        setLoadingArchived(true)
        try {
            const response = await authorizedFetch('/api/categories?includeArchived=true')
            if (response.ok) {
                const allCategories = await response.json()
                const archived = allCategories.filter((c: ArchivedCategory) => c.isArchived === true)
                setArchivedCategories(archived)
            }
        } catch (error) {
            console.error('Failed to fetch archived categories:', error)
        } finally {
            setLoadingArchived(false)
        }
    }

    const handleRestoreCategory = async (categoryId: string) => {
        setRestoringId(categoryId)
        try {
            const response = await authorizedFetch(`/api/categories/${categoryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isArchived: false })
            })
            if (response.ok) {
                setArchivedCategories(prev => prev.filter(c => c.id !== categoryId))
                showToast('Kategoria przywrócona', 'success')
                // Refresh active categories list
                if (onRefreshCategories) {
                    await onRefreshCategories()
                }
            } else {
                showToast('Błąd przywracania kategorii', 'error')
            }
        } catch (error) {
            showToast('Błąd przywracania kategorii', 'error')
        } finally {
            setRestoringId(null)
        }
    }

    const handleRestoreEnvelope = async (envelope: Envelope) => {
        try {
            await onSaveEnvelope(envelope.id, { isArchived: false })
            showToast('Koperta przywrócona', 'success')
        } catch (error) {
            showToast('Błąd przywracania koperty', 'error')
        }
    }

    const KNOWN_GROUPS = ['needs', 'lifestyle', 'assets']

    // Group envelopes
    const groupedEnvelopes = {
        needs: envelopes.filter(e => e.group === 'needs' && !!e.isArchived === showArchived),
        lifestyle: envelopes.filter(e => e.group === 'lifestyle' && !!e.isArchived === showArchived),
        assets: envelopes.filter(e => e.group === 'assets' && !!e.isArchived === showArchived),
        other: envelopes.filter(e => !KNOWN_GROUPS.includes(e.group ?? '') && !!e.isArchived === showArchived),
    }

    const getGroupTitle = (key: string) => {
        switch (key) {
            case 'needs': return 'Potrzeby'
            case 'lifestyle': return 'Styl Życia'
            case 'assets': return 'Cele i Majątek'
            case 'other': return 'Inne'
            default: return 'Inne'
        }
    }

    const getGroupIcon = (key: string) => {
        switch (key) {
            case 'needs': return '🏡'
            case 'lifestyle': return '🎉'
            case 'assets': return '💰'
            case 'other': return '📦'
            default: return '📦'
        }
    }

    const handleAddClick = (group: string) => {
        setInitialGroupForAdd(group)
        setIsAddModalOpen(true)
    }

    return (
        <div className="space-y-8">
            {/* Unified Header Card */}
            <div className="p-4 rounded-[2rem] border border-white/10 bg-zinc-900/50 backdrop-blur-3xl shadow-xl relative overflow-hidden group">
                {/* Ambient Glows */}
                <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
                    {/* Left: Title and Info */}
                    <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-inner transition-all duration-500 ${showArchived ? 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20' : 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'}`}>
                            {showArchived ? <Archive size={22} /> : <Package size={22} />}
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                                {showArchived ? 'Archiwum Systemu' : 'Zarządzanie Kopertami'}
                                {showArchived && <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-md border border-amber-500/30 font-black uppercase tracking-widest">Wgląd</span>}
                            </h3>
                            <button
                                onClick={() => setShowArchived(!showArchived)}
                                className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-0.5 hover:text-amber-400 transition-colors flex items-center gap-1.5"
                            >
                                {showArchived ? <><RotateCcw size={10} /> Wróć do edycji</> : <><Archive size={10} /> Zobacz zarchiwizowane</>}
                            </button>
                        </div>
                    </div>

                    {/* Right: Summary or Archive Specific Controls */}
                    {!showArchived ? (
                        <div className="flex flex-col sm:flex-row items-center gap-8">
                            {/* Budget Stats */}
                            <div className="flex flex-col items-center sm:items-end gap-1">
                                <div className="flex items-center gap-3">
                                    <p className="text-[22px] font-black text-white tracking-tighter tabular-nums">
                                        {envelopes
                                            .filter(e => e.type === 'monthly' && !e.isArchived)
                                            .reduce((sum, e) => sum + (e.plannedAmount || 0), 0)
                                            .toLocaleString('pl-PL', { minimumFractionDigits: 0 })}
                                        <span className="text-xs font-bold text-zinc-600 ml-1.5 uppercase tracking-widest">Zaplanowano</span>
                                    </p>
                                    <div className="w-px h-6 bg-white/5" />
                                    <div className="text-right">
                                        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest leading-none">Limit Mies.</p>
                                        <p className="text-xs font-black text-zinc-300 mt-0.5">
                                            {defaultSalary.toLocaleString('pl-PL')} zł
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Circular/Visual Progress */}
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-black ${(defaultSalary - envelopes.filter(e => e.type === 'monthly' && !e.isArchived).reduce((sum, e) => sum + (e.plannedAmount || 0), 0)) >= 0
                                        ? 'text-emerald-500' : 'text-rose-500'
                                        }`}>
                                        {((envelopes.filter(e => e.type === 'monthly' && !e.isArchived).reduce((sum, e) => sum + (e.plannedAmount || 0), 0) / defaultSalary) * 100).toFixed(0)}%
                                    </span>
                                    <div className="w-24 h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, Math.max(0, (envelopes.filter(e => e.type === 'monthly' && !e.isArchived).reduce((sum, e) => sum + (e.plannedAmount || 0), 0) / defaultSalary) * 100))}%` }}
                                            className={`h-full rounded-full ${(envelopes.filter(e => e.type === 'monthly' && !e.isArchived).reduce((sum, e) => sum + (e.plannedAmount || 0), 0)) > defaultSalary
                                                ? 'bg-rose-500 shadow-[0_0_8px_#ef4444]' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                                                }`}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs font-black text-zinc-600 uppercase tracking-widest">
                                    Wolne: {(defaultSalary - envelopes.filter(e => e.type === 'monthly' && !e.isArchived).reduce((sum, e) => sum + (e.plannedAmount || 0), 0)).toLocaleString('pl-PL')} zł
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-black uppercase tracking-widest">
                                Tryb Przeglądania Archiwum
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Grid */}
            {Object.entries(groupedEnvelopes).map(([groupKey, groupEnvelopes]) => (
                (groupKey === 'other' && groupEnvelopes.length === 0) ? null :
                <div key={groupKey} className="flex flex-col gap-4">
                    {/* Horizontal Section Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1.5 rounded-full bg-zinc-900/50 border border-white/5 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px]"
                                    style={{
                                        backgroundColor: groupKey === 'needs' ? '#22c55e' : groupKey === 'lifestyle' ? '#f59e0b' : '#6366f1',
                                        boxShadow: `0 0 10px ${groupKey === 'needs' ? '#22c55e' : groupKey === 'lifestyle' ? '#f59e0b' : '#6366f1'}`
                                    }}
                                />
                                <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <span>{getGroupIcon(groupKey)}</span>
                                    {getGroupTitle(groupKey)}
                                </h2>
                            </div>
                            <span className="text-xs font-black bg-zinc-900 text-zinc-500 px-2 py-1 rounded-lg border border-white/5 shadow-inner">
                                {groupEnvelopes.length}
                            </span>
                        </div>
                        {!showArchived && (
                            <button
                                onClick={() => handleAddClick(groupKey)}
                                className="px-4 py-2 rounded-xl bg-zinc-900/50 text-amber-400 border border-amber-500/20 text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-2 active:scale-95"
                            >
                                <Plus size={14} /> Dodaj kopertę
                            </button>
                        )}
                    </div>

                    <div className="w-full">
                        {groupEnvelopes.length === 0 ? (
                            <div className="text-center py-16 rounded-[2rem] border-2 border-dashed border-white/5 bg-zinc-900/10 backdrop-blur-sm">
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-700 italic">Brak {showArchived ? 'zarchiwizowanych' : ''} kopert w tej grupie.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {groupEnvelopes.map(env => (
                                    <EnvelopeCard
                                        key={env.id}
                                        envelope={env}
                                        onClick={(e) => setSelectedEnvelope(e)}
                                        onRestore={showArchived ? handleRestoreEnvelope : undefined}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* Archived Categories Section - only show when viewing archive */}
            {showArchived && (
                <div className="flex flex-col gap-4 mt-12 pb-20">
                    <div className="flex items-center gap-3 px-1">
                        <div className="px-3 py-1.5 rounded-full bg-zinc-900/50 border border-white/5 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px] bg-amber-500 shadow-amber-500" />
                            <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Tag size={14} />
                                Zarchiwizowane Kategorie
                            </h2>
                        </div>
                        <span className="text-xs font-black bg-zinc-900 text-zinc-500 px-2 py-1 rounded-lg border border-white/5 shadow-inner">
                            {loadingArchived ? '...' : archivedCategories.length}
                        </span>
                    </div>

                    <div className="w-full">
                        {loadingArchived ? (
                            <div className="text-center py-20 text-zinc-500 flex flex-col items-center gap-4">
                                <RefreshCw className="animate-spin text-amber-500" size={32} />
                                <p className="text-xs font-black uppercase tracking-widest animate-pulse">Synchronizacja archiwum...</p>
                            </div>
                        ) : archivedCategories.length === 0 ? (
                            <div className="text-center py-20 rounded-[2rem] border-2 border-dashed border-white/5 bg-zinc-900/10 backdrop-blur-sm">
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-700 italic">Brak zarchiwizowanych kategorii.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {archivedCategories.map(cat => (
                                    <div
                                        key={cat.id}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-amber-500/30 transition-all group shadow-lg"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-12 h-12 rounded-xl bg-zinc-800/50 flex items-center justify-center text-xl shrink-0 shadow-inner border border-white/5 group-hover:scale-110 transition-transform duration-500">
                                                {cat.icon || '🏷️'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-zinc-200 truncate tracking-tight text-sm">{cat.name}</p>
                                                {cat.defaultEnvelope && (
                                                    <p className="text-xs font-black text-zinc-500 truncate uppercase tracking-widest mt-0.5">
                                                        Koperta: {cat.defaultEnvelope}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRestoreCategory(cat.id)}
                                            disabled={restoringId === cat.id}
                                            className="p-2 text-amber-500 hover:bg-amber-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                            title="Przywróć kategorię"
                                        >
                                            {restoringId === cat.id ? (
                                                <RefreshCw size={16} className="animate-spin" />
                                            ) : (
                                                <RotateCcw size={16} />
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal */}
            {selectedEnvelope && (
                <EnvelopeDetailModal
                    isOpen={!!selectedEnvelope}
                    onClose={() => setSelectedEnvelope(null)}
                    envelope={selectedEnvelope}
                    categories={categories.filter(c => c.defaultEnvelope === selectedEnvelope.name)}
                    onSaveEnvelope={onSaveEnvelope}
                    onDeleteEnvelope={onDeleteEnvelope}
                    onAddCategory={onAddCategory}
                    onUpdateCategory={onUpdateCategory}
                    onDeleteCategory={onDeleteCategory}
                />
            )}

            <AddEnvelopeModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={onAddEnvelope}
                initialGroup={initialGroupForAdd}
                parentEnvelopes={envelopes
                    .filter(e => !e.currencyCode || e.currencyCode === 'PLN')
                    .filter(e => !e.isArchived)
                    .map(e => ({ id: e.id, name: e.name, icon: e.icon }))}
            />
        </div>
    )
}
