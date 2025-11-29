'use client'

import { usePathname } from 'next/navigation'
import { SideNavigation } from './SideNavigation'
import { MainContent } from './MainContent'

interface ConditionalLayoutProps {
    children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
    const pathname = usePathname()
    
    // Strony, na których sidebar powinien być ukryty
    const hideSidebarPaths = ['/auth/signin', '/auth/signup']
    const shouldHideSidebar = hideSidebarPaths.includes(pathname)
    
    if (shouldHideSidebar) {
        // Dla stron autoryzacji - bez sidebaru
        return (
            <div style={{
                backgroundColor: '#020617', // slate-950
                color: '#f1f5f9', // slate-100
                minHeight: '100vh'
            }}>
                {children}
            </div>
        )
    }
    
    // Dla pozostałych stron - z sidebar (quantum-budget style)
    return (
        <div style={{
            display: 'flex',
            backgroundColor: '#020617', // slate-950
            color: '#f1f5f9', // slate-100
            minHeight: '100vh'
        }} className="quantum-layout">
            <SideNavigation />
            <MainContent>
                {children}
            </MainContent>
        </div>
    )
}
