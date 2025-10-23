import './globals.css'
import { ToastProvider } from '@/components/ui/feedback/Toast'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'
import { ErrorBoundary } from '@/components/ui/feedback/ErrorBoundary'
import { SideNavigation } from '@/components/ui/layout/SideNavigation'
import { MainContent } from '@/components/ui/layout/MainContent'
import { SidebarProvider } from '@/lib/contexts/SidebarContext'
import { ConditionalLayout } from '@/components/ui/layout/ConditionalLayout'

export const metadata = {
    title: 'Quantum Budget - Inteligentna Aplikacja Finansowa',
    description: 'Quantum Budget - zaawansowana aplikacja do zarządzania budżetem osobistym z kopertami i analizami',
    manifest: '/manifest.json',
    icons: {
        icon: '/favicon.svg',
        apple: '/favicon.svg',
    },
    robots: 'index, follow',
    openGraph: {
        title: 'Quantum Budget - Inteligentna Aplikacja Finansowa',
        description: 'Quantum Budget - zaawansowana aplikacja do zarządzania budżetem osobistym z kopertami i analizami',
        type: 'website',
        locale: 'pl_PL',
    },
    twitter: {
        card: 'summary',
        title: 'Quantum Budget - Inteligentna Aplikacja Finansowa',
        description: 'Quantum Budget - zaawansowana aplikacja do zarządzania budżetem osobistym z kopertami i analizami',
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
                <body style={{ backgroundColor: 'var(--bg-primary)' }} suppressHydrationWarning>
                <ErrorBoundary>
                    <ThemeProvider>
                        <ToastProvider>
                            <SidebarProvider>
                                <ConditionalLayout>
                                    {children}
                                </ConditionalLayout>
                            </SidebarProvider>
                        </ToastProvider>
                    </ThemeProvider>
                </ErrorBoundary>
            </body>
        </html>
    )
}