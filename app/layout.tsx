import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export const metadata = {
    title: 'Mój Budżet - Aplikacja Finansowa',
    description: 'Inteligentna aplikacja do zarządzania budżetem osobistym z kopertami i analizami',
    manifest: '/manifest.json',
    themeColor: '#3b82f6',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Mój Budżet'
    },
    icons: {
        icon: '/icons/icon-192x192.png',
        apple: '/icons/icon-192x192.png'
    }
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pl" suppressHydrationWarning>
            <head>
                <link rel="manifest" href="/manifest.json" />
                <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="apple-mobile-web-app-title" content="Mój Budżet" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="msapplication-TileColor" content="#3b82f6" />
                <meta name="msapplication-tap-highlight" content="no" />
            </head>
            <body className="bg-gray-50" suppressHydrationWarning>
                <ErrorBoundary>
                    <ThemeProvider>
                        <ToastProvider>
                            {children}
                        </ToastProvider>
                    </ThemeProvider>
                </ErrorBoundary>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            if ('serviceWorker' in navigator) {
                                window.addEventListener('load', function() {
                                    navigator.serviceWorker.register('/sw.js')
                                        .then(function(registration) {
                                            console.log('SW registered: ', registration);
                                        })
                                        .catch(function(registrationError) {
                                            console.log('SW registration failed: ', registrationError);
                                        });
                                });
                            }
                        `,
                    }}
                />
            </body>
        </html>
    )
}