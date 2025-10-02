'use client'

import { useRouter } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'

export function TopNavigation() {
    const router = useRouter()

    const navItems = [
        { label: 'Analizy', path: '/analytics', icon: '📊' },
        { label: 'Archiwum', path: '/archive', icon: '📁' },
        { label: 'Historia', path: '/history', icon: '📜' },
        { label: 'Konfigurator', path: '/config', icon: '⚙️' }
    ]

    return (
        <div className="bg-theme-secondary border-theme shadow-md" style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            borderBottom: '1px solid var(--border-primary)',
            padding: '12px 0',
            marginBottom: '24px',
            transition: 'all 0.3s ease'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '0 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                {/* Logo/Tytuł - klikalny */}
                <div 
                    onClick={() => router.push('/')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.transform = 'translateY(0)'
                    }}
                >
                    <h1 className="text-theme-primary" style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        margin: 0,
                        transition: 'color 0.3s ease'
                    }}>
                        💰 Budżet Domowy
                    </h1>
                </div>

                {/* Nawigacja */}
                <nav style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                }}>
                    {navItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className="text-theme-secondary border-theme smooth-all"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                backgroundColor: 'transparent',
                                border: '1px solid var(--border-primary)',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                textDecoration: 'none'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                                e.currentTarget.style.borderColor = 'var(--border-secondary)'
                                e.currentTarget.style.transform = 'translateY(-1px)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                                e.currentTarget.style.borderColor = 'var(--border-primary)'
                                e.currentTarget.style.transform = 'translateY(0)'
                            }}
                        >
                            <span style={{ fontSize: '16px' }}>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                    
                    {/* Theme Toggle */}
                    <div style={{ marginLeft: '12px' }}>
                        <ThemeToggle size="small" />
                    </div>
                </nav>
            </div>
        </div>
    )
}
