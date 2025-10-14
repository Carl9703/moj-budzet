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
                            // Cache busting for user data
                            const userId = localStorage.getItem('userId');
                            const lastLogin = localStorage.getItem('lastLogin');
                            const currentTime = Date.now();
                            
                            // Clear cache if user changed or 24h passed
                            if (userId && lastLogin) {
                                const timeDiff = currentTime - parseInt(lastLogin);
                                if (timeDiff > 24 * 60 * 60 * 1000) { // 24 hours
                                    console.log('Cache expired, clearing...');
                                    localStorage.clear();
                                    sessionStorage.clear();
                                    window.location.reload();
                                }
                            }
                            
                            // PWA Installation Detection
                            let deferredPrompt;
                            
                            // Debug PWA requirements
                            console.log('PWA Debug:');
                            console.log('- Standalone:', window.matchMedia('(display-mode: standalone)').matches);
                            console.log('- User Agent:', navigator.userAgent);
                            console.log('- HTTPS:', location.protocol === 'https:');
                            console.log('- Manifest:', document.querySelector('link[rel="manifest"]')?.href);
                            
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
                            
                            // Check if already installed
                            window.addEventListener('appinstalled', () => {
                                console.log('PWA: App was installed');
                            });
                            
                            // Manual install button if no prompt
                            setTimeout(() => {
                                if (!deferredPrompt) {
                                    console.log('PWA: No install prompt available, showing manual button');
                                    const manualButton = document.createElement('div');
                                    manualButton.innerHTML = '📱 Zainstaluj aplikację (ręcznie)';
                                    manualButton.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#10b981;color:white;padding:10px;text-align:center;z-index:9999;cursor:pointer;';
                                    manualButton.onclick = () => {
                                        alert('Aby zainstalować aplikację:\\n1. W menu przeglądarki wybierz "Zainstaluj aplikację"\\n2. Lub dodaj do ekranu głównego');
                                    };
                                    document.body.appendChild(manualButton);
                                }
                            }, 3000);
                            
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