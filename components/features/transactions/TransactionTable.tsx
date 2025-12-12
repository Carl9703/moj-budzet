'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, Edit, Trash2, Check, X, Calculator, ArrowRightLeft, TrendingUp, TrendingDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { api, authorizedFetch } from '@/lib/api/client'
import { useCategories } from '@/lib/contexts/CategoryContext'
import { ConfirmationModal } from '@/components/shared/modals'
import { useToast } from '@/components/ui/feedback/Toast'

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

type SortField = 'date' | 'amount' | 'description' | 'type'
type SortOrder = 'asc' | 'desc'

export function TransactionTable({ transactions, onTransactionDeleted, loading = false }: TransactionTableProps) {
  const { showToast } = useToast()
  const { getCategoryIcon, getCategoryName } = useCategories()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState<string>('')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
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
      return Math.round(result * 100) / 100
    } catch {
      return null
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income': return '💰'
      case 'expense': return '💸'
      case 'transfer': return '🔄'
      default: return '📄'
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const handleEdit = async (transactionId: string, currentAmount: number) => {
    if (editingId === transactionId) {
      const mathResult = calculateMathExpression(editAmount)
      const newAmount = mathResult !== null ? mathResult : parseFloat(editAmount)

      if (isNaN(newAmount) || newAmount < 0) {
        showToast('Nieprawidłowa kwota', 'warning')
        return
      }

      if (newAmount !== currentAmount) {
        try {
          const response = await authorizedFetch(`/api/transactions/${transactionId}`, {
            method: 'PATCH',
            body: JSON.stringify({ amount: newAmount, reason: newAmount < currentAmount ? 'Zwrot częściowy' : 'Korekta' })
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
      setEditingId(transactionId)
      setEditAmount(currentAmount.toString())
    }
  }

  const handleDeleteClick = (transactionId: string, transactionDescription: string) => {
    setDeleteModal({ isOpen: true, transactionId, transactionDescription, loading: false })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal.transactionId) return
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
    } catch {
      showToast('Błąd podczas usuwania', 'error')
      setDeleteModal(prev => ({ ...prev, loading: false }))
    }
  }

  const sortedTransactions = [...transactions].sort((a, b) => {
    let aValue: string | number, bValue: string | number
    switch (sortField) {
      case 'date': aValue = new Date(a.date).getTime(); bValue = new Date(b.date).getTime(); break
      case 'amount': aValue = a.amount; bValue = b.amount; break
      case 'description': aValue = a.description.toLowerCase(); bValue = b.description.toLowerCase(); break
      case 'type': aValue = a.type; bValue = b.type; break
      default: return 0
    }
    return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1)
  })

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-20 glass-card">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm animate-pulse">Ładowanie transakcji...</p>
        </div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-16 glass-card flex flex-col items-center"
      >
        <div className="text-6xl mb-4 opacity-50">📝</div>
        <h3 className="text-xl font-bold text-white mb-2">Brak transakcji</h3>
        <p className="text-slate-400">Nie znaleziono transakcji spełniających kryteria wyszukiwania.</p>
      </motion.div>
    )
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_120px_200px_100px_80px] gap-4 py-4 px-5 bg-slate-900/40 border-b border-[rgba(255,255,255,0.05)] text-xs font-bold text-slate-400 uppercase tracking-wider">
        <div onClick={() => handleSort('description')} className="cursor-pointer flex items-center gap-1 select-none hover:text-indigo-400 transition-colors">
          Opis {sortField === 'description' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
        </div>
        <div onClick={() => handleSort('amount')} className="cursor-pointer flex items-center gap-1 select-none hover:text-indigo-400 transition-colors justify-end pr-2">
          Kwota {sortField === 'amount' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
        </div>
        <div onClick={() => handleSort('date')} className="cursor-pointer flex items-center gap-1 select-none hover:text-indigo-400 transition-colors">
          Data {sortField === 'date' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
        </div>
        <div onClick={() => handleSort('type')} className="cursor-pointer flex items-center gap-1 select-none hover:text-indigo-400 transition-colors">
          Typ {sortField === 'type' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
        </div>
        <div className="text-center">Akcje</div>
      </div>

      {/* Rows */}
      <motion.div
        className="max-h-[600px] overflow-y-auto custom-scrollbar"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence>
          {sortedTransactions.map((transaction) => (
            <motion.div
              key={transaction.id}
              variants={itemVariants}
              exit={{ opacity: 0, height: 0 }}
              className="group border-b border-[rgba(255,255,255,0.02)] transition-colors hover:bg-white/[0.03]"
            >
              {/* Desktop Grid Layout */}
              <div className="hidden md:grid grid-cols-[1fr_120px_200px_100px_80px] gap-4 py-4 px-5 items-center">
                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg opacity-80">{getTypeIcon(transaction.type)}</span>
                    {transaction.category && (
                      <span className="bg-blue-500/10 py-0.5 px-2 rounded-full text-[10px] font-medium text-blue-300 border border-blue-500/20 flex items-center gap-1">
                        {getCategoryIcon(transaction.category)} {getCategoryName(transaction.category)}
                      </span>
                    )}
                    {transaction.envelope && (
                      <span className="bg-emerald-500/10 py-0.5 px-2 rounded-full text-[10px] font-medium text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                        {transaction.envelope.icon} {transaction.envelope.name}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-medium text-slate-200 break-words group-hover:text-white transition-colors">
                    {transaction.description || 'Brak opisu'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">{formatTime(transaction.date)}</div>
                </div>

                {/* Amount */}
                <div className="flex items-center justify-end">
                  {editingId === transaction.id ? (
                    <div className="flex items-center gap-2 relative">
                      <div className="relative">
                        <input
                          type="text"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-24 py-1 px-2 border border-indigo-500 rounded bg-slate-900 text-white text-xs outline-none shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                          autoFocus
                        />
                        <Calculator size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500" />
                      </div>
                      <span className="text-xs text-slate-400 font-medium">zł</span>
                    </div>
                  ) : (
                    <div className={`text-sm font-bold text-right tabular-nums tracking-wide ${transaction.type === 'income' ? 'text-emerald-400' :
                      transaction.type === 'expense' ? 'text-rose-400' : 'text-blue-400'
                      }`}>
                      {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] opacity-70">zł</span>
                    </div>
                  )}
                </div>

                {/* Date */}
                <div className="flex items-center text-sm text-slate-400 group-hover:text-slate-200 transition-colors">
                  {formatDate(transaction.date)}
                </div>

                {/* Type */}
                <div className="flex items-center">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-md ${transaction.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' :
                    transaction.type === 'expense' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                    {transaction.type === 'income' ? 'Przychód' : transaction.type === 'expense' ? 'Wydatek' : 'Transfer'}
                  </span>
                </div>

                {/* Desktop Actions (Hover) */}
                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingId === transaction.id ? (
                    <>
                      <button
                        onClick={() => handleEdit(transaction.id, transaction.amount)}
                        className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 hover:scale-110 active:scale-95 transition-all shadow-lg shadow-emerald-500/30"
                        title="Zapisz"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 hover:text-white active:scale-95 transition-all"
                        title="Anuluj"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(transaction.id, transaction.amount)}
                        className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-slate-700 transition-all"
                        title="Edytuj kwotę"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(transaction.id, transaction.description || 'Brak opisu')}
                        className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-none hover:shadow-lg hover:shadow-rose-500/20"
                        title="Usuń transakcję"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile Card Layout */}
              <div className="md:hidden flex flex-col p-4 gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-xl h-fit ${transaction.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' :
                      transaction.type === 'expense' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                      {transaction.type === 'income' ? <TrendingUp size={20} /> :
                        transaction.type === 'expense' ? <TrendingDown size={20} /> : <ArrowRightLeft size={20} />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200 text-sm mb-1">{transaction.description || 'Brak opisu'}</div>
                      <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
                        <span>{formatDate(transaction.date)}</span>
                        <span>•</span>
                        <span>{formatTime(transaction.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {editingId === transaction.id ? (
                      <div className="flex items-center gap-2 relative">
                        <div className="relative">
                          <input
                            type="text"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-20 py-1 px-1 border border-indigo-500 rounded bg-slate-900 text-white text-xs text-right outline-none"
                            autoFocus
                          />
                        </div>
                      </div>
                    ) : (
                      <div className={`font-bold text-sm ${transaction.type === 'income' ? 'text-emerald-400' :
                        transaction.type === 'expense' ? 'text-rose-400' : 'text-blue-400'
                        }`}>
                        {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1 pt-3 border-t border-white/5">
                  <div className="flex gap-2">
                    {transaction.envelope && (
                      <span className="bg-slate-800 py-1 px-2 rounded-md text-[10px] font-medium text-slate-300 flex items-center gap-1">
                        {transaction.envelope.icon} {transaction.envelope.name}
                      </span>
                    )}
                    {transaction.category && (
                      <span className="bg-slate-800 py-1 px-2 rounded-md text-[10px] font-medium text-slate-300 flex items-center gap-1">
                        {getCategoryIcon(transaction.category)} {getCategoryName(transaction.category)}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {editingId === transaction.id ? (
                      <>
                        <button onClick={() => handleEdit(transaction.id, transaction.amount)} className="text-emerald-400 p-1"><Check size={18} /></button>
                        <button onClick={() => setEditingId(null)} className="text-slate-400 p-1"><X size={18} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(transaction.id, transaction.amount)} className="text-slate-500 hover:text-indigo-400 transition-colors p-1"><Edit size={16} /></button>
                        <button onClick={() => handleDeleteClick(transaction.id, transaction.description || 'Brak opisu')} className="text-slate-500 hover:text-rose-400 transition-colors p-1"><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </div>
              </div>

            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

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
