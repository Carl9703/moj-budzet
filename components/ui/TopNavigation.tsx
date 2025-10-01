'use client'

import { useRouter } from 'next/navigation'

export function TopNavigation() {
    const router = useRouter()

    const navItems = [
        { label: 'Analizy', path: '/analytics', icon: '📊' },
        { label: 'Archiwum', path: '/archive', icon: '📁' },
        { label: 'Historia', path: '/history', icon: '📜' },
        { label: 'Konfigurator', path: '/config', icon: '⚙️' }
    ]

    return (
        <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            backgroundColor: 'white',
            borderBottom: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            padding: '12px 0',
            marginBottom: '24px'
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
                    <h1 style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: '#1f2937',
                        margin: 0
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
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                backgroundColor: 'transparent',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#374151',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                textDecoration: 'none'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f9fafb'
                                e.currentTarget.style.borderColor = '#d1d5db'
                                e.currentTarget.style.transform = 'translateY(-1px)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                                e.currentTarget.style.borderColor = '#e5e7eb'
                                e.currentTarget.style.transform = 'translateY(0)'
                            }}
                        >
                            <span style={{ fontSize: '16px' }}>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    )
}
