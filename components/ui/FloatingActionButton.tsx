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

export function FloatingActionButton({ onAddIncome, onAddExpense, onAddBonus, onTransfer }: Props) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {/* Menu opcji */}
            {isOpen && (
                <div className="flex flex-col gap-2 mb-2">
                    <button
                        onClick={() => {
                            onAddIncome()
                            setIsOpen(false)
                        }}
                        aria-label="Dodaj przychód"
                        className="flex items-center gap-2 py-3 px-4 bg-emerald-500 text-white border-none rounded-full text-sm font-medium cursor-pointer shadow-lg hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-xl transition-all min-h-[44px] min-w-[44px] focus:outline-2 focus:outline-emerald-500 focus:outline-offset-2"
                    >
                        <span aria-hidden="true">💵</span>
                        <span>Dodaj przychód</span>
                    </button>

                    <button
                        onClick={() => {
                            onAddExpense()
                            setIsOpen(false)
                        }}
                        aria-label="Dodaj wydatek"
                        className="flex items-center gap-2 py-3 px-4 bg-red-500 text-white border-none rounded-full text-sm font-medium cursor-pointer shadow-lg hover:bg-red-600 hover:-translate-y-0.5 hover:shadow-xl transition-all min-h-[44px] min-w-[44px] focus:outline-2 focus:outline-red-500 focus:outline-offset-2"
                    >
                        <span aria-hidden="true">💸</span>
                        <span>Dodaj wydatek</span>
                    </button>

                    {onAddBonus && (
                        <button
                            onClick={() => {
                                onAddBonus()
                                setIsOpen(false)
                            }}
                            className="hidden md:flex items-center gap-2 py-3 px-4 bg-violet-500 text-white border-none rounded-full text-sm font-medium cursor-pointer shadow-lg hover:bg-violet-600 hover:-translate-x-1 hover:shadow-xl transition-all"
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
                            className="flex items-center gap-2 py-3 px-4 bg-amber-500 text-white border-none rounded-full text-sm font-medium cursor-pointer shadow-lg hover:bg-amber-600 hover:-translate-x-1 hover:shadow-xl transition-all"
                        >
                            💸 Transfer
                        </button>
                    )}
                </div>
            )}

            {/* Główny przycisk */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Zamknij menu akcji' : 'Otwórz menu akcji'}
                aria-expanded={isOpen}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg border-none cursor-pointer transition-all duration-300 min-w-[56px] min-h-[56px] hover:scale-110 hover:shadow-xl focus:outline-2 focus:outline-blue-500 focus:outline-offset-2 ${isOpen
                        ? 'bg-red-500 hover:bg-red-600 rotate-45'
                        : 'bg-blue-500 hover:bg-blue-600 rotate-0'
                    }`}
            >
                <span aria-hidden="true">{isOpen ? '✕' : '+'}</span>
            </button>

            {/* Overlay do zamykania */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-black/10 -z-10"
                />
            )}
        </div>
    )
}
