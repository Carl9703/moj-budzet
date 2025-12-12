'use client'

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Next.js App Error:', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6 text-center">
            <div className="text-6xl mb-6">💥</div>
            <h1 className="text-2xl font-bold text-slate-100 mb-3">
                Wystąpił nieoczekiwany błąd
            </h1>
            <p className="text-base text-slate-400 mb-6 max-w-md">
                Przepraszamy za utrudnienia. Spróbuj odświeżyć stronę lub wrócić później.
            </p>
            <div className="flex gap-4">
                <button
                    onClick={
                        // Attempt to recover by trying to re-render the segment
                        () => reset()
                    }
                    className="py-3 px-6 bg-indigo-600 text-white rounded-lg text-base font-semibold shadow-lg hover:bg-indigo-700 transition-colors"
                >
                    🔄 Spróbuj ponownie
                </button>
            </div>
        </div>
    )
}
