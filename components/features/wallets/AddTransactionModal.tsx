'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, ArrowRightLeft, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { api } from '@/lib/api/client'

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

interface Envelope {
  id: string
  name: string
  icon: string
  type: string
}

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  wallet: CurrencyWallet | null
}

type TxType = 'exchange_in' | 'exchange_out'

export function AddTransactionModal({ isOpen, onClose, onSuccess, wallet }: AddTransactionModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txType, setTxType] = useState<TxType>('exchange_in')
  const [currencyAmount, setCurrencyAmount] = useState('')
  const [plnAmount, setPlnAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [envelopes, setEnvelopes] = useState<Envelope[]>([])
  const [selectedEnvelopeId, setSelectedEnvelopeId] = useState('')
  const [loadingEnvelopes, setLoadingEnvelopes] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unused = { envelopes, selectedEnvelopeId, loadingEnvelopes }

  const parsedCurrency = parseFloat(currencyAmount.replace(',', '.'))
  const parsedPln = parseFloat(plnAmount.replace(',', '.'))
  const calculatedRate = parsedCurrency > 0 && parsedPln > 0
    ? (parsedPln / parsedCurrency).toFixed(4)
    : null

  useEffect(() => {
    if (!isOpen) return
    setLoadingEnvelopes(true)
    api.get<{ envelopes: Envelope[] }>('/api/envelopes')
      .then(data => setEnvelopes(data?.envelopes ?? []))
      .catch(() => {})
      .finally(() => setLoadingEnvelopes(false))
  }, [isOpen])

  const handleReset = () => {
    setCurrencyAmount('')
    setPlnAmount('')
    setDescription('')
    setDate(new Date().toISOString().split('T')[0])
    setTxType('exchange_in')
    setSelectedEnvelopeId('')
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wallet) return

    if (!parsedCurrency || parsedCurrency <= 0) {
      setError(`Podaj kwotę w ${wallet.currency}`)
      return
    }
    if (!parsedPln || parsedPln <= 0) {
      setError('Podaj kwotę PLN')
      return
    }
    if (!selectedEnvelopeId) {
      setError('Wybierz kopertę PLN')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await api.post(`/api/wallets/${wallet.id}/transactions`, {
        type: txType,
        amount: parsedCurrency,
        plnAmount: parsedPln,
        exchangeRate: calculatedRate ? parseFloat(calculatedRate) : undefined,
        description: description.trim() || undefined,
        date,
        envelopeId: selectedEnvelopeId,
      })
      onSuccess()
      onClose()
      handleReset()
    } catch (err: any) {
      setError(err.data?.error || err.message || 'Błąd dodawania transakcji')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !wallet) return null

  const currency = wallet.currency
  const selectedEnvelope = envelopes.find(e => e.id === selectedEnvelopeId)

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
          className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
        >
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-white">Wymiana waluty</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {wallet.name} · saldo:{' '}
                <span className="text-zinc-300 font-bold">
                  {wallet.balance.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                </span>
              </p>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1 rounded-xl hover:bg-white/5">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
            {/* Direction */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTxType('exchange_in')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border font-bold text-sm transition-all ${
                  txType === 'exchange_in'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                    : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                <ArrowUpRight size={15} />
                PLN → {currency}
              </button>
              <button
                type="button"
                onClick={() => setTxType('exchange_out')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border font-bold text-sm transition-all ${
                  txType === 'exchange_out'
                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                    : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                <ArrowDownLeft size={15} />
                {currency} → PLN
              </button>
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                  Kwota {currency}
                </label>
                <input
                  type="number" step="0.01" min="0"
                  value={currencyAmount}
                  onChange={e => setCurrencyAmount(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                  Kwota PLN
                </label>
                <input
                  type="number" step="0.01" min="0"
                  value={plnAmount}
                  onChange={e => setPlnAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors text-sm font-mono"
                />
              </div>
            </div>

            {calculatedRate && (
              <p className="text-xs text-zinc-500 -mt-3">
                Kurs: <span className="text-zinc-300 font-bold font-mono">{calculatedRate} PLN/{currency}</span>
              </p>
            )}

            {/* Envelope */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                {txType === 'exchange_in' ? `Pobierz PLN z koperty` : `Zwróć PLN do koperty`}
              </label>
              {loadingEnvelopes ? (
                <div className="flex items-center gap-2 text-zinc-500 text-sm py-2">
                  <Loader2 size={14} className="animate-spin" /> Ładowanie...
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-1">
                  {envelopes.map(env => (
                    <button
                      key={env.id} type="button"
                      onClick={() => setSelectedEnvelopeId(env.id)}
                      className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-2xl border text-xs font-bold transition-all ${
                        selectedEnvelopeId === env.id
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                          : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <span className="text-lg">{env.icon}</span>
                      <span className="text-[10px] text-center leading-tight">{env.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedEnvelope && (
                <p className="text-xs text-zinc-500 mt-1.5">
                  Wybrano: <span className="text-zinc-300">{selectedEnvelope.icon} {selectedEnvelope.name}</span>
                </p>
              )}
            </div>

            {/* Description + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Opis</label>
                <input
                  type="text" value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="np. Kantor"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Data</label>
                <input
                  type="date" value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
                />
              </div>
            </div>

            {error && (
              <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-zinc-800 text-zinc-400 font-bold text-sm hover:bg-zinc-700 transition-colors">
                Anuluj
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRightLeft size={14} />}
                {parsedPln > 0 ? `Zapisz (${parsedPln.toFixed(2)} PLN)` : 'Zapisz'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
