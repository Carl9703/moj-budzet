'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useDashboard } from '@/lib/hooks/useDashboard'

export function SideNavigation() {
    const router = useRouter()
    const pathname = usePathname()
    const { isAuthenticated } = useAuth()
    const { data: dashboardData } = useDashboard()

    const handleLogout = () => {
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        router.push('/auth/signin')
    }

    const navItems = [
        { label: 'Pulpit', path: '/', icon: '📊' },
        { label: 'Transakcje', path: '/history', icon: '💳' },
        { label: 'Ustawienia', path: '/config', icon: '⚙️' },
        { label: 'Analizy', path: '/analytics', icon: '📈' },
        { label: 'Archiwum', path: '/archive', icon: '📁' }
    ]

    const isActive = (path: string) => path === '/' ? pathname === '/' : pathname.startsWith(path)

    return (
        <aside className="fixed top-0 bottom-0 left-0 w-64 hidden md:flex flex-col bg-slate-900 border-r border-slate-800 z-10 transition-all duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-800">
                <div onClick={() => router.push('/')} className="cursor-pointer group">
                    <h1 className="text-2xl font-bold m-0 bg-gradient-to-br from-indigo-400 to-cyan-400 bg-clip-text text-transparent leading-tight group-hover:opacity-90 transition-opacity">
                        Quantum
                    </h1>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold group-hover:text-slate-400 transition-colors">
                        System Budżetowy
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
                {navItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        aria-label={item.label}
                        aria-current={isActive(item.path) ? 'page' : undefined}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left focus:outline-none focus:ring-2 focus:ring-indigo-400 ${isActive(item.path)
                            ? 'bg-indigo-600 text-slate-100 font-semibold shadow-md'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            }`}
                    >
                        <span className="text-xl">{item.icon}</span>
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800">
                <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 mb-2">
                    <div className="mb-3">
                        <p className="text-xs text-indigo-400 font-bold uppercase mb-1">Konto główne</p>
                        <p className="text-xl font-bold text-slate-100">
                            {isAuthenticated && dashboardData?.balance?.toFixed(2) || '0.00'} PLN
                        </p>
                    </div>
                    <div className="mb-3">
                        <p className="text-xs text-indigo-400 font-bold uppercase mb-1">Wolne Środki</p>
                        <p className="text-xl font-bold text-slate-100">
                            {isAuthenticated && dashboardData?.yearlyEnvelopes?.find(e => e.name.toLowerCase().includes('wolne środki'))?.current?.toFixed(2) || '0.00'} PLN
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Fundusz Awaryjny</p>
                        <p className="text-sm font-bold text-slate-300">
                            {isAuthenticated && dashboardData?.monthlyEnvelopes?.find(e => e.name === 'Fundusz Awaryjny')?.current?.toFixed(2) || dashboardData?.yearlyEnvelopes?.find(e => e.name === 'Fundusz Awaryjny')?.current?.toFixed(2) || '0.00'} PLN
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm font-medium text-rose-400 transition-all hover:bg-rose-500 hover:text-white hover:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                    <span className="text-base">🚪</span>
                    <span>Wyloguj</span>
                </button>
            </div>
        </aside>
    )
}
