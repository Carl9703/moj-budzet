'use client'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html lang="pl">
            <body className="bg-slate-950 text-slate-100">
                <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
                    <div className="text-6xl mb-6">🚨</div>
                    <h1 className="text-3xl font-bold mb-4">Krytyczny błąd aplikacji</h1>
                    <p className="text-slate-400 mb-8">
                        Wystąpił błąd uniemożliwiający załadowanie aplikacji.
                    </p>
                    <button
                        onClick={() => reset()}
                        className="py-3 px-6 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors"
                    >
                        Odśwież aplikację
                    </button>
                </div>
            </body>
        </html>
    )
}
