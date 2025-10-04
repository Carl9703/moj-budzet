import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export const metadata = {
    title: 'Budżet Domowy',
    description: 'Aplikacja do zarządzania budżetem',
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
                            {children}
                        </ToastProvider>
                    </ThemeProvider>
                </ErrorBoundary>
            </body>
        </html>
    )
}