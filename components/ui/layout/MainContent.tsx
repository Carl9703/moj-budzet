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
            backgroundColor: '#020617', // slate-950
            position: 'relative',
            flex: 1,
            marginLeft: isMobile ? '0' : '256px', // Space for sidebar w-64 = 256px (quantum-budget style)
            padding: isMobile ? '16px' : '32px',
            overflow: 'auto',
            minHeight: '100vh',
            transition: 'margin-left 0.3s ease, padding 0.3s ease'
        }}>
            {children}
        </main>
    )
}
