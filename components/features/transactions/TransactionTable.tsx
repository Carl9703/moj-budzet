'use client'

import { useState, useMemo } from 'react'
import { Edit, Trash2, Check, X, Calculator, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { authorizedFetch } from '@/lib/api/client'
import { useCategories } from '@/lib/contexts/CategoryContext'
import { ConfirmationModal } from '@/components/shared/modals'
import { useToast } from '@/components/ui/feedback/Toast'
import { Envelope } from '@prisma/client'
import { roundToCents } from '@/lib/utils/money'
import { handleCalculatorInput } from '@/lib/utils/input'
import { ListSkeleton } from '@/components/ui/SkeletonLoader'

interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  date: string
  category?: string
  envelope?: {
    name: string
    icon: string
  }
}

interface TransactionTableProps {
  transactions: Transaction[]
  onTransactionDeleted?: () => void
  loading?: boolean
}

interface GroupedTransactions {
  [key: string]: Transaction[]
}

export function TransactionTable({ transactions, onTransactionDeleted, loading = false }: TransactionTableProps) {
  const { showToast } = useToast()
  const { getCategoryIcon, getCategoryName } = useCategories()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState<string>('')
  const [editDescription, setEditDescription] = useState<string>('')
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    transactionId: string | null
    transactionDescription: string
    loading: boolean
  }>({
    isOpen: false,
    transactionId: null,
    transactionDescription: '',
    loading: false
  })

  const calculateMathExpression = (expression: string): number | null => {
    try {
      const cleanExpression = expression.replace(/\s/g, '')
      if (!/^[0-9+\-*/.()]+$/.test(cleanExpression)) return null
      if (cleanExpression.includes('..') || cleanExpression.includes('++') ||
        cleanExpression.includes('--') || cleanExpression.includes('**') ||
        cleanExpression.includes('//')) return null
      const result = Function(`"use strict"; return (${cleanExpression})`)()
      if (typeof result !== 'number' || !isFinite(result)) return null
      return roundToCents(result)
    } catch {
      return null
    }
  }

  // Format date header (e.g., "Dzisiaj", "Wczoraj", "Poniedziałek, 20 Stycznia")
  const formatDateHeader = (dateString: string): string => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const isToday = date.toDateString() === today.toDateString()
    const isYesterday = date.toDateString() === yesterday.toDateString()

    if (isToday) return 'Dzisiaj'
    if (isYesterday) return 'Wczoraj'

    const dayName = date.toLocaleDateString('pl-PL', { weekday: 'long' })
    const dayNumber = date.getDate()

    // Polish months in genitive case (dopełniacz)
    const monthsGenitive = [
      'Stycznia', 'Lutego', 'Marca', 'Kwietnia', 'Maja', 'Czerwca',
      'Lipca', 'Sierpnia', 'Września', 'Października', 'Listopada', 'Grudnia'
    ]
    const monthName = monthsGenitive[date.getMonth()]

    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${dayNumber} ${monthName}`
  }

  // Get date key for grouping
  const getDateKey = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
  }

  // Capitalize first letter of each word, but keep Polish prepositions lowercase
  const capitalizeTitle = (text: string): string => {
    if (!text) return text
    const lowercaseWords = new Set(['w', 'i', 'z', 'na', 'do', 'od', 'za', 'po', 'nad', 'pod', 'się', 'jak', 'że', 'dla', 'o', 'u', 'x', '×'])
    return text
      .split(' ')
      .map((word, idx) => {
        const lower = word.toLowerCase()
        if (idx > 0 && lowercaseWords.has(lower)) return lower
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      })
      .join(' ')
  }

  // Get smart title (use category name if no description)
  const getSmartTitle = (transaction: Transaction): string => {
    if (transaction.description && transaction.description.trim() !== '') {
      return capitalizeTitle(transaction.description)
    }
    if (transaction.category) {
      return getCategoryName(transaction.category)
    }
    if (transaction.envelope?.name) {
      return transaction.envelope.name
    }
    if (transaction.type === 'income') return 'Przychód'
    if (transaction.type === 'expense') return 'Wydatek'
    return 'Transfer'
  }

  // Get subtitle (only category - no redundant envelope name)
  const getSubtitle = (transaction: Transaction): string => {
    // Only show category if available - envelope name is often redundant
    if (transaction.category) {
      return getCategoryName(transaction.category)
    }
    return ''
  }

  // Get icon for transaction
  const getTransactionIcon = (transaction: Transaction): string => {
    if (transaction.envelope?.icon) return transaction.envelope.icon
    if (transaction.category) return getCategoryIcon(transaction.category)
    if (transaction.type === 'income') return '💰'
    if (transaction.type === 'expense') return '💸'
    return '🔄'
  }

  const handleEdit = async (transaction: Transaction) => {
    if (editingId === transaction.id) {
      const mathResult = calculateMathExpression(editAmount)
      const newAmount = mathResult !== null ? mathResult : parseFloat(editAmount)

      if (isNaN(newAmount) || newAmount < 0) {
        showToast('Nieprawidłowa kwota', 'warning')
        return
      }

      const isAmountChanged = newAmount !== transaction.amount
      const isDescriptionChanged = editDescription !== transaction.description

      if (isAmountChanged || isDescriptionChanged) {
        try {
          const response = await authorizedFetch(`/api/transactions/${transaction.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              amount: newAmount,
              description: editDescription,
              reason: isAmountChanged ? (newAmount < transaction.amount ? 'Zwrot częściowy' : 'Korekta') : 'Zmiana opisu'
            })
          })
          if (response.ok) {
            showToast('Transakcja zaktualizowana!', 'success')
            onTransactionDeleted ? onTransactionDeleted() : window.location.reload()
          } else {
            showToast('Błąd podczas edycji', 'error')
          }
        } catch {
          showToast('Błąd podczas edycji', 'error')
        }
      }
      setEditingId(null)
    } else {
      setEditingId(transaction.id)
      setEditAmount(transaction.amount.toString())
      setEditDescription(transaction.description || '')
    }
  }

  const handleDeleteClick = (transactionId: string, transactionDescription: string) => {
    setDeleteModal({ isOpen: true, transactionId, transactionDescription, loading: false })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal.transactionId) {
      return
    }

    setDeleteModal(prev => ({ ...prev, loading: true }))

    try {
      const response = await authorizedFetch(`/api/transactions/${deleteModal.transactionId}`, { method: 'DELETE' })

      if (response.ok) {
        setDeleteModal({ isOpen: false, transactionId: null, transactionDescription: '', loading: false })
        onTransactionDeleted ? onTransactionDeleted() : window.location.reload()
      } else {
        showToast('Błąd podczas usuwania', 'error')
        setDeleteModal(prev => ({ ...prev, loading: false }))
      }
    } catch (error) {
      showToast('Błąd podczas usuwania', 'error')
      setDeleteModal(prev => ({ ...prev, loading: false }))
    }
  }

  // Sort transactions by date (newest first)
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions])

  // Group transactions by date
  const groupedTransactions = useMemo((): GroupedTransactions => {
    return sortedTransactions.reduce((groups: GroupedTransactions, transaction) => {
      const dateKey = getDateKey(transaction.date)
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(transaction)
      return groups
    }, {})
  }, [sortedTransactions])

  // Get ordered date keys
  const dateKeys = useMemo(() => {
    return Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  }, [groupedTransactions])

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-xl transition-all duration-500 overflow-hidden relative min-h-[200px]">
      {loading ? (
        <ListSkeleton count={5} />
      ) : transactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-16 flex flex-col items-center"
        >
          <div className="text-6xl mb-4 opacity-50">📝</div>
          <h3 className="text-xl font-black text-white mb-2 tracking-tight">Brak transakcji</h3>
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Nie znaleziono transakcji spełniających kryteria wyszukiwania.</p>
        </motion.div>
      ) : (
        <motion.div
          className="divide-y divide-white/[0.02]"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence>
            {dateKeys.map((dateKey) => (
              <div key={dateKey}>
                {/* Sticky Date Header */}
                <motion.div
                  variants={itemVariants}
                  className="sticky top-0 z-10 px-5 py-3 bg-zinc-950/90 backdrop-blur-md border-b border-white/5"
                >
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                    {formatDateHeader(dateKey)}
                  </span>
                </motion.div>

                {/* Transactions for this date */}
                {groupedTransactions[dateKey].map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    variants={itemVariants}
                    exit={{ opacity: 0, height: 0 }}
                    className="group transition-colors hover:bg-white/[0.02]"
                  >
                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-center gap-4 py-4 px-5">
                      {/* Icon */}
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${transaction.type === 'income' ? 'bg-emerald-500/10' :
                        transaction.type === 'expense' ? 'bg-rose-500/10' : 'bg-blue-500/10'
                        }`}>
                        <span className="text-[22px] leading-none">{getTransactionIcon(transaction)}</span>
                      </div>

                      {/* Title & Subtitle */}
                      <div className="flex-1 min-w-0">
                        {editingId === transaction.id ? (
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full py-2 px-3 border border-amber-500/50 rounded-xl bg-zinc-900 text-white text-sm outline-none shadow-[0_0_15px_rgba(99,102,241,0.2)] focus:border-amber-500 transition-all font-bold"
                            placeholder="Opis transakcji..."
                            autoFocus
                          />
                        ) : (
                          <>
                            <div className="text-[15px] font-bold text-white truncate group-hover:text-white transition-colors">
                              {getSmartTitle(transaction)}
                            </div>
                            {getSubtitle(transaction) && (
                              <div className="text-xs text-zinc-500 mt-0.5 truncate">
                                {getSubtitle(transaction)} • {formatTime(transaction.date)}
                              </div>
                            )}
                            {!getSubtitle(transaction) && (
                              <div className="text-xs text-zinc-500 mt-0.5">
                                {formatTime(transaction.date)}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Amount */}
                      <div className="flex items-center justify-end shrink-0 min-w-[140px]">
                        {editingId === transaction.id ? (
                          <div className="flex items-center gap-2 relative">
                            <div className="relative">
                              <input
                                type="text"
                                value={editAmount}
                                onChange={(e) => handleCalculatorInput(e.target.value, setEditAmount)}
                                className="w-24 py-1.5 px-3 border border-amber-500/50 rounded-xl bg-zinc-900 text-white text-xs text-right outline-none shadow-[0_0_15px_rgba(99,102,241,0.2)] focus:border-amber-500 transition-all font-black"
                                autoFocus
                              />
                              <Calculator size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-500" />
                            </div>
                            <span className="text-xs text-zinc-400 font-medium">zł</span>
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className={`text-[17px] font-black tabular-nums tracking-tight ${transaction.type === 'income' ? 'text-emerald-400' :
                              transaction.type === 'expense' ? 'text-rose-400' : 'text-blue-400'
                              }`}>
                              {transaction.type === 'income' ? '+' : '-'}
                              {transaction.amount.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-xs text-zinc-500 ml-1">zł</span>
                          </div>
                        )}
                      </div>

                      {/* Actions (on hover) */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {editingId === transaction.id ? (
                          <>
                            <button
                              onClick={() => handleEdit(transaction)}
                              className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 hover:scale-110 active:scale-95 transition-all shadow-lg shadow-emerald-500/30"
                              title="Zapisz"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 hover:text-white active:scale-95 transition-all"
                              title="Anuluj"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(transaction)}
                              className="p-1.5 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-400 hover:text-amber-400 hover:border-amber-500/50 hover:bg-zinc-700 transition-all"
                              title="Edytuj transakcję"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(transaction.id, getSmartTitle(transaction))}
                              className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all"
                              title="Usuń transakcję"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Mobile Layout */}
                    <div className="md:hidden flex items-start gap-3 p-4">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${transaction.type === 'income' ? 'bg-emerald-500/10' :
                        transaction.type === 'expense' ? 'bg-rose-500/10' : 'bg-blue-500/10'
                        }`}>
                        <span className="text-[20px] leading-none">{getTransactionIcon(transaction)}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            {editingId === transaction.id ? (
                              <input
                                type="text"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="w-full py-1 px-2 border border-amber-500 rounded bg-zinc-900 text-white text-xs outline-none"
                              />
                            ) : (
                              <div className="font-bold text-white text-[14px] truncate">
                                {getSmartTitle(transaction)}
                              </div>
                            )}
                            <div className="text-xs text-zinc-500 mt-0.5 truncate">
                              {getSubtitle(transaction) ? `${getSubtitle(transaction)} • ` : ''}{formatTime(transaction.date)}
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="text-right shrink-0">
                            {editingId === transaction.id ? (
                              <input
                                type="text"
                                value={editAmount}
                                onChange={(e) => handleCalculatorInput(e.target.value, setEditAmount)}
                                className="w-20 py-1 px-1 border border-amber-500 rounded bg-zinc-900 text-white text-xs text-right outline-none"
                                autoFocus
                              />
                            ) : (
                              <>
                                <span className={`text-[15px] font-black tabular-nums ${transaction.type === 'income' ? 'text-emerald-400' :
                                  transaction.type === 'expense' ? 'text-rose-400' : 'text-blue-400'
                                  }`}>
                                  {transaction.type === 'income' ? '+' : '-'}
                                  {transaction.amount.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-xs text-zinc-500 ml-0.5">zł</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Mobile Actions */}
                        <div className="flex justify-end gap-3 mt-2 pt-1">
                          {editingId === transaction.id ? (
                            <>
                              <button onClick={() => handleEdit(transaction)} className="text-emerald-400 p-1"><Check size={18} /></button>
                              <button onClick={() => setEditingId(null)} className="text-zinc-400 p-1"><X size={18} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleEdit(transaction)} className="text-zinc-500 hover:text-amber-400 transition-colors p-1"><Edit size={16} /></button>
                              <button onClick={() => handleDeleteClick(transaction.id, getSmartTitle(transaction))} className="text-zinc-500 hover:text-rose-400 transition-colors p-1"><Trash2 size={16} /></button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, transactionId: null, transactionDescription: '', loading: false })}
        onConfirm={handleDeleteConfirm}
        title="Usuń transakcję"
        description={`Czy na pewno chcesz usunąć transakcję "${deleteModal.transactionDescription}"?`}
        confirmText="Usuń"
        cancelText="Anuluj"
        variant="danger"
        isLoading={deleteModal.loading}
      />
    </div>
  )
}
