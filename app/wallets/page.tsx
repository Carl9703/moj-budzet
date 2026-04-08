'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Wallet, ArrowUpRight, TrendingDown, ArrowRightLeft, Trash2, Loader2 } from 'lucide-react'
import { api } from '@/lib/api/client'
import { AddWalletModal } from '@/components/features/wallets/AddWalletModal'
import { AddTransactionModal } from '@/components/features/wallets/AddTransactionModal'

interface CurrencyTransaction {
  id: string
  walletId: string
  amount: number
  plnAmount: number | null
  exchangeRate: number | null
  description: string | null
  date: string
  type: 'exchange_in' | 'expense' | 'exchange_out'
}

interface CurrencyWallet {
  id: string
  name: string
  currency: string
  balance: number
  isActive: boolean
  transactions: CurrencyTransaction[]
}

const CURRENCY_FLAGS: Record<string, string> = {
  EUR: '🇪🇺', GBP: '🇬🇧', USD: '🇺🇸', CHF: '🇨🇭',
  NOK: '🇳🇴', SEK: '🇸🇪', DKK: '🇩🇰', CZK: '🇨🇿', HUF: '🇭🇺',
}

const CURRENCY_GRADIENTS: Record<string, string> = {
  EUR: 'from-blue-500/20 via-transparent to-transparent',
  GBP: 'from-rose-500/20 via-transparent to-transparent',
  USD: 'from-emerald-500/20 via-transparent to-transparent',
  CHF: 'from-red-500/20 via-transparent to-transparent',
  NOK: 'from-indigo-500/20 via-transparent to-transparent',
  SEK: 'from-yellow-500/20 via-transparent to-transparent',
  DKK: 'from-purple-500/20 via-transparent to-transparent',
  CZK: 'from-teal-500/20 via-transparent to-transparent',
  HUF: 'from-orange-500/20 via-transparent to-transparent',
}

function txTypeLabel(type: string, currency: string) {
  if (type === 'exchange_in') return `Wymiana PLN → ${currency}`
  if (type === 'exchange_out') return `Wymiana ${currency} → PLN`
  return 'Wydatek'
}

function txIcon(type: string) {
  if (type === 'exchange_in') return <ArrowUpRight size={13} className="text-emerald-400" />
  if (type === 'exchange_out') return <ArrowRightLeft size={13} className="text-blue-400" />
  return <TrendingDown size={13} className="text-rose-400" />
}

