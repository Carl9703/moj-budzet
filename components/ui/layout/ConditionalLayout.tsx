'use client'

import { usePathname } from 'next/navigation'
import { SideNavigation } from './SideNavigation'
import { MainContent } from './MainContent'
import { BottomNavigation } from './BottomNavigation'

interface ConditionalLayoutProps {
    children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
    const pathname = usePathname()
    const hideSidebarPaths = ['/auth/signin', '/auth/signup']
    const shouldHideSidebar = hideSidebarPaths.includes(pathname)

    if (shouldHideSidebar) {
        return <div className="bg-slate-950 text-slate-100 min-h-screen">{children}</div>
    }

    return (
        <div className="flex bg-slate-950 text-slate-100 min-h-screen">
            <SideNavigation />
            <MainContent>{children}</MainContent>
            <BottomNavigation />
        </div>
    )
}
