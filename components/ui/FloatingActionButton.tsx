'use client'

import { useState } from 'react'

interface Props {
    onAddIncome: () => void
    onAddExpense: () => void
    onAddBonus?: () => void
    onTransfer?: () => void
    onAnalytics?: () => void
    onHistory?: () => void
    onArchive?: () => void
    onConfig?: () => void
}

export function FloatingActionButton({ onAddIncome, onAddExpense, onAddBonus, onTransfer, onAnalytics, onHistory, onArchive, onConfig }: Props) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
            {/* Menu opcji */}
            {isOpen && (
                <div className="flex flex-col space-y-2 mb-2">
                    <button
                        onClick={() => {
                            onAddIncome()
                            setIsOpen(false)
                        }}
                        className="flex items-center space-x-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 text-sm font-medium"
                    >
                        <span>💵</span>
                        <span>Dodaj przychód</span>
                    </button>
                    
                    <button
                        onClick={() => {
                            onAddExpense()
                            setIsOpen(false)
                        }}
                        className="flex items-center space-x-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 text-sm font-medium"
                    >
                        <span>💸</span>
                        <span>Dodaj wydatek</span>
                    </button>

                    {onAddBonus && (
                        <button
                            onClick={() => {
                                onAddBonus()
                                setIsOpen(false)
                            }}
                            className="hidden-mobile"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 16px',
                                backgroundColor: '#8b5cf6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '25px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                                transition: 'all 0.2s ease',
                                transform: 'translateX(0)',
                                opacity: 1
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateX(-4px)'
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateX(0)'
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)'
                            }}
                        >
                            🎁 Dodaj premię
                        </button>
                    )}

                    {onTransfer && (
                        <button
                            onClick={() => {
                                onTransfer()
                                setIsOpen(false)
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 16px',
                                backgroundColor: '#f59e0b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '25px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                                transition: 'all 0.2s ease',
                                transform: 'translateX(0)',
                                opacity: 1
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateX(-4px)'
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.4)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateX(0)'
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)'
                            }}
                        >
                            💸 Transfer
                        </button>
                    )}
                </div>
            )}

            {/* Główny przycisk */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 ${
                    isOpen 
                        ? 'bg-red-500 hover:bg-red-600 rotate-45' 
                        : 'bg-blue-500 hover:bg-blue-600'
                }`}
            >
                {isOpen ? '✕' : '+'}
            </button>

            {/* Overlay do zamykania */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        zIndex: -1
                    }}
                />
            )}

            <style jsx>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    )
}
