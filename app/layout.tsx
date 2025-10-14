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
                            // PWA Installation Detection
                            let deferredPrompt;
                            
                            window.addEventListener('beforeinstallprompt', (e) => {
                                console.log('PWA: Install prompt available');
                                e.preventDefault();
                                deferredPrompt = e;
                                
                                // Show install button or banner
                                const installBanner = document.createElement('div');
                                installBanner.innerHTML = '📱 Zainstaluj aplikację na telefonie';
                                installBanner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#3b82f6;color:white;padding:10px;text-align:center;z-index:9999;cursor:pointer;';
                                installBanner.onclick = () => {
                                    deferredPrompt.prompt();
                                    deferredPrompt.userChoice.then((choiceResult) => {
                                        if (choiceResult.outcome === 'accepted') {
                                            console.log('PWA: User accepted install');
                                        }
                                        deferredPrompt = null;
                                    });
                                };
                                document.body.appendChild(installBanner);
                            });
                            
                            // Service Worker Registration
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