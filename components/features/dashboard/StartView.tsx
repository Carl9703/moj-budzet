'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { ActionsCenter } from './ActionsCenter'
import { SectionErrorBoundary } from '@/components/ui/feedback/SectionErrorBoundary'

import { useQuery } from '@tanstack/react-query'
import { fetchDashboardData, DashboardResponse } from '@/lib/api/dashboard'
import { DashboardSkeleton } from '@/components/ui/SkeletonLoader'

export function StartView() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['dashboard'],
        queryFn: async () => {
            const result = await fetchDashboardData()
            // api.client returns just the data, so result IS the data (DashboardResponse)
            // But let's verify if authorizedFetch wrap returns response or data.
            // authorizedFetch returns response. api.get returns T.
            // My api client implementation returns response.json() typed as T.
            return result
        }
    })

    if (isLoading) return <DashboardSkeleton />
    if (error || !data) return (
        <div className="flex justify-center items-center h-96 bg-slate-800 rounded-xl text-slate-400">
            <p>Błąd ładowania danych</p>
        </div>
    )

    const balance = data.mainBalance || 0
    const isPositive = balance >= 0

    return (
        <div className="flex flex-col gap-4">
            {/* CENTRUM AKCJI */}
            <SectionErrorBoundary>
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 shadow-lg border border-white/10 relative overflow-hidden mt-4">
                    <div className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px] opacity-30" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <h1 className="text-base font-bold text-white">🎯 Centrum Akcji</h1>
                            <span className="text-2xl opacity-80">⚡</span>
                        </div>
                        <ActionsCenter />
                    </div>
                </div>
            </SectionErrorBoundary>

            {/* GŁÓWNE INFORMACJE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[400px]">
                {/* KONTO GŁÓWNE */}
                <SectionErrorBoundary>
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-500" />
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h2 className="text-lg font-bold text-slate-100">💰 Konto główne</h2>
                                <p className="text-sm text-slate-400">Saldo dostępne</p>
                            </div>
                            <span className="text-5xl opacity-60">💳</span>
                        </div>
                        <div className={`text-3xl font-bold mb-4 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>{balance.toFixed(2)} zł</div>
                        <div className="flex items-center gap-3 p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                            <span className="text-2xl">💎</span>
                            <div className="flex-1">
                                <div className="text-base font-semibold text-slate-100">Wolne środki</div>
                                <div className="text-sm text-slate-400">Dostępne do wydania</div>
                            </div>
                            <div className="text-xl font-bold text-indigo-400">
                                {(data.yearlyEnvelopes?.find(e => e.name.toLowerCase().includes('wolne środki'))?.current || 0).toFixed(2)} zł
                            </div>
                        </div>
                    </div>
                </SectionErrorBoundary>

                {/* STATUS MIESIĄCA */}
                <SectionErrorBoundary>
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h2 className="text-lg font-bold text-slate-100">📊 Status miesiąca</h2>
                                <p className="text-sm text-slate-400">Analiza finansowa</p>
                            </div>
                            <span className="text-5xl opacity-60">📈</span>
                        </div>

                        {/* Przychody i Wydatki */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white"><TrendingUp size={20} /></div>
                                <div>
                                    <div className="text-sm text-emerald-400 font-medium">Przychody</div>
                                    <div className="text-lg font-bold text-emerald-300">+{data.monthlyIncome.toFixed(2)} zł</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-rose-500/10 rounded-lg border border-rose-500/20">
                                <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white"><TrendingDown size={20} /></div>
                                <div>
                                    <div className="text-sm text-rose-400 font-medium">Wydatki</div>
                                    <div className="text-lg font-bold text-rose-300">{data.monthlyExpenses.toFixed(2)} zł</div>
                                </div>
                            </div>
                        </div>

                        {/* Bilans i Oszczędności */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="p-3 bg-slate-700 rounded-lg border border-slate-600 text-center">
                                <div className="text-sm text-slate-400 font-medium mb-1">Bilans</div>
                                <div className={`text-xl font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>{balance.toFixed(2)} zł</div>
                            </div>
                            <div className="p-3 bg-slate-700 rounded-lg border border-slate-600 text-center">
                                <div className="text-sm text-slate-400 font-medium mb-1">Oszczędności</div>
                                <div className={`text-xl font-bold ${data.savingsRate >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{data.savingsRate.toFixed(1)}%</div>
                            </div>
                        </div>

                        {/* Postęp miesiąca */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-400 font-medium">📅 Do końca miesiąca: {data.daysRemaining} dni</span>
                                <span className={`text-sm font-semibold ${data.dailyBudget >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>Dzienny budżet: {data.dailyBudget.toFixed(0)} zł</span>
                            </div>
                            <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-500" style={{ width: `${(data.monthProgress / data.totalDays) * 100}%` }} />
                            </div>
                            <div className="text-center mt-2 text-sm text-slate-400 font-medium">
                                {data.monthProgress}/{data.totalDays} dni ({Math.round((data.monthProgress / data.totalDays) * 100)}%)
                            </div>
                        </div>
                    </div>
                </SectionErrorBoundary>
            </div>
        </div>
    )
}
