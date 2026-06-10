'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export function RouteError({
    error,
    reset,
    title = 'Wystąpił nieoczekiwany błąd'
}: {
    error: Error & { digest?: string }
    reset: () => void
    title?: string
}) {
    const router = useRouter()

    useEffect(() => {
        // Obowiązkowe zalogowanie awarii (np. Sentry jeżeli dodane)
        console.error('Captured by RouteErrorBoundary:', error)
    }, [error])

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center"
        >
            <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-12 h-12 text-rose-500" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
            <p className="text-zinc-400 max-w-md mb-8">
                Przepraszamy, ale coś poszło nie tak podczas ładowania tej części aplikacji. Zespół techniczny został powiadomiony (w teorii!).
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={() => reset()}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-amber-500/20 group"
                >
                    <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                    Spróbuj ponownie
                </button>
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium transition-all"
                >
                    <Home className="w-4 h-4" />
                    Wróć na Pulpit
                </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
                <div className="mt-12 p-4 bg-black/50 border border-rose-500/20 rounded-xl text-left max-w-2xl w-full overflow-auto">
                    <p className="text-xs font-mono text-rose-400 mb-2">Szczegóły dla developera:</p>
                    <pre className="text-xs text-zinc-500 font-mono whitespace-pre-wrap">
                        {error.message}
                        {'\n'}{error.stack}
                    </pre>
                </div>
            )}
        </motion.div>
    )
}
