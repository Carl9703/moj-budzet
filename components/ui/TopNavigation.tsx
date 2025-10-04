'use client'

import { useRouter } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'

export function TopNavigation() {
    const router = useRouter()

    const handleLogout = () => {
        // Usuń token i dane użytkownika
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        // Przekieruj do strony logowania
        router.push('/auth/signin')
    }

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
                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
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
                    alignItems: 'center',
                    flexWrap: 'wrap'
                }}>
                    {/* Nawigacja - ukryj na małych ekranach */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center'
                    }} className="hidden-mobile">
                        {navItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => router.push(item.path)}
                                className="nav-button smooth-all"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '10px 16px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    border: '2px solid var(--border-primary)',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    textDecoration: 'none',
                                    boxShadow: 'var(--shadow-sm)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--accent-primary)'
                                    e.currentTarget.style.borderColor = 'var(--accent-primary)'
                                    e.currentTarget.style.color = '#ffffff'
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                    e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                                    e.currentTarget.style.borderColor = 'var(--border-primary)'
                                    e.currentTarget.style.color = 'var(--text-primary)'
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                                }}
                            >
                                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                    
                    {/* Theme Toggle - przenieś na koniec */}
                    <div style={{ marginLeft: '8px' }}>
                        <ThemeToggle size="small" />
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="nav-button smooth-all"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '10px 16px',
                            backgroundColor: '#fee',
                            border: '2px solid #fcc',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#c33',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            marginLeft: '8px',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#dc3545'
                            e.currentTarget.style.borderColor = '#dc3545'
                            e.currentTarget.style.color = '#ffffff'
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#fee'
                            e.currentTarget.style.borderColor = '#fcc'
                            e.currentTarget.style.color = '#c33'
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                        }}
                        title="Wyloguj się"
                    >
                        <span style={{ fontSize: '16px' }}>🚪</span>
                        <span className="hidden-mobile">Wyloguj</span>
                    </button>
                </nav>
            </div>
        </div>
    )
}
