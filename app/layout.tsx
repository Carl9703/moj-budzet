import './globals.css'
import { ToastProvider } from '@/components/ui/feedback/Toast'
import { ErrorBoundary } from '@/components/ui/feedback/ErrorBoundary'
import { SideNavigation } from '@/components/ui/layout/SideNavigation'
import { MainContent } from '@/components/ui/layout/MainContent'
import { ConditionalLayout } from '@/components/ui/layout/ConditionalLayout'
import { QueryProvider } from '@/lib/providers/QueryProvider'
import { CategoryProvider } from '@/lib/contexts/CategoryContext'
import { PwaRegistrar } from '@/components/PwaRegistrar'

export const metadata = {
    title: 'Quantum Budget - Inteligentna Aplikacja Finansowa',
    description: 'Quantum Budget - zaawansowana aplikacja do zarządzania budżetem osobistym z kopertami i analizami',
    icons: {
        icon: '/favicon.svg',
        apple: '/icon-180.png',
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Quantum Budget',
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
    maximumScale: 1,
    userScalable: false, // App-like feel, prevents accidental zooming
    themeColor: '#09090b',
}

import { CommandPalette } from '@/components/ui/CommandPalette'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pl" suppressHydrationWarning>
            <body style={{ backgroundColor: '#09090b' }} suppressHydrationWarning> {/* zinc-950 */}
                <ErrorBoundary>
                    <QueryProvider>
                        <ToastProvider>
                            <CategoryProvider>
                                <ConditionalLayout>
                                    <PwaRegistrar />
                                    <CommandPalette />
                                    {children}
                                </ConditionalLayout>
                            </CategoryProvider>
                        </ToastProvider>
                    </QueryProvider>
                </ErrorBoundary>
            </body>
        </html>
    )
}
