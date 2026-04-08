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
              <LoadingSpinner size="large" text="Pobieranie historii..." />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
              <div className="w-20 h-20 rounded-[2rem] bg-rose-500/10 flex items-center justify-center text-4xl shadow-inner text-rose-500">✕</div>
              <div>
                <h3 className="text-white font-bold mb-1">Coś poszło nie tak</h3>
                <p className="text-sm text-zinc-500 mb-6">{error}</p>
                <button
                  onClick={fetchTransactions}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-xs font-black uppercase tracking-widest text-white transition-all active:scale-95"
                >
                  Spróbuj ponownie
                </button>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
              <div className="w-20 h-20 rounded-[2rem] bg-zinc-900/50 flex items-center justify-center text-4xl shadow-inner opacity-50 border border-white/5">📋</div>
              <div>
                <h3 className="text-white font-bold mb-1">Brak transakcji</h3>
                <p className="text-sm text-zinc-500">W tym miesiącu nie odnotowano jeszcze żadnych operacji w tej kopercie.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="group relative p-4 rounded-3xl border border-white/5 bg-zinc-900/40 hover:bg-zinc-800/60 transition-all duration-300"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner flex-shrink-0 ${transaction.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                        {transaction.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-white truncate group-hover:text-amber-300 transition-colors tracking-tight">
                          {transaction.description || 'Bez opisu'}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                            {formatDate(transaction.date)}
                          </span>
                          {transaction.category && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-zinc-700" />
                              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                                {getCategoryIcon(transaction.category)} {getCategoryName(transaction.category)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={`text-right flex-shrink-0 ${transaction.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      <div className="text-lg font-black tabular-nums tracking-tighter">
                        {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}
                        <span className="text-xs ml-1 opacity-50">zł</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-zinc-800/50 flex justify-between items-center text-xs text-zinc-500 mt-2">
          <span>Wyświetlono {transactions.length} ostatnich transakcji</span>
          <button
            onClick={onClose}
            className="hover:text-zinc-300 transition-colors"
          >
            Zamknij ESC
          </button>
        </div>
      </div>
    </Modal>
  )
}
