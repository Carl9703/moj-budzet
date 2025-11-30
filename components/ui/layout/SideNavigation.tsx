'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ThemeToggle } from '../ThemeToggle'
import { useSidebar } from '@/lib/contexts/SidebarContext'
import { useDashboard } from '@/lib/hooks/useDashboard'
import { useAuth } from '@/lib/hooks/useAuth'

export function SideNavigation() {
    const router = useRouter()
    const pathname = usePathname()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const { isMobileMenuOpen, setIsMobileMenuOpen } = useSidebar()
    const { isAuthenticated } = useAuth()
    const { data: dashboardData } = useDashboard()

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768)
        }
        
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        router.push('/auth/signin')
    }

    const handleNavClick = (path: string) => {
        router.push(path)
        if (isMobile) {
            setIsMobileMenuOpen(false)
        }
    }

    const navItems = [
        { label: 'Pulpit', path: '/', icon: '📊' },
        { label: 'Transakcje', path: '/history', icon: '💳' },
        { label: 'Ustawienia', path: '/config', icon: '⚙️' },
        { label: 'Analizy', path: '/analytics', icon: '📈' },
        { label: 'Archiwum', path: '/archive', icon: '📁' }
    ]

    const isActive = (path: string) => {
        if (path === '/') {
            return pathname === '/'
        }
        return pathname.startsWith(path)
    }

    return (
        <>
            {/* Mobile Menu Button */}
            {isMobile && (
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="mobile-menu-btn"
                    style={{
                        position: 'fixed',
                        top: '16px',
                        left: '16px',
                        zIndex: 1001,
                        width: '48px',
                        height: '48px',
                        minWidth: '48px',
                        minHeight: '48px',
                        backgroundColor: '#0f172a', // slate-900
                        border: '1px solid #1e293b', // slate-800
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        color: '#f1f5f9', // slate-100
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1e293b' // slate-800
                        e.currentTarget.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#0f172a' // slate-900
                        e.currentTarget.style.transform = 'scale(1)'
                    }}
                >
                    {isMobileMenuOpen ? '✕' : '☰'}
                </button>
            )}

            {/* Mobile Overlay */}
            {isMobile && isMobileMenuOpen && (
                <div 
                    className="sidebar-overlay show"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 999,
                        display: 'block'
                    }}
                />
            )}
            
            <aside 
                className={isMobile && isMobileMenuOpen ? 'sidebar-open' : ''}
                style={{
                    width: isMobile ? '240px' : '256px', // w-64 = 256px (quantum-budget)
                    backgroundColor: '#0f172a', // slate-900
                    borderRight: '1px solid #1e293b', // slate-800
                    display: 'flex',
                    flexDirection: 'column',
                    transition: isMobile ? 'left 0.3s ease' : 'none',
                    position: isMobile ? 'fixed' : 'fixed', // fixed like quantum-budget
                    top: 0,
                    left: isMobile ? (isMobileMenuOpen ? '0' : '-240px') : '0',
                    height: '100vh',
                    overflow: 'hidden',
                    zIndex: isMobile ? 1000 : 10 // Higher z-index on mobile
                }}
            >
            {/* Header with Logo - Quantum Budget Style */}
            <div style={{
                padding: '24px',
                borderBottom: '1px solid #1e293b', // slate-800
            }}>
                <div 
                    onClick={() => router.push('/')}
                    style={{
                        cursor: 'pointer'
                    }}
                >
                    <h1 style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        margin: 0,
                        background: 'linear-gradient(135deg, #818cf8, #22d3ee)', // indigo-400 to cyan-400
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        lineHeight: '1.2'
                    }}>
                        Quantum
                    </h1>
                    <p style={{
                        fontSize: '12px',
                        color: '#64748b', // slate-500
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: '600'
                    }}>
                        System Budżetowy
                    </p>
                </div>
            </div>

            {/* Navigation Items - Quantum Budget Style */}
            <nav style={{
                flex: 1,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                overflowY: 'auto'
            }}>
                {navItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => handleNavClick(item.path)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            backgroundColor: isActive(item.path) ? '#4f46e5' : 'transparent', // indigo-600
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: isActive(item.path) ? '600' : '500',
                            color: isActive(item.path) ? '#f1f5f9' : '#94a3b8', // slate-100 : slate-400
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textAlign: 'left',
                            justifyContent: 'flex-start',
                            width: '100%'
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive(item.path)) {
                                e.currentTarget.style.backgroundColor = '#1e293b' // slate-800
                                e.currentTarget.style.color = '#e2e8f0' // slate-200
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive(item.path)) {
                                e.currentTarget.style.backgroundColor = 'transparent'
                                e.currentTarget.style.color = '#94a3b8' // slate-400
                            }
                        }}
                    >
                        <span style={{ fontSize: '20px' }}>{item.icon}</span>
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Footer - Quantum Budget Style (Wolne Środki section) */}
            <div style={{
                padding: '16px',
                borderTop: '1px solid #1e293b', // slate-800
                backgroundColor: '#0f172a' // slate-900
            }}>
                <div style={{
                    backgroundColor: '#1e293b', // slate-800
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid #334155' // slate-700
                }}>
                    <div style={{ marginBottom: '12px' }}>
                        <p style={{
                            fontSize: '12px',
                            color: '#818cf8', // indigo-400
                            margin: '0 0 4px 0',
                            fontWeight: '700',
                            textTransform: 'uppercase'
                        }}>
                            Konto główne
                        </p>
                        <p style={{
                            fontSize: '20px',
                            fontWeight: '700',
                            color: '#f1f5f9', // white
                            margin: 0
                        }}>
                            {isAuthenticated && dashboardData?.balance?.toFixed(2) || '0.00'} PLN
                        </p>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <p style={{
                            fontSize: '12px',
                            color: '#818cf8', // indigo-400
                            margin: '0 0 4px 0',
                            fontWeight: '700',
                            textTransform: 'uppercase'
                        }}>
                            Wolne Środki
                        </p>
                        <p style={{
                            fontSize: '20px',
                            fontWeight: '700',
                            color: '#f1f5f9', // white
                            margin: 0
                        }}>
                            {isAuthenticated && dashboardData?.yearlyEnvelopes?.find(e => e.name.toLowerCase().includes('wolne środki'))?.current?.toFixed(2) || '0.00'} PLN
                        </p>
                    </div>
                    <p style={{
                        fontSize: '12px',
                        color: '#64748b', // slate-500
                        margin: '0 0 4px 0'
                    }}>
                        Fundusz Awaryjny
                    </p>
                    <p style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#cbd5e1', // slate-300
                        margin: 0
                    }}>
                        {isAuthenticated && dashboardData?.monthlyEnvelopes?.find(e => e.name === 'Fundusz Awaryjny')?.current?.toFixed(2) || 
                         dashboardData?.yearlyEnvelopes?.find(e => e.name === 'Fundusz Awaryjny')?.current?.toFixed(2) || '0.00'} PLN
                    </p>
                </div>
                
                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        backgroundColor: '#1e293b', // slate-800
                        border: '1px solid #334155', // slate-700
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#fb7185', // rose-400
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'left',
                        justifyContent: 'flex-start',
                        width: '100%',
                        marginTop: '8px'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fb7185' // rose-400
                        e.currentTarget.style.borderColor = '#fb7185'
                        e.currentTarget.style.color = '#ffffff'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#1e293b' // slate-800
                        e.currentTarget.style.borderColor = '#334155' // slate-700
                        e.currentTarget.style.color = '#fb7185' // rose-400
                    }}
                >
                    <span style={{ fontSize: '16px' }}>🚪</span>
                    <span>Wyloguj</span>
                </button>
            </div>
        </aside>
        </>
    )
}
