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

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('ErrorBoundary caught:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    backgroundColor: 'var(--bg-primary)',
                    padding: '24px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: '64px',
                        marginBottom: '24px'
                    }}>
                        😵
                    </div>
                    <h1 style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: 'var(--text-primary)',
                        marginBottom: '12px'
                    }}>
                        Ups! Coś poszło nie tak
                    </h1>
                    <p style={{
                        fontSize: '16px',
                        color: 'var(--text-secondary)',
                        marginBottom: '24px',
                        maxWidth: '500px'
                    }}>
                        Aplikacja napotkała nieoczekiwany błąd. Spróbuj odświeżyć stronę.
                    </p>
                    {this.state.error && (
                        <details style={{
                            marginBottom: '24px',
                            padding: '16px',
                            backgroundColor: 'var(--bg-error)',
                            borderRadius: '8px',
                            border: '1px solid var(--error-border)',
                            maxWidth: '600px',
                            textAlign: 'left'
                        }}>
                            <summary style={{
                                cursor: 'pointer',
                                fontWeight: '600',
                                color: 'var(--error-primary)',
                                marginBottom: '8px'
                            }}>
                                Szczegóły błędu (dla dewelopera)
                            </summary>
                            <pre style={{
                                fontSize: '12px',
                                overflow: 'auto',
                                color: 'var(--text-secondary)'
                            }}>
                                {this.state.error.message}
                            </pre>
                        </details>
                    )}
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: 'var(--accent-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-md)'
                        }}
                    >
                        🔄 Odśwież stronę
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

