'use client'

import { useState, useEffect } from 'react'
import { Calendar, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Modal } from '@/components/ui/layout/Modal'
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner'
import { useCategories } from '@/lib/contexts/CategoryContext'

interface Transaction {
  id: string
  amount: number
  description: string
  date: string
  type: 'income' | 'expense'
  category?: string
}

interface EnvelopeTransactionsModalProps {
  isOpen: boolean
  onClose: () => void
  envelopeId: string
  envelopeName: string
  envelopeIcon: string
}

export function EnvelopeTransactionsModal({
  isOpen,
  onClose,
  envelopeId,
  envelopeName,
  envelopeIcon
}: EnvelopeTransactionsModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { getCategoryName, getCategoryIcon } = useCategories()

  useEffect(() => {
    if (isOpen && envelopeId) {
      fetchTransactions()
    }
  }, [isOpen, envelopeId])

  const fetchTransactions = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await api.get<any>(`/api/transactions?envelopeId=${envelopeId}&limit=20&currentMonth=true`)
      const transactionsArray = Array.isArray(data) ? data : (data.transactions || [])
      setTransactions(transactionsArray)
    } catch (err) {
      setError('Błąd połączenia z serwerem')
    } finally {
      setLoading(false)
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <Modal title={`${envelopeIcon} ${envelopeName}`} onClose={onClose}>
      <div className="flex flex-col h-[60vh]">
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <LoadingSpinner />
              <div className="text-sm text-slate-500 font-medium animate-pulse">
                Pobieranie historii...
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-3xl">❌</div>
              <div className="text-slate-400 max-w-xs mx-auto">
                {error}
              </div>
              <button
                onClick={fetchTransactions}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm text-slate-300 transition-colors"
              >
                Spróbuj ponownie
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center opacity-60">
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-4xl grayscale">📝</div>
              <p className="text-slate-500">Brak transakcji w tym miesiącu</p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {transactions.map((transaction, index) => (
                <div
                  key={transaction.id}
                  className="group relative p-4 rounded-xl border transition-all duration-300 hover:scale-[1.01]"
                  style={{
                    background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    borderColor: 'rgba(51, 65, 85, 0.5)'
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${transaction.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                          {transaction.type === 'income' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        </span>
                        <h4 className="font-semibold text-slate-200 truncate group-hover:text-indigo-300 transition-colors">
                          {transaction.description || 'Bez opisu'}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 ml-8">
                        <span className="flex items-center gap-1 bg-slate-800/50 px-2 py-0.5 rounded-xl">
                          <Calendar size={10} />
                          {formatDate(transaction.date)}
                        </span>
                        {transaction.category && (
                          <span className="flex items-center gap-1 bg-slate-800/50 px-2 py-0.5 rounded-xl text-slate-400">
                            {getCategoryIcon(transaction.category)} {getCategoryName(transaction.category)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={`text-right ${transaction.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                      <div className="text-lg font-bold tabular-nums tracking-tight">
                        {transaction.type === 'income' ? '+' : '-'}{formatMoney(transaction.amount)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-800/50 flex justify-between items-center text-xs text-slate-500 mt-2">
          <span>Wyświetlono {transactions.length} ostatnich transakcji</span>
          <button
            onClick={onClose}
            className="hover:text-slate-300 transition-colors"
          >
            Zamknij ESC
          </button>
        </div>
      </div>
    </Modal>
  )
}
