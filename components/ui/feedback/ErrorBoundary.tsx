'use client'

import { Component, ReactNode } from 'react'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6 text-center">
                    <div className="text-6xl mb-6">😵</div>
                    <h1 className="text-2xl font-bold text-slate-100 mb-3">
                        Ups! Coś poszło nie tak
                    </h1>
                    <p className="text-base text-slate-400 mb-6 max-w-md">
                        Aplikacja napotkała nieoczekiwany błąd. Spróbuj odświeżyć stronę.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="py-3 px-6 bg-indigo-600 text-white border-none rounded-lg text-base font-semibold cursor-pointer shadow-lg hover:bg-indigo-700 transition-colors"
                    >
                        🔄 Odśwież stronę
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}
