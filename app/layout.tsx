import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { SideNavigation } from '@/components/ui/SideNavigation'
import { MainContent } from '@/components/ui/MainContent'
import { SidebarProvider } from '@/lib/contexts/SidebarContext'

export const metadata = {
    title: 'Mój Budżet - Aplikacja Finansowa',
    description: 'Inteligentna aplikacja do zarządzania budżetem osobistym z kopertami i analizami',
    manifest: '/manifest.json',
    icons: {
        icon: '/icon.svg',
        apple: '/icon.svg',
    },
    robots: 'index, follow',
    openGraph: {
        title: 'Mój Budżet - Aplikacja Finansowa',
        description: 'Inteligentna aplikacja do zarządzania budżetem osobistym z kopertami i analizami',
        type: 'website',
        locale: 'pl_PL',
    },
    twitter: {
        card: 'summary',
        title: 'Mój Budżet - Aplikacja Finansowa',
        description: 'Inteligentna aplikacja do zarządzania budżetem osobistym z kopertami i analizami',
    }
}

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#3B82F6',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pl" suppressHydrationWarning>
            <body className="bg-gray-50" suppressHydrationWarning>
                <ErrorBoundary>
                    <ThemeProvider>
                        <ToastProvider>
                            <SidebarProvider>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '240px 1fr',
                                    minHeight: '100vh',
                                    backgroundColor: 'var(--bg-primary)'
                                }} className="sidebar-layout">
                                    <SideNavigation />
                                    <MainContent>
                                        {children}
                                    </MainContent>
                                </div>
                            </SidebarProvider>
                        </ToastProvider>
                    </ThemeProvider>
                </ErrorBoundary>
            </body>
        </html>
    )
}