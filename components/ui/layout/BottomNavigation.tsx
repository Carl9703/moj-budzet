'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, History, Settings, BarChart3, Archive } from 'lucide-react'
import { motion } from 'framer-motion'

export function BottomNavigation() {
    const router = useRouter()
    const pathname = usePathname()

    const navItems = [
        { label: 'Pulpit', path: '/', icon: LayoutDashboard },
        { label: 'Transakcje', path: '/history', icon: History },
        // Central item could be emphasized if needed, but for now keeping uniform
        { label: 'Analizy', path: '/analytics', icon: BarChart3 },
        { label: 'Archiwum', path: '/archive', icon: Archive },
        { label: 'Ustawienia', path: '/config', icon: Settings },
    ]

    const isActive = (path: string) => path === '/' ? pathname === '/' : pathname.startsWith(path)

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[50] md:hidden">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800" />

            <nav className="relative flex justify-around items-center h-[calc(60px+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]">
                {navItems.map((item) => {
                    const active = isActive(item.path)
                    const Icon = item.icon

                    return (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className="relative flex flex-col items-center justify-center w-full h-full group"
                        >
                            {/* Active Indicator Glow */}
                            {active && (
                                <motion.div
                                    layoutId="bottomNavGlow"
                                    className="absolute top-0 w-12 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                />
                            )}

                            <div className={`flex flex-col items-center gap-1 transition-colors duration-300 ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                                }`}>
                                <Icon
                                    size={24}
                                    strokeWidth={active ? 2.5 : 2}
                                    className={`transition-transform duration-300 ${active ? 'scale-110 drop-shadow-md' : 'scale-100'}`}
                                />
                                <span className="text-[9px] font-medium tracking-wide transition-all duration-300">
                                    {item.label}
                                </span>
                            </div>
                        </button>
                    )
                })}
            </nav>
        </div>
    )
}
