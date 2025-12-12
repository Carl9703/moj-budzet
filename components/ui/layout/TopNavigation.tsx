'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '../ThemeToggle'

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
        <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-[100] py-3 mb-6 shadow-lg transition-all duration-300">
            <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
                {/* Logo/Tytuł + Dark Mode */}
                <div className="flex items-center gap-4">
                    <div
                        onClick={() => router.push('/')}
                        className="flex items-center gap-3 cursor-pointer p-2 px-3 rounded-lg hover:bg-slate-800 transition-all duration-200 hover:-translate-y-0.5"
                    >
                        <h1 className="text-xl font-bold m-0 bg-gradient-to-br from-blue-500 to-purple-500 bg-clip-text text-transparent">
                            Quantum Budget
                        </h1>
                    </div>

                    {/* Theme Toggle - obok logo */}
                    <ThemeToggle size="small" />
                </div>

                {/* Nawigacja */}
                <nav className="flex gap-2 items-center flex-wrap">
                    {/* Nawigacja - ukryj na małych ekranach */}
                    <div className="hidden md:flex gap-2 items-center">
                        {navItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => router.push(item.path)}
                                className="flex items-center gap-1.5 py-2.5 px-4 bg-slate-800 border-2 border-slate-700 rounded-lg text-sm font-semibold text-slate-200 cursor-pointer transition-all duration-200 shadow-sm hover:bg-indigo-600 hover:border-indigo-600 hover:text-white hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <span className="text-base">{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="flex md:hidden items-center justify-center w-10 h-10 bg-slate-800 border-2 border-slate-700 rounded-lg cursor-pointer transition-all duration-200 shadow-sm hover:bg-indigo-600 hover:border-indigo-600 hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <span className="text-lg">
                            {isMobileMenuOpen ? '✕' : '☰'}
                        </span>
                    </button>

                    {/* Logout Button - tylko na PC */}
                    <button
                        onClick={handleLogout}
                        className="hidden md:flex items-center gap-1.5 py-2.5 px-4 bg-rose-950 border-2 border-rose-900 rounded-lg text-sm font-semibold text-rose-300 cursor-pointer transition-all duration-200 ml-2 shadow-sm hover:bg-rose-600 hover:border-rose-600 hover:text-white hover:-translate-y-0.5 hover:shadow-md"
                        title="Wyloguj się"
                    >
                        <span className="text-base">🚪</span>
                        <span>Wyloguj</span>
                    </button>
                </nav>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="absolute top-full left-0 right-0 bg-slate-900 border border-slate-800 border-t-0 rounded-b-lg shadow-2xl z-[1000] p-2">
                    <div className="flex flex-col gap-1">
                        {navItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => handleNavClick(item.path)}
                                className="flex items-center gap-3 py-3 px-4 bg-slate-800 border border-slate-700 rounded-md text-sm font-medium text-slate-200 cursor-pointer transition-all duration-200 text-left hover:bg-indigo-600 hover:border-indigo-600 hover:text-white"
                            >
                                <span className="text-lg">{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        ))}

                        {/* Wyloguj w menu mobile */}
                        <button
                            onClick={() => {
                                handleLogout()
                                setIsMobileMenuOpen(false)
                            }}
                            className="flex items-center gap-3 py-3 px-4 bg-rose-950 border border-rose-900 rounded-md text-sm font-medium text-rose-300 cursor-pointer transition-all duration-200 text-left mt-1 hover:bg-rose-600 hover:border-rose-600 hover:text-white"
                        >
                            <span className="text-lg">🚪</span>
                            <span>Wyloguj</span>
                        </button>
                    </div>
                </div>
            )}
        </header>
    )
}