function fmt(amount: number, currency: string) {
  return `${amount.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
}

function fmtPln(amount: number) {
  return `${amount.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PLN`
}

export default function WalletsPage() {
  const [addWalletOpen, setAddWalletOpen] = useState(false)
  const [addTxWallet, setAddTxWallet] = useState<CurrencyWallet | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => api.get<{ wallets: CurrencyWallet[] }>('/api/wallets'),
    staleTime: 2 * 60 * 1000,
  })

  const wallets = data?.wallets ?? []

  const handleDeleteWallet = async (id: string) => {
    setDeletingId(id)
    try {
      await api.delete(`/api/wallets/${id}`)
      refetch()
    } catch {
      alert('Nie udało się usunąć portfela')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteTx = async (walletId: string, txId: string) => {
    try {
      await api.delete(`/api/wallets/${walletId}/transactions/${txId}`)
      refetch()
    } catch {
      alert('Nie udało się usunąć transakcji')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">Ładowanie portfeli...</p>
        </div>
      </div>
    )
  }

  // Summary stats
  const totalExpensesPlnAll = wallets.reduce((sum, w) => {
    return sum + w.transactions
      .filter(t => t.type === 'expense' && t.plnAmount)
      .reduce((s, t) => s + (t.plnAmount ?? 0), 0)
  }, 0)

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 md:pb-8">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-0">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 mb-1">
              💱 Portfele Walutowe
            </h1>
            <p className="text-zinc-500 text-sm">Śledź salda w walutach obcych i wydatki wakacyjne</p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setAddWalletOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-amber-600/20 active:scale-95"
          >
            <Plus size={16} />
            Nowy portfel
          </motion.button>
        </div>

        {/* Summary strip */}
        {wallets.length > 0 && totalExpensesPlnAll > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center gap-4"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
              <TrendingDown size={14} className="text-rose-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Łączne wydatki walutowe (PLN)</p>
              <p className="text-xl font-black text-white mt-0.5">{fmtPln(totalExpensesPlnAll)}</p>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {wallets.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-4">
              <Wallet size={24} className="text-zinc-600" />
            </div>
            <h3 className="text-lg font-bold text-zinc-400 mb-2">Brak portfeli walutowych</h3>
            <p className="text-zinc-600 text-sm max-w-xs mb-6">
              Utwórz portfel EUR lub GBP, aby śledzić wymiany i wydatki wakacyjne w walutach obcych.
            </p>
            <button
              onClick={() => setAddWalletOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-amber-600/20"
            >
              <Plus size={16} />
              Utwórz pierwszy portfel
            </button>
          </motion.div>
        )}

        {/* Wallet cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {wallets.map((wallet, i) => {
            const flag = CURRENCY_FLAGS[wallet.currency] ?? '💰'
            const gradient = CURRENCY_GRADIENTS[wallet.currency] ?? 'from-amber-500/20 via-transparent to-transparent'
            const expenses = wallet.transactions.filter(t => t.type === 'expense')
            const totalExpensePln = expenses.reduce((s, t) => s + (t.plnAmount ?? 0), 0)
            const totalExchangedIn = wallet.transactions
              .filter(t => t.type === 'exchange_in')
              .reduce((s, t) => s + Math.abs(t.amount), 0)

            return (
              <motion.div
                key={wallet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden"
              >
                {/* Card top: gradient accent */}
                <div className={`h-1.5 bg-gradient-to-r ${gradient.replace('from-', 'from-').replace('/20', '/60')}`} />

                <div className="p-5">
                  {/* Card header */}
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{flag}</span>
                      <div>
                        <h3 className="font-bold text-white text-base">{wallet.name}</h3>
                        <p className="text-xs text-zinc-500">{wallet.currency}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAddTxWallet(wallet)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold transition-all"
                      >
                        <Plus size={12} />
                        Dodaj
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Usunąć portfel "${wallet.name}"?`)) handleDeleteWallet(wallet.id)
                        }}
                        disabled={deletingId === wallet.id}
                        className="p-1.5 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                      >
                        {deletingId === wallet.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />
                        }
                      </button>
                    </div>
                  </div>

                  {/* Balance + stats */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="col-span-1 p-3 rounded-2xl bg-zinc-800/50 border border-white/5">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Saldo</p>
                      <p className={`text-lg font-black ${wallet.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {wallet.balance.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-zinc-600">{wallet.currency}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-zinc-800/50 border border-white/5">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Wymieniono</p>
                      <p className="text-sm font-bold text-zinc-300">
                        {totalExchangedIn.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-zinc-600">{wallet.currency}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-zinc-800/50 border border-white/5">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Wydano</p>
                      <p className="text-sm font-bold text-rose-400">
                        {totalExpensePln > 0 ? fmtPln(totalExpensePln) : '—'}
                      </p>
                      <p className="text-[10px] text-zinc-600">w PLN</p>
                    </div>
                  </div>

                  {/* Recent transactions */}
                  {wallet.transactions.length > 0 && (
                    <div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Ostatnie transakcje</p>
                      <div className="flex flex-col gap-1">
                        {wallet.transactions.slice(0, 5).map(tx => (
                          <div key={tx.id} className="flex items-center gap-2.5 py-2 px-3 rounded-xl hover:bg-zinc-800/50 transition-colors group">
                            <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                              {txIcon(tx.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-zinc-300 truncate">
                                {tx.description || txTypeLabel(tx.type, wallet.currency)}
                              </p>
                              <p className="text-[10px] text-zinc-600">
                                {new Date(tx.date).toLocaleDateString('pl-PL')}
                                {tx.exchangeRate ? ` · kurs ${tx.exchangeRate.toFixed(4)}` : ''}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`text-xs font-bold ${tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {tx.amount >= 0 ? '+' : ''}{fmt(tx.amount, wallet.currency)}
                              </p>
                              {tx.plnAmount ? (
                                <p className="text-[10px] text-zinc-600">{fmtPln(tx.plnAmount)}</p>
                              ) : null}
                            </div>
                            <button
                              onClick={() => {
                                if (confirm('Usunąć tę transakcję?')) handleDeleteTx(wallet.id, tx.id)
                              }}
                              className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose-400 transition-all ml-1"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {wallet.transactions.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-zinc-600 text-xs">Brak transakcji. Dodaj wymianę lub wydatek.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      <AddWalletModal
        isOpen={addWalletOpen}
        onClose={() => setAddWalletOpen(false)}
        onSuccess={() => refetch()}
      />
      <AddTransactionModal
        isOpen={!!addTxWallet}
        onClose={() => setAddTxWallet(null)}
        onSuccess={() => refetch()}
        wallet={addTxWallet}
      />
    </div>
  )
}
