'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Clipboard as ClipboardIcon, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { api } from '@/lib/api/client'

interface ImportPasteModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

interface ParsedInvestment {
    symbol: string
    quantity: number
    averagePurchasePrice: number
    type: 'CRYPTO' | 'STOCK'
}

export function ImportPasteModal({ isOpen, onClose, onSuccess }: ImportPasteModalProps) {
    const [pasteContent, setPasteContent] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [preview, setPreview] = useState<ParsedInvestment[]>([])

    const parseCoinStats = (text: string) => {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
        const results: ParsedInvestment[] = []

        console.log('🔍 Parser Debug - Total lines:', lines.length)

        let i = 0
        while (i < lines.length) {
            const line = lines[i]

            // Look for ticker-like strings (e.g., BTC, ETH, ADA) - must contain at least one letter
            const tickerMatch = line.match(/^([A-Z]{2,10})$/)

            if (tickerMatch) {
                const symbol = tickerMatch[1]
                console.log(`✅ Found ticker: ${symbol} at line ${i}`)
                const stats: number[] = []

                // Collect numbers from next 15 lines
                let j = i + 1
                while (j < Math.min(i + 15, lines.length)) {
                    const nextLine = lines[j]

                    // If we see another Ticker, stop collecting for this one
                    if (nextLine.match(/^([A-Z]{2,10})$/) && j > i + 2) {
                        console.log(`⏹️ Found next ticker, stopping collection`)
                        break
                    }

                    // Extract numbers, ignoring currency symbols, $, zł, %, commas
                    const cleaned = nextLine
                        .replace(/[^\d.,-]/g, '')  // Keep only digits, dots, commas, minus
                        .replace(/,/g, '')          // Remove commas (thousand separators)
                    const val = parseFloat(cleaned)

                    if (!isNaN(val)) {
                        stats.push(val)
                        console.log(`  📊 Line ${j}: ${nextLine} → ${val}`)
                    }
                    j++
                }

                console.log(`📈 Collected ${stats.length} numbers for ${symbol}:`, stats)

                if (stats.length >= 6) {
                    // Pattern from user data:
                    // [0] Quantity (e.g., 0.0273)
                    // [1] 24h change % (e.g., 2.01)
                    // [2] Current price (e.g., 344808.88)
                    // [3] Current value (e.g., 9413.58)
                    // [4] Profit % (e.g., 38.66)
                    // [5] Avg Buy Price (e.g., 138415.38) ← THIS IS WHAT WE NEED
                    // [6] Profit PLN (optional)
                    // [7] Total profit % (optional)

                    const quantity = stats[0]
                    const avgBuy = stats[5]

                    console.log(`🔢 Validation for ${symbol}: qty=${quantity}, avgBuy=${avgBuy}`)

                    // Validation: quantity should be small-ish, avgBuy should be reasonable
                    if (quantity > 0 && quantity < 1000000 && avgBuy > 0.01 && avgBuy < 100000000) {
                        console.log(`✅ Valid entry for ${symbol}`)
                        results.push({
                            symbol,
                            quantity,
                            averagePurchasePrice: avgBuy,
                            type: 'CRYPTO'
                        })
                        i = j - 1
                    } else {
                        console.log(`❌ Validation failed for ${symbol}`)
                    }
                } else {
                    console.log(`⚠️ Not enough data for ${symbol} (need 6, got ${stats.length})`)
                }
            }
            i++
        }

        console.log(`🎯 Parser results:`, results)

        // Fallback: Tab-separated format
        if (results.length === 0) {
            console.log('🔄 Trying tab-separated format...')
            const tabSeparated = text.split('\n').map(l => l.split('\t'))
            tabSeparated.forEach(parts => {
                if (parts.length >= 7) {
                    const symbol = parts[0].trim()
                    const quantity = parseFloat(parts[4]?.replace(/[^\d.,-]/g, '').replace(/,/g, ''))
                    const avgBuy = parseFloat(parts[6]?.replace(/[^\d.,-]/g, '').replace(/,/g, ''))

                    if (symbol && !isNaN(quantity) && !isNaN(avgBuy)) {
                        results.push({
                            symbol,
                            quantity,
                            averagePurchasePrice: avgBuy,
                            type: 'CRYPTO'
                        })
                    }
                }
            })
        }

        return results.filter((v, i, a) => a.findIndex(t => t.symbol === v.symbol) === i)
    }

    const handlePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value
        setPasteContent(text)
        const parsed = parseCoinStats(text)
        setPreview(parsed)
        if (parsed.length > 0) setError(null)
    }

    const handleSubmit = async () => {
        if (preview.length === 0) {
            setError('Nie wykryto żadnych aktywów. Upewnij się, że kopiujesz całą tabelę z CoinStats.')
            return
        }

        setLoading(true)
        setError(null)
        try {
            await api.post('/api/investments/bulk', preview)
            onSuccess()
            onClose()
            setPasteContent('')
            setPreview([])
        } catch (err: any) {
            setError(err.data?.error || err.message || 'Wystąpił błąd podczas importu')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                >
                    <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">📋</span>
                            <h2 className="text-xl font-bold text-white">Importuj Inwestycje</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm"
                            >
                                <AlertCircle size={18} />
                                {error}
                            </motion.div>
                        )}

                        {/* Textarea */}
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Wklej tekst transakcji</label>
                            <textarea
                                value={pasteContent}
                                onChange={(e) => {
                                    setPasteContent(e.target.value);
                                    const parsed = parseCoinStats(e.target.value);
                                    setPreview(parsed);
                                    if (parsed.length > 0) setError(null);
                                }}
                                placeholder="Wklej tutaj listę transakcji z banku lub giełdy..."
                                className="w-full h-64 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white text-sm font-mono placeholder-zinc-700 focus:outline-none focus:border-amber-500 transition-all resize-none"
                            />
                            {preview.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Podgląd importu</h4>
                                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {preview.map((p, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-zinc-800/30 border border-zinc-700/30 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-white">{p.symbol}</span>
                                                    <span className="text-xs text-zinc-500">{p.quantity} j.</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs text-zinc-400">Śr. cena: </span>
                                                    <span className="text-sm font-bold text-zinc-200">{p.averagePurchasePrice.toFixed(2)} PLN</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex gap-3 text-amber-300/80 text-xs">
                                <Info size={16} className="shrink-0 text-amber-400" />
                                <div>
                                    <p className="font-bold text-amber-400 mb-1">Instrukcja:</p>
                                    <ol className="list-decimal list-inside space-y-1 ml-1">
                                        <li>Zaloguj się na CoinStats (Web)</li>
                                        <li>Przejdź do zakładki Portfolio i wybierz tabelę aktywów</li>
                                        <li>Zaznacz wszystkie wiersze myszką i skopiuj (Ctrl+C)</li>
                                        <li>Wklej tutaj i sprawdź podgląd</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl font-bold transition-all active:scale-95"
                            >
                                Anuluj
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || preview.length === 0}
                                className="flex-[2] px-6 py-4 bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-amber-600/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>Importuj {preview.length} aktywów</>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    , document.body)
}
