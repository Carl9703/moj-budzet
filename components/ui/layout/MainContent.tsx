'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useSidebar } from '@/lib/contexts/SidebarContext'

interface MainContentProps {
    children: ReactNode
}

export function MainContent({ children }: MainContentProps) {
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

    return (
        <main style={{
            backgroundColor: 'var(--bg-primary)',
            position: 'relative'
        }}>
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
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '48px',
                        height: '48px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '2px solid var(--border-primary)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '20px',
                        boxShadow: 'var(--shadow-lg)',
                        color: 'var(--text-primary)',
                        minWidth: '48px',
                        minHeight: '48px'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--accent-primary)'
                        e.currentTarget.style.borderColor = 'var(--accent-primary)'
                        e.currentTarget.style.color = '#ffffff'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                        e.currentTarget.style.borderColor = 'var(--border-primary)'
                        e.currentTarget.style.color = 'var(--text-primary)'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
                    }}
                    title="Otwórz menu"
                >
                    ☰
                </button>
            )}
            
            {children}
        </main>
    )
}
