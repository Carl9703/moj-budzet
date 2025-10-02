'use client'

import { useTheme } from '@/lib/contexts/ThemeContext'

interface ThemeToggleProps {
    size?: 'small' | 'medium' | 'large'
    showLabel?: boolean
}

export function ThemeToggle({ size = 'medium', showLabel = false }: ThemeToggleProps) {
    const { theme, toggleTheme, isDark } = useTheme()

    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return { width: '32px', height: '32px', fontSize: '14px' }
            case 'large':
                return { width: '48px', height: '48px', fontSize: '20px' }
            default:
                return { width: '40px', height: '40px', fontSize: '16px' }
        }
    }

    const sizeStyles = getSizeStyles()

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
                onClick={toggleTheme}
                className="btn-animate smooth-all"
                style={{
                    ...sizeStyles,
                    backgroundColor: isDark ? '#374151' : '#f3f4f6',
                    color: isDark ? '#f9fafb' : '#374151',
                    border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isDark 
                        ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
                        : '0 2px 8px rgba(0, 0, 0, 0.1)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)'
                    e.currentTarget.style.boxShadow = isDark 
                        ? '0 4px 12px rgba(0, 0, 0, 0.4)' 
                        : '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = isDark 
                        ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
                        : '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                title={isDark ? 'Przełącz na tryb jasny' : 'Przełącz na tryb ciemny'}
                aria-label={isDark ? 'Przełącz na tryb jasny' : 'Przełącz na tryb ciemny'}
            >
                <span 
                    style={{
                        transform: isDark ? 'rotate(0deg)' : 'rotate(180deg)',
                        transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'inline-block'
                    }}
                >
                    {isDark ? '🌙' : '☀️'}
                </span>
                
                {/* Ripple effect */}
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        background: isDark 
                            ? 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)'
                            : 'radial-gradient(circle, rgba(0,0,0,0.05) 0%, transparent 70%)',
                        transform: 'translate(-50%, -50%) scale(0)',
                        transition: 'transform 0.3s ease',
                        pointerEvents: 'none'
                    }}
                    className="ripple-effect"
                />
            </button>
            
            {showLabel && (
                <span style={{
                    fontSize: '14px',
                    color: isDark ? '#d1d5db' : '#6b7280',
                    fontWeight: '500'
                }}>
                    {isDark ? 'Tryb ciemny' : 'Tryb jasny'}
                </span>
            )}
            
            <style jsx>{`
                .btn-animate:active .ripple-effect {
                    transform: translate(-50%, -50%) scale(1);
                }
            `}</style>
        </div>
    )
}
