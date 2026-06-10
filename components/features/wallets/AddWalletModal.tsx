'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Wallet } from 'lucide-react'
import { api } from '@/lib/api/client'

interface AddWalletModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const CURRENCIES = [
  { code: 'EUR', label: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', label: 'Funt brytyjski', flag: '🇬🇧' },
  { code: 'USD', label: 'Dolar amerykański', flag: '🇺🇸' },
  { code: 'CHF', label: 'Frank szwajcarski', flag: '🇨🇭' },
  { code: 'NOK', label: 'Korona norweska', flag: '🇳🇴' },
  { code: 'SEK', label: 'Korona szwedzka', flag: '🇸🇪' },
  { code: 'DKK', label: 'Korona duńska', flag: '🇩🇰' },
  { code: 'CZK', label: 'Korona czeska', flag: '🇨🇿' },
  { code: 'HUF', label: 'Forint węgierski', flag: '🇭🇺' },
]

export function AddWalletModal({ isOpen, onClose, onSuccess }: AddWalletModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('EUR')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await api.post('/api/wallets', { name: name.trim() || `Konto ${currency}`, currency })
      onSuccess()
      onClose()
      setName('')
      setCurrency('EUR')
    } catch (err: any) {
      setError(err.data?.error || err.message || 'Błąd tworzenia portfela')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const selectedCurrency = CURRENCIES.find(c => c.code === currency)

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
          className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[90dvh]"
        >
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Wallet size={16} className="text-amber-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Nowy portfel walutowy</h2>
            </div>
            <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1 rounded-xl hover:bg-white/5">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 flex-1 overflow-y-auto custom-scrollbar">
            {/* Currency selector */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Waluta</label>
              <div className="grid grid-cols-3 gap-2">
                {CURRENCIES.map(c => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCurrency(c.code)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl border font-bold text-sm transition-all ${
                      currency === c.code
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-lg shadow-amber-500/10'
                        : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                    }`}
                  >
                    <span className="text-xl">{c.flag}</span>
                    <span className="text-xs">{c.code}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Nazwa konta</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={`np. Konto ${selectedCurrency?.code || 'EUR'} – Wakacje`}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
              />
              <p className="text-xs text-zinc-600 mt-1.5">Zostaw puste aby użyć nazwy domyślnej</p>
            </div>

            {error && (
              <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-zinc-800 text-zinc-400 font-bold text-sm hover:bg-zinc-700 transition-colors"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                Utwórz portfel
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
