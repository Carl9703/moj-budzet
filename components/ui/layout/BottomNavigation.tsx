'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, History, Settings, BarChart3, Archive, Gem } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function BottomNavigation() {
    const router = useRouter()
    const pathname = usePathname()

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
        <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[100] md:hidden w-[calc(100%-2.5rem)] max-w-xl">
            <nav className="relative flex justify-around items-center h-16 bg-zinc-900/70 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl px-1.5 focus-within:shadow-amber-500/10">
                {navItems.map((item) => {
                    const active = isActive(item.path)
                    const Icon = item.icon

                    return (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className="relative flex flex-col items-center justify-center flex-1 h-full group"
                            aria-label={`Przejdź do: ${item.label}`}
                            aria-current={active ? 'page' : undefined}
                        >
                            {/* Active Indicator Glow */}
                            <AnimatePresence>
                                {active && (
                                    <motion.div
                                        layoutId="bottomNavGlow"
                                        className="absolute inset-1.5 bg-amber-500/10 rounded-2xl border border-amber-500/20 shadow-lg shadow-amber-500/5"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </AnimatePresence>

                            <div className={`relative z-10 flex flex-col items-center justify-center gap-1 transition-all duration-300 ${active ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
                                <motion.div animate={{ y: active ? -2 : 2 }}>
                                    <Icon
                                        size={active ? 20 : 22}
                                        strokeWidth={active ? 2.5 : 2}
                                    />
                                </motion.div>
                                <AnimatePresence>
                                    {active && (
                                        <motion.span 
                                            initial={{ opacity: 0, height: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                            exit={{ opacity: 0, height: 0, scale: 0.8 }}
                                            className="text-[9px] font-black uppercase tracking-tight leading-none text-center px-1"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                        </button>
                    )
                })}
            </nav>
        </div>
    )
}
