'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { motion } from 'framer-motion'
import { LayoutDashboard, History, Gem, BarChart3, Archive, Settings, LogOut } from 'lucide-react'

export function SideNavigation() {
    const router = useRouter()
    const pathname = usePathname()
    const { isAuthenticated } = useAuth()

    const handleLogout = () => {
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        router.push('/auth/signin')
    }

    const navItems = [
        { label: 'Pulpit', path: '/', icon: LayoutDashboard },
        { label: 'Transakcje', path: '/history', icon: History },
        { label: 'Inwestycje', path: '/investments', icon: Gem },
        { label: 'Analizy', path: '/analytics', icon: BarChart3 },
        { label: 'Archiwum', path: '/archive', icon: Archive },
        { label: 'Ustawienia', path: '/config', icon: Settings }
    ]

    const isActive = (path: string) => path === '/' ? pathname === '/' : pathname.startsWith(path)

    return (
        <aside className="fixed top-0 bottom-0 left-0 w-64 hidden md:flex flex-col bg-zinc-950/80 backdrop-blur-xl border-r border-white/5 z-10 transition-all duration-300 shadow-2xl shadow-black/50">
            {/* Header / Logo */}
            <div className="p-8 pb-6">
                <div onClick={() => router.push('/')} className="cursor-pointer group flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                        <span className="text-white text-xl font-black">Q</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold m-0 bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 leading-tight">
                            Quantum
                        </h1>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black opacity-80 mt-0.5">
                            System Budżetu
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-2 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            aria-label={item.label}
                            aria-current={isActive(item.path) ? 'page' : undefined}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left focus:outline-none ${isActive(item.path)
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/5'
                                : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200 border border-transparent'
                                }`}
                        >
                            <Icon
                                size={20}
                                strokeWidth={isActive(item.path) ? 2.5 : 2}
                                className={`transition-transform duration-300 ${isActive(item.path) ? 'scale-110' : ''}`}
                            />
                            <span className="tracking-tight">{item.label}</span>
                            {isActive(item.path) && (
                                <motion.div
                                    layoutId="activeNav"
                                    className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px] shadow-amber-500/50"
                                />
                            )}
                        </button>
                    )
                })}
            </nav>

            {/* Footer / Account */}
            <div className="p-4 border-t border-white/5">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900/50 border border-white/5 rounded-2xl text-sm font-bold text-zinc-400 transition-all hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 active:scale-95"
                >
                    <LogOut size={18} strokeWidth={2} />
                    <span>Wyloguj Się</span>
                </button>
            </div>
        </aside>
    )
}
