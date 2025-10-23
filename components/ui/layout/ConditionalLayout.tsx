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
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                minHeight: '100vh'
            }}>
                {children}
            </div>
        )
    }
    
    // Dla pozostałych stron - z sidebar
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '240px 1fr',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)'
        }} className="sidebar-layout">
            <SideNavigation />
            <MainContent>
                {children}
            </MainContent>
        </div>
    )
}
