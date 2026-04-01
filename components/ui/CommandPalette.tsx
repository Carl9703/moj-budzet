'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { Search, LayoutDashboard, LineChart, LayoutList, Settings, Landmark, PlusCircle, ArrowRightLeft } from 'lucide-react'

// Modal styles for the custom cmdk overriding default behavior to match our dark glassmorphism
import './cmdk.css'

export function CommandPalette() {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    // Toggle the menu when ⌘K is pressed
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [])

    const runCommand = (command: () => void) => {
        setOpen(false)
        command()
    }

    if (!open) return null

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4"
        >
            <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col cmdk-root">
                <div className="flex items-center border-b border-white/5 px-4">
                    <Search className="w-5 h-5 text-slate-400 mr-2" />
                    <Command.Input
                        autoFocus
                        placeholder="Szukaj akcji lub widoku (np. 'dodaj')"
                        className="flex-1 bg-transparent py-4 text-base tracking-wide text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-0"
                    />
                    <div className="text-[10px] text-slate-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded font-mono uppercase tracking-widest hidden sm:block">
                        ESC aby zamknąć
                    </div>
                </div>

                <Command.List className="max-h-[350px] overflow-y-auto px-2 py-2 cmdk-list">
                    <Command.Empty className="py-12 px-4 text-center text-sm text-slate-500">
                        Nie znaleziono pasujących opcji.
                    </Command.Empty>

                    <Command.Group heading="Nawigacja" className="cmdk-group">
                        <Command.Item
                            onSelect={() => runCommand(() => router.push('/'))}
                            className="cmdk-item flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-300 aria-selected:bg-indigo-500/10 aria-selected:text-white cursor-pointer transition-colors"
                        >
                            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg"><LayoutDashboard size={14} /></div>
                            Pulpit główny
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => router.push('/analytics'))}
                            className="cmdk-item flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-300 aria-selected:bg-indigo-500/10 aria-selected:text-white cursor-pointer transition-colors"
                        >
                            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg"><LineChart size={14} /></div>
                            Analizy finansowe
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => router.push('/transactions'))}
                            className="cmdk-item flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-300 aria-selected:bg-indigo-500/10 aria-selected:text-white cursor-pointer transition-colors"
                        >
                            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg"><LayoutList size={14} /></div>
                            Ostatnie transakcje
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => router.push('/investments'))}
                            className="cmdk-item flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-300 aria-selected:bg-indigo-500/10 aria-selected:text-white cursor-pointer transition-colors"
                        >
                            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg"><Landmark size={14} /></div>
                            Portfel Inwestycyjny
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => router.push('/config'))}
                            className="cmdk-item flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-300 aria-selected:bg-indigo-500/10 aria-selected:text-white cursor-pointer transition-colors"
                        >
                            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg"><Settings size={14} /></div>
                            Ustawienia Systemowe
                        </Command.Item>
                    </Command.Group>

                    <Command.Separator className="h-px bg-white/5 my-2" />

                    <Command.Group heading="Szybkie Akcje" className="cmdk-group">
                        <Command.Item
                            onSelect={() => runCommand(() => router.push('/?action=addExpense'))}
                            className="cmdk-item flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium text-slate-300 aria-selected:bg-rose-500/10 aria-selected:text-white cursor-pointer transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg"><PlusCircle size={14} /></div>
                                Dodaj wydatek (zmniejsz kopertę)
                            </div>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => router.push('/?action=addIncome'))}
                            className="cmdk-item flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium text-slate-300 aria-selected:bg-emerald-500/10 aria-selected:text-white cursor-pointer transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><PlusCircle size={14} /></div>
                                Dodaj dochód (zasil wolne środki)
                            </div>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => router.push('/?action=addTransfer'))}
                            className="cmdk-item flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium text-slate-300 aria-selected:bg-amber-500/10 aria-selected:text-white cursor-pointer transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg"><ArrowRightLeft size={14} /></div>
                                Transfer między kopertami
                            </div>
                        </Command.Item>
                    </Command.Group>
                </Command.List>
            </div>
        </Command.Dialog>
    )
}
