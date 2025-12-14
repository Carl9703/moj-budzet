import { useState } from 'react'
import { Plus, Package, Archive, RefreshCw } from 'lucide-react'
import { EnvelopeCard } from './EnvelopeCard'
import { EnvelopeDetailModal } from './EnvelopeDetailModal'
import { AddEnvelopeModal } from './AddEnvelopeModal'
import { Category } from '@/lib/contexts/CategoryContext'

interface Envelope {
    id: string
    name: string
    icon: string | null
    plannedAmount: number
    currentAmount: number
    group?: string
    type: 'monthly' | 'yearly'
    isArchived?: boolean
}

interface EnvelopeManagerProps {
    envelopes: Envelope[]
    categories: Category[]
    onSaveEnvelope: (id: string, updates: Partial<Envelope>) => Promise<void>
    onDeleteEnvelope: (id: string) => Promise<void>
    onAddEnvelope: (data: any) => Promise<void>
    onAddCategory: (category: Omit<Category, 'id'>) => Promise<void>
    onUpdateCategory: (id: string, updates: Partial<Category>) => Promise<void>
    onDeleteCategory: (id: string) => Promise<void>
}

export function EnvelopeManager({
    envelopes,
    categories,
    onSaveEnvelope,
    onDeleteEnvelope,
    onAddEnvelope,
    onAddCategory,
    onUpdateCategory,
    onDeleteCategory
}: EnvelopeManagerProps) {
    const [showArchived, setShowArchived] = useState(false)
    const [selectedEnvelope, setSelectedEnvelope] = useState<Envelope | null>(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [initialGroupForAdd, setInitialGroupForAdd] = useState('needs')

    // Group envelopes
    const groupedEnvelopes = {
        needs: envelopes.filter(e => e.group === 'needs' && !!e.isArchived === showArchived),
        lifestyle: envelopes.filter(e => e.group === 'lifestyle' && !!e.isArchived === showArchived),
        assets: envelopes.filter(e => e.group === 'assets' && !!e.isArchived === showArchived)
    }

    const getGroupTitle = (key: string) => {
        switch (key) {
            case 'needs': return 'Potrzeby'
            case 'lifestyle': return 'Styl Życia'
            case 'assets': return 'Cele i Majątek'
            default: return 'Inne'
        }
    }

    const getGroupIcon = (key: string) => {
        switch (key) {
            case 'needs': return '🏡'
            case 'lifestyle': return '🎉'
            case 'assets': return '💰'
            default: return '📦'
        }
    }

    const handleAddClick = (group: string) => {
        setInitialGroupForAdd(group)
        setIsAddModalOpen(true)
    }

    return (
        <div className="space-y-8">
            {/* Header / Toggle */}
            <div className="glass-card p-4 flex justify-between items-center bg-slate-800/80">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${showArchived ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {showArchived ? <Archive size={20} /> : <Package size={20} />}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white mb-0.5">
                            {showArchived ? 'Zarchiwizowane koperty' : 'Aktywne koperty'}
                        </h3>
                        <p className="text-xs text-slate-400">
                            Zarządzaj swoim budżetem. Kliknij kopertę, aby edytować.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowArchived(!showArchived)}
                    className={`btn-glass text-xs py-2 px-4 shadow-none ${showArchived ? 'bg-indigo-500 text-white border-transparent' : ''}`}
                >
                    {showArchived ? '← Wróć do aktywnych' : 'Pokaż archiwum →'}
                </button>
            </div>

            {/* Grid */}
            {Object.entries(groupedEnvelopes).map(([groupKey, groupEnvelopes]) => (
                <div key={groupKey} className="glass-card overflow-hidden">
                    <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl filter drop-shadow-lg">{getGroupIcon(groupKey)}</span>
                            <h3 className="text-lg font-bold text-white">{getGroupTitle(groupKey)}</h3>
                            <span className="text-xs font-bold bg-slate-800 text-slate-400 px-2 py-1 rounded-full">{groupEnvelopes.length}</span>
                        </div>
                        {!showArchived && (
                            <button
                                onClick={() => handleAddClick(groupKey)}
                                className="btn-glass text-xs py-2 px-3 flex items-center gap-2"
                            >
                                <Plus size={14} /> Dodaj kopertę
                            </button>
                        )}
                    </div>

                    <div className="p-5">
                        {groupEnvelopes.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 border border-dashed border-slate-700/50 rounded-xl">
                                Brak kopert w tej grupie.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {groupEnvelopes.map(env => (
                                    <EnvelopeCard
                                        key={env.id}
                                        envelope={env}
                                        onClick={(e) => setSelectedEnvelope(e)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}

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
            />
        </div>
    )
}
