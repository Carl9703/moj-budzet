import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'

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
                <ThemeProvider>
                    <ToastProvider>
                        {children}
                    </ToastProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}