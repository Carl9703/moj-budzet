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
            minHeight: '100vh',
            overflow: 'auto',
            padding: '24px',
            position: 'relative'
        }}>
            {/* Mobile Menu Button */}
            {isMobile && (
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '2px solid var(--border-primary)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '20px',
                        boxShadow: 'var(--shadow-md)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--accent-primary)'
                        e.currentTarget.style.borderColor = 'var(--accent-primary)'
                        e.currentTarget.style.color = '#ffffff'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                        e.currentTarget.style.borderColor = 'var(--border-primary)'
                        e.currentTarget.style.color = 'var(--text-primary)'
                        e.currentTarget.style.transform = 'translateY(0)'
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
