'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ThemeToggle } from '../ThemeToggle'
import { useSidebar } from '@/lib/contexts/SidebarContext'

export function SideNavigation() {
    const router = useRouter()
    const pathname = usePathname()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const { isMobileMenuOpen, setIsMobileMenuOpen } = useSidebar()

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
        { label: 'Start', path: '/start', icon: '🚀' },
        { label: 'Dashboard', path: '/', icon: '🏠' },
        { label: 'Analizy', path: '/analytics', icon: '📊' },
        { label: 'Archiwum', path: '/archive', icon: '📁' },
        { label: 'Historia', path: '/history', icon: '📜' },
        { label: 'Konfigurator', path: '/config', icon: '⚙️' }
    ]

    const isActive = (path: string) => {
        if (path === '/') {
            return pathname === '/'
        }
        return pathname.startsWith(path)
    }

    return (
        <>
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
                    width: isMobile ? '240px' : (isCollapsed ? '60px' : '240px'),
                    backgroundColor: 'var(--bg-secondary)',
                    borderRight: '1px solid var(--border-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: isMobile ? 'left 0.3s ease' : 'width 0.3s ease',
                    position: isMobile ? 'fixed' : 'sticky',
                    top: 0,
                    left: isMobile ? '-240px' : 'auto',
                    height: '100vh',
                    overflow: 'hidden',
                    zIndex: 1000
                }}
            >
            {/* Header with Logo and Toggle */}
            <div style={{
                padding: '20px 16px',
                borderBottom: '1px solid var(--border-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'space-between',
                minHeight: '60px'
            }}>
                {!isCollapsed && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        {/* Hamburger Menu */}
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                backgroundColor: 'var(--bg-tertiary)',
                                border: '1px solid var(--border-primary)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontSize: '14px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--accent-primary)'
                                e.currentTarget.style.borderColor = 'var(--accent-primary)'
                                e.currentTarget.style.color = '#ffffff'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                                e.currentTarget.style.borderColor = 'var(--border-primary)'
                                e.currentTarget.style.color = 'var(--text-primary)'
                            }}
                            title={isCollapsed ? 'Rozwiń menu' : 'Zwiń menu'}
                        >
                            ☰
                        </button>
                        
                        {/* Logo */}
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
                                fontSize: '18px',
                                fontWeight: '700',
                                margin: 0,
                                transition: 'color 0.3s ease',
                                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                                Quantum Budget
                            </h1>
                        </div>
                    </div>
                )}
                
                {isCollapsed && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        {/* Hamburger Menu */}
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                backgroundColor: 'var(--bg-tertiary)',
                                border: '1px solid var(--border-primary)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontSize: '14px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--accent-primary)'
                                e.currentTarget.style.borderColor = 'var(--accent-primary)'
                                e.currentTarget.style.color = '#ffffff'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                                e.currentTarget.style.borderColor = 'var(--border-primary)'
                                e.currentTarget.style.color = 'var(--text-primary)'
                            }}
                            title="Rozwiń menu"
                        >
                            ☰
                        </button>
                        
                    </div>
                )}

            </div>

            {/* Navigation Items */}
            <nav style={{
                flex: 1,
                padding: '16px 8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
            }}>
                {navItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => handleNavClick(item.path)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: isCollapsed ? '0' : '12px',
                            padding: isCollapsed ? '12px' : '12px 16px',
                            backgroundColor: isActive(item.path) ? 'var(--accent-primary)' : 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: isActive(item.path) ? '600' : '500',
                            color: isActive(item.path) ? '#ffffff' : 'var(--text-primary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textAlign: isCollapsed ? 'center' : 'left',
                            justifyContent: isCollapsed ? 'center' : 'flex-start',
                            position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive(item.path)) {
                                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                                e.currentTarget.style.transform = 'translateX(4px)'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive(item.path)) {
                                e.currentTarget.style.backgroundColor = 'transparent'
                                e.currentTarget.style.transform = 'translateX(0)'
                            }
                        }}
                        title={isCollapsed ? item.label : undefined}
                    >
                        <span style={{ fontSize: '18px', minWidth: '20px' }}>{item.icon}</span>
                        {!isCollapsed && <span>{item.label}</span>}
                        
                        {/* Active indicator */}
                        {isActive(item.path) && (
                            <div style={{
                                position: 'absolute',
                                left: '0',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '3px',
                                height: '20px',
                                backgroundColor: '#ffffff',
                                borderRadius: '0 2px 2px 0'
                            }} />
                        )}
                    </button>
                ))}
            </nav>

            {/* Footer with Theme Toggle and User Profile */}
            <div style={{
                padding: '16px',
                borderTop: '1px solid var(--border-primary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                {/* Theme Toggle */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-primary)'
                }}>
                    {!isCollapsed && (
                        <span style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: 'var(--text-primary)'
                        }}>
                            Motyw
                        </span>
                    )}
                    <ThemeToggle size="small" />
                </div>

                {/* User Profile / Logout */}
                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isCollapsed ? '0' : '12px',
                        padding: isCollapsed ? '12px' : '12px 16px',
                        backgroundColor: '#fee',
                        border: '1px solid #fcc',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#c33',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: isCollapsed ? 'center' : 'left',
                        justifyContent: isCollapsed ? 'center' : 'flex-start'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#dc3545'
                        e.currentTarget.style.borderColor = '#dc3545'
                        e.currentTarget.style.color = '#ffffff'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fee'
                        e.currentTarget.style.borderColor = '#fcc'
                        e.currentTarget.style.color = '#c33'
                        e.currentTarget.style.transform = 'translateY(0)'
                    }}
                    title={isCollapsed ? 'Wyloguj się' : undefined}
                >
                    <span style={{ fontSize: '16px' }}>🚪</span>
                    {!isCollapsed && <span>Wyloguj</span>}
                </button>
            </div>
        </aside>
        </>
    )
}
