'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'

export function TopNavigation() {
    const router = useRouter()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const handleLogout = () => {
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        router.push('/auth/signin')
    }

    const handleNavClick = (path: string) => {
        router.push(path)
        setIsMobileMenuOpen(false)
    }

    const navItems = [
        { label: 'Analizy', path: '/analytics', icon: '📊' },
        { label: 'Archiwum', path: '/archive', icon: '📁' },
        { label: 'Historia', path: '/history', icon: '📜' },
        { label: 'Konfigurator', path: '/config', icon: '⚙️' }
    ]

    return (
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center space-x-3 group"
                        >
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-105">
                                <span className="text-white font-bold text-lg">B</span>
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    Budżet Domowy
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Zarządzanie finansami</p>
                            </div>
                        </button>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-1">
                        {navItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => router.push(item.path)}
                                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                            >
                                <span className="text-lg">{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* Right side */}
                    <div className="flex items-center space-x-4">
                        <ThemeToggle size="small" />
                        
                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="hidden md:flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                        >
                            <span>🚪</span>
                            <span>Wyloguj</span>
                        </button>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <span className="text-xl">
                                {isMobileMenuOpen ? '✕' : '☰'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4">
                        <div className="space-y-2">
                            {navItems.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => handleNavClick(item.path)}
                                    className="flex items-center space-x-3 w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            ))}
                            <button
                                onClick={() => {
                                    handleLogout()
                                    setIsMobileMenuOpen(false)
                                }}
                                className="flex items-center space-x-3 w-full px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                <span className="text-lg">🚪</span>
                                <span className="font-medium">Wyloguj</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}
