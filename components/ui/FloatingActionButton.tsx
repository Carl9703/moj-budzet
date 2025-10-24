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
        <div className="floating-button" style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 50,
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
                    marginBottom: '8px'
                }}>
                    <button
                        onClick={() => {
                            onAddIncome()
                            setIsOpen(false)
                        }}
                        className="btn-mobile"
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
                            minHeight: '44px',
                            minWidth: '44px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#059669'
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#10b981'
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
                        }}
                    >
                        <span>💵</span>
                        <span>Dodaj przychód</span>
                    </button>
                    
                    <button
                        onClick={() => {
                            onAddExpense()
                            setIsOpen(false)
                        }}
                        className="btn-mobile"
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
                            minHeight: '44px',
                            minWidth: '44px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#dc2626'
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ef4444'
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)'
                        }}
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
                className="btn-mobile"
                style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    boxShadow: 'var(--shadow-lg)',
                    transition: 'all 0.3s ease',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: isOpen ? '#ef4444' : '#3b82f6',
                    minWidth: '56px',
                    minHeight: '56px',
                    transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isOpen ? '#dc2626' : '#2563eb'
                    e.currentTarget.style.transform = isOpen ? 'rotate(45deg) scale(1.1)' : 'rotate(0deg) scale(1.1)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-xl)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isOpen ? '#ef4444' : '#3b82f6'
                    e.currentTarget.style.transform = isOpen ? 'rotate(45deg)' : 'rotate(0deg)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
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
