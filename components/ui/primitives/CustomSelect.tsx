'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption {
    label: string
    value: string
    icon?: React.ReactNode
}

interface CustomSelectProps {
    options: SelectOption[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
    label?: string
    icon?: React.ReactNode
    className?: string
    disabled?: boolean
}

export function CustomSelect({
    options,
    value,
    onChange,
    placeholder = 'Wybierz...',
    label,
    icon,
    className = '',
    disabled = false
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const selectedOption = options.find(opt => opt.value === value)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (optionValue: string) => {
        if (disabled) return
        onChange(optionValue)
        setIsOpen(false)
    }

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${disabled
                    ? 'bg-zinc-800/50 border-zinc-800 text-zinc-500 cursor-not-allowed'
                    : isOpen
                        ? 'bg-zinc-800 border-amber-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                        : 'bg-zinc-900/50 border-zinc-700 hover:border-zinc-600 text-zinc-200'
                    }`}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {icon && <span className="text-zinc-400">{icon}</span>}
                    {selectedOption ? (
                        <div className="flex items-center gap-2 truncate">
                            {selectedOption.icon && <span>{selectedOption.icon}</span>}
                            <span>{selectedOption.label}</span>
                        </div>
                    ) : (
                        <span className="text-zinc-500">{placeholder}</span>
                    )}
                </div>
                <ChevronDown
                    size={16}
                    className={`text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            <AnimatePresence>
                {isOpen && !disabled && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-700/50 rounded-xl shadow-xl overflow-hidden backdrop-blur-xl"
                        style={{ maxHeight: '250px' }}
                    >
                        <div className="overflow-y-auto custom-scrollbar p-1 max-h-[240px]">
                            {options.length === 0 ? (
                                <div className="p-4 text-center text-sm text-zinc-500">Brak opcji</div>
                            ) : (
                                options.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleSelect(option.value)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-colors text-left group ${option.value === value
                                            ? 'bg-amber-600 text-white font-medium'
                                            : 'text-zinc-300 hover:bg-zinc-800'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 truncate">
                                            {option.icon && (
                                                <span className={`text-lg transition-transform group-hover:scale-110 ${option.value === value ? 'text-white' : 'opacity-80'
                                                    }`}>
                                                    {option.icon}
                                                </span>
                                            )}
                                            <span className="truncate">{option.label}</span>
                                        </div>
                                        {option.value === value && <Check size={14} />}
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
