'use client'

import { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
}

export class SectionErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('SectionErrorBoundary caught an error:', error, errorInfo)
    }

    handleRetry = () => {
        this.setState({ hasError: false })
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback

            return (
                <div className="p-6 border border-rose-500/30 bg-rose-500/10 rounded-xl text-center">
                    <AlertTriangle className="mx-auto h-8 w-8 text-rose-500 mb-2" />
                    <h3 className="text-sm font-semibold text-rose-400 mb-1">Błąd ładowania sekcji</h3>
                    <p className="text-xs text-slate-400 mb-3">Wystąpił problem z wyświetleniem tej zawartości.</p>
                    <button
                        onClick={this.handleRetry}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors border border-slate-700"
                    >
                        <RefreshCw size={12} /> Spróbuj ponownie
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}
