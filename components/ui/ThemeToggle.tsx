'use client'

import { useTheme } from '@/lib/contexts/ThemeContext'

interface ThemeToggleProps {
    size?: 'small' | 'medium' | 'large'
    showLabel?: boolean
}

export function ThemeToggle({ size = 'medium', showLabel = false }: ThemeToggleProps) {
    const { isDark, toggleTheme } = useTheme()

    const getSizeClasses = () => {
        switch (size) {
            case 'small':
                return 'w-8 h-8 text-sm'
            case 'large':
                return 'w-12 h-12 text-xl'
            default:
                return 'w-10 h-10 text-base'
        }
    }

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={toggleTheme}
                className={`${getSizeClasses()} rounded-full cursor-pointer flex items-center justify-center transition-all duration-300 relative overflow-hidden border-2 hover:scale-110 ${isDark
                        ? 'bg-blue-400 border-blue-400 shadow-[0_2px_12px_rgba(74,158,255,0.4)] hover:shadow-[0_4px_16px_rgba(74,158,255,0.6)]'
                        : 'bg-amber-500 border-amber-500 shadow-[0_2px_12px_rgba(245,158,11,0.4)] hover:shadow-[0_4px_16px_rgba(245,158,11,0.6)]'
                    } text-white`}
                title={isDark ? 'Przełącz na tryb jasny' : 'Przełącz na tryb ciemny'}
                aria-label={isDark ? 'Przełącz na tryb jasny' : 'Przełącz na tryb ciemny'}
            >
                <span
                    className={`inline-block transition-transform duration-500 ${isDark ? 'rotate-0' : 'rotate-180'}`}
                >
                    {isDark ? '🌙' : '☀️'}
                </span>
            </button>

            {showLabel && (
                <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                    {isDark ? 'Tryb ciemny' : 'Tryb jasny'}
                </span>
            )}
        </div>
    )
}
