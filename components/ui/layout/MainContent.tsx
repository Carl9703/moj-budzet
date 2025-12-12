'use client'

import { ReactNode, useState, useEffect } from 'react'

interface MainContentProps {
    children: ReactNode
}

export function MainContent({ children }: MainContentProps) {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    return (
        <main className={`bg-slate-950 relative flex-1 overflow-auto min-h-screen transition-all duration-300 ${isMobile ? 'ml-0 p-4 pb-24' : 'ml-64 p-8'}`}>
            {children}
        </main>
    )
}
