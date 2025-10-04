'use client'

import { useState } from 'react'

interface Props {
    onAddIncome: () => void
    onAddExpense: () => void
    onAddBonus?: () => void
    onAnalytics?: () => void
}

export function FloatingActionButton({ onAddIncome, onAddExpense, onAddBonus, onAnalytics }: Props) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '12px'
        }}>
            {/* Menu opcji */}
            {isOpen && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginBottom: '8px',
                    animation: 'fadeInUp 0.2s ease-out'
                }}>
                    <button
                        onClick={() => {
                            onAddIncome()
                            setIsOpen(false)
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 16px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '25px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                            transition: 'all 0.2s ease',
                            transform: 'translateX(0)',
                            opacity: 1
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateX(-4px)'
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateX(0)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
                        }}
                    >
                        💵 Dodaj przychód
                    </button>
                    
                    <button
                        onClick={() => {
                            onAddExpense()
                            setIsOpen(false)
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 16px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '25px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                            transition: 'all 0.2s ease',
                            transform: 'translateX(0)',
                            opacity: 1
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateX(-4px)'
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateX(0)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)'
                        }}
                    >
                        💸 Dodaj wydatek
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
                </div>
            )}

            {/* Główny przycisk */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '56px',
                    height: '56px',
                    backgroundColor: isOpen ? '#ef4444' : '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    fontSize: '24px',
                    cursor: 'pointer',
                    boxShadow: isOpen 
                        ? '0 6px 16px rgba(239, 68, 68, 0.4)' 
                        : '0 4px 12px rgba(99, 102, 241, 0.3)',
                    transition: 'all 0.3s ease',
                    transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = isOpen ? 'rotate(45deg) scale(1.1)' : 'rotate(0deg) scale(1.1)'
                    e.currentTarget.style.boxShadow = isOpen 
                        ? '0 8px 20px rgba(239, 68, 68, 0.5)' 
                        : '0 6px 16px rgba(99, 102, 241, 0.4)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = isOpen ? 'rotate(45deg) scale(1)' : 'rotate(0deg) scale(1)'
                    e.currentTarget.style.boxShadow = isOpen 
                        ? '0 6px 16px rgba(239, 68, 68, 0.4)' 
                        : '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}
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
