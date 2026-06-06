import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Edit2, Smartphone, Loader2 } from 'lucide-react'
import { authorizedFetch } from '@/lib/api/client'
import { useToast } from '@/components/ui/feedback/Toast'
import { useCategories } from '@/lib/contexts/CategoryContext'
import { ExpenseModal } from '@/components/shared/modals/ExpenseModal'

interface PendingTransaction {
    id: string
    amount: number
    currency: string
    description: string
    date: string
    source: string
    cardLastFour: string | null
    suggestedCat: string | null
    suggestedEnv: string | null
}

interface PendingWalletTransactionsProps {
    envelopes: any[]
    onSuccess: () => void
}

export function PendingWalletTransactions({ envelopes, onSuccess }: PendingWalletTransactionsProps) {
    const [pending, setPending] = useState<PendingTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const { showToast } = useToast()
    const { categories, getCategoryName, getCategoryIcon } = useCategories()

    const [editingId, setEditingId] = useState<string | null>(null)

    const fetchPending = async () => {
        try {
            const res = await authorizedFetch('/api/transactions/pending')
            if (res.ok) {
                const data = await res.json()
                setPending(data.pendingTransactions || [])
            }
        } catch (e) {
            console.error('Error fetching pending tx', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPending()
        // Poll every 10 seconds for new transactions
        const interval = setInterval(fetchPending, 10000)
        return () => clearInterval(interval)
    }, [])

    const handleApprove = async (tx: PendingTransaction) => {
        setProcessingId(tx.id)
        try {
            const res = await authorizedFetch('/api/transactions/pending', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pendingId: tx.id,
                    amount: tx.amount,
                    description: tx.description,
                    date: tx.date,
                    envelopeId: tx.suggestedEnv || null,
                    category: tx.suggestedCat || null
                })
            })

            if (res.ok) {
                showToast('Transakcja zatwierdzona', 'success')
                setPending(p => p.filter(t => t.id !== tx.id))
                onSuccess()
            } else {
                showToast('Błąd zatwierdzania', 'error')
            }
        } catch {
            showToast('Błąd zatwierdzania', 'error')
        } finally {
            setProcessingId(null)
        }
    }

    const handleSaveEdited = async (data: any, txId: string) => {
        setProcessingId(txId)
        try {
            const res = await authorizedFetch('/api/transactions/pending', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pendingId: txId,
                    amount: data.amount,
                    description: data.description,
                    date: data.date,
                    envelopeId: data.envelopeId,
                    category: data.category
                })
            })

            if (res.ok) {
                showToast('Transakcja zatwierdzona', 'success')
                setPending(p => p.filter(t => t.id !== txId))
                setEditingId(null)
                onSuccess()
                return true
            } else {
                showToast('Błąd zatwierdzania', 'error')
                return false
            }
        } catch {
            showToast('Błąd zatwierdzania', 'error')
            return false
        } finally {
            setProcessingId(null)
        }
    }

    const handleReject = async (id: string) => {
        setProcessingId(id)
        try {
            const res = await authorizedFetch(`/api/transactions/pending?id=${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                showToast('Transakcja odrzucona', 'success')
                setPending(p => p.filter(t => t.id !== id))
            } else {
                showToast('Błąd odrzucania', 'error')
            }
        } catch {
            showToast('Błąd odrzucania', 'error')
        } finally {
            setProcessingId(null)
        }
    }

    const startEditing = (tx: PendingTransaction) => {
        setEditingId(tx.id)
    }

    if (loading && pending.length === 0) return null
    if (pending.length === 0) return null

    return (
        <div className="mb-8">
            <h3 className="text-sm font-black text-white tracking-widest uppercase mb-4 flex items-center gap-2">
                <Smartphone size={16} className="text-emerald-400" />
                Oczekujące z Google Wallet
                <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[10px]">
                    {pending.length}
                </span>
            </h3>

            <div className="space-y-3">
                <AnimatePresence>
                    {pending.map((tx) => {
                        const isEditing = editingId === tx.id
                        const isProcessing = processingId === tx.id
                        const dateFormatted = new Date(tx.date).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

                        return (
                            <motion.div
                                key={tx.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-zinc-900/80 border border-emerald-500/30 rounded-2xl p-4 shadow-lg backdrop-blur-xl"
                            >
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-white text-lg">{tx.description}</span>
                                                <span className="text-emerald-400 font-black tabular-nums whitespace-nowrap bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                                                    -{Number(tx.amount).toFixed(2)} {tx.currency}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                                                <span>{dateFormatted}</span>
                                                {tx.cardLastFour && (
                                                    <>
                                                        <span className="text-zinc-600">•</span>
                                                        <span>Karta: •••{tx.cardLastFour}</span>
                                                    </>
                                                )}
                                                {tx.suggestedCat && (
                                                    <>
                                                        <span className="text-zinc-600">•</span>
                                                        <span className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                            <span>Sugestia:</span>
                                                            <span>{getCategoryIcon(tx.suggestedCat)}</span>
                                                            <span>{getCategoryName(tx.suggestedCat)}</span>
                                                        </span>
                                                    </>
                                                )}
                                                {tx.suggestedEnv && envelopes.find(e => e.id === tx.suggestedEnv) && (
                                                    <>
                                                        <span className="text-zinc-600">•</span>
                                                        <span className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                                                            Koperta: {envelopes.find(e => e.id === tx.suggestedEnv)?.name}
                                                        </span>
                                                    </>
                                                )}
                                                {(!tx.suggestedCat || !tx.suggestedEnv) && (
                                                    <>
                                                        <span className="text-zinc-600">•</span>
                                                        <span className="text-rose-400">Brak pełnych sugestii - kliknij edytuj</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <button
                                                onClick={() => startEditing(tx)}
                                                disabled={isProcessing}
                                                className="p-2 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 rounded-xl transition-all"
                                                title="Edytuj"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleReject(tx.id)}
                                                disabled={isProcessing}
                                                className="p-2 text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/30 rounded-xl transition-all"
                                                title="Odrzuć"
                                            >
                                                <X size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleApprove(tx)}
                                                disabled={isProcessing || (!tx.suggestedCat && !tx.suggestedEnv)}
                                                className={`flex-1 sm:flex-none px-4 py-2 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                                                    (!tx.suggestedCat && !tx.suggestedEnv) 
                                                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                                                    : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 active:scale-95'
                                                }`}
                                            >
                                                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                                Szybki akcept
                                            </button>
                                        </div>
                                    </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
            
            {editingId && pending.find(t => t.id === editingId) && (
                <ExpenseModal
                    envelopes={envelopes}
                    initialData={{
                        amount: pending.find(t => t.id === editingId)!.amount.toString(),
                        description: pending.find(t => t.id === editingId)!.description,
                        category: pending.find(t => t.id === editingId)!.suggestedCat || '',
                        envelopeId: pending.find(t => t.id === editingId)!.suggestedEnv || '',
                        date: new Date(pending.find(t => t.id === editingId)!.date).toISOString().split('T')[0]
                    }}
                    onClose={() => setEditingId(null)}
                    onSave={(data) => handleSaveEdited(data, editingId)}
                />
            )}
        </div>
    )
}
