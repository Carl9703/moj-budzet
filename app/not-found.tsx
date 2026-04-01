import Link from 'next/link'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6 text-center relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-md w-full relative">
                {/* Card */}
                <div className="rounded-3xl bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-10 shadow-2xl">
                    {/* Header Gradient Line */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent rounded-t-3xl" />

                    {/* Icon */}
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
                        <Search size={36} className="text-indigo-400" />
                    </div>

                    {/* 404 Badge */}
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest mb-4">
                        404
                    </div>

                    <h1 className="text-2xl font-black text-white mb-2 tracking-tight">
                        Nie znaleziono strony
                    </h1>
                    <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                        Strona, której szukasz, nie istnieje lub została przeniesiona.
                    </p>

                    <Link
                        href="/"
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:scale-[1.02] text-white font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 active:scale-[0.98]"
                    >
                        <Home size={16} />
                        Wróć na Dashboard
                    </Link>
                </div>
            </div>
        </div>
    )
}
