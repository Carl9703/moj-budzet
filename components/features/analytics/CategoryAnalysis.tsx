'use client'

import { useState } from 'react'

interface TransactionDetail {
    id: string
    amount: number
    description: string
    date: string
    envelopeName: string
    envelopeIcon: string
}

interface CategoryAnalysis {
    categoryId: string
    categoryName: string
    categoryIcon: string
    totalAmount: number
    transactionCount: number
    avgTransactionAmount: number
    percentage: number
    envelopeBreakdown: {
        envelopeName: string
        envelopeIcon: string
        amount: number
        percentage: number
    }[]
    monthlyTrend: {
        month: string
        year: number
        amount: number
    }[]
    transactions: TransactionDetail[]
}

interface CategoryAnalyticsData {
    categoryAnalysis: CategoryAnalysis[]
    totalExpenses: number
    period: string
    summary: {
        totalCategories: number
        totalTransactions: number
        avgTransactionAmount: number
    }
}

interface Props {
    isLoading: boolean
    categories: CategoryAnalysis[] | undefined
    selectedPeriod: string
    onPeriodChange: (period: string) => void
    sortBy: 'amount' | 'transactions' | 'name'
    setSortBy: (value: 'amount' | 'transactions' | 'name') => void
    filterText: string
    setFilterText: (text: string) => void
    expandedCategories: Set<string>
    setExpandedCategories: (value: Set<string>) => void
    expandedTransactions: Set<string>
    setExpandedTransactions: (value: Set<string>) => void
    totalExpenses: number
    summary: {
        totalCategories: number
        totalTransactions: number
        avgTransactionAmount: number
    }
}

export function CategoryAnalysis({
    isLoading,
    categories,
    selectedPeriod,
    onPeriodChange,
    sortBy,
    setSortBy,
    filterText,
    setFilterText,
    expandedCategories,
    setExpandedCategories,
    expandedTransactions,
    setExpandedTransactions,
    totalExpenses,
    summary
}: Props) {

    const periodOptions = [
        { value: 'currentMonth', label: 'Bieżący miesiąc' },
        { value: '1month', label: 'Ostatni miesiąc' },
        { value: '3months', label: 'Ostatnie 3 miesiące' },
        { value: '6months', label: 'Ostatnie 6 miesięcy' },
        { value: 'currentYear', label: 'Bieżący rok' }
    ]

    const formatMoney = (amount: number) => amount.toLocaleString('pl-PL') + ' zł'

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const toggleCategory = (categoryId: string) => {
        const newExpanded = new Set(expandedCategories)
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId)
        } else {
            newExpanded.add(categoryId)
        }
        setExpandedCategories(newExpanded)
    }

    const toggleTransactions = (categoryId: string) => {
        const newExpanded = new Set(expandedTransactions)
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId)
        } else {
            newExpanded.add(categoryId)
        }
        setExpandedTransactions(newExpanded)
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[200px]">
                <div className="text-slate-400 text-lg flex items-center gap-2">
                    <span className="animate-spin">📊</span> Ładowanie analiz kategorii...
                </div>
            </div>
        )
    }

    if (!categories) {
        return (
            <div className="text-rose-400 p-5 text-center">
                Błąd ładowania danych kategorii
            </div>
        )
    }

    // Użyj przefiltrowanych i posortowanych kategorii z propsów
    const filteredCategories = categories

    return (
        <div className="flex flex-col gap-6">
            {/* NAGŁÓWEK Z FILTROWANIEM */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shadow-inner border border-white/5">
                            <span className="text-xl">📊</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-widest">Wydatki wg kategorii</h2>
                            <p className="text-xs text-slate-500 font-medium">Analiza dystrybucji wydatków w czasie</p>
                        </div>
                    </div>

                    {/* SELECTOR OKRESU */}
                    <div className="relative w-full md:w-auto">
                        <select
                            value={selectedPeriod}
                            onChange={(e) => onPeriodChange(e.target.value)}
                            className="w-full md:w-auto px-5 py-3 bg-slate-950/50 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white appearance-none cursor-pointer focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner pr-12"
                        >
                            {periodOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label.toUpperCase()}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">
                            ▼
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
                    {/* Wyszukiwanie */}
                    <div className="relative flex-1 w-full">
                        <input
                            type="text"
                            placeholder="SZUKAJ KATEGORII..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="w-full px-5 py-3 bg-slate-950/50 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner"
                        />
                    </div>

                    {/* Sortowanie */}
                    <div className="relative w-full sm:w-auto">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'amount' | 'transactions' | 'name')}
                            className="w-full sm:w-auto px-5 py-3 bg-slate-950/50 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white appearance-none cursor-pointer focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner pr-12"
                        >
                            <option value="amount">SORTUJ: KWOTA</option>
                            <option value="transactions">SORTUJ: TRANSAKCJE</option>
                            <option value="name">SORTUJ: NAZWA</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">
                            ▼
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/5 pt-6">
                    <div className="text-center px-4 py-5 bg-slate-950/30 rounded-2xl border border-white/5 shadow-inner">
                        <div className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Aktywne Kategorie</div>
                        <div className="text-2xl font-black text-indigo-400 tracking-tighter">
                            {summary.totalCategories}
                        </div>
                    </div>
                    <div className="text-center px-4 py-5 bg-slate-950/30 rounded-2xl border border-white/5 shadow-inner">
                        <div className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Suma Wydatków</div>
                        <div className="text-2xl font-black text-rose-400 tracking-tighter">
                            {formatMoney(totalExpenses)}
                        </div>
                    </div>
                    <div className="text-center px-4 py-5 bg-slate-950/30 rounded-2xl border border-white/5 shadow-inner">
                        <div className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Średnia Operacja</div>
                        <div className="text-2xl font-black text-emerald-400 tracking-tighter">
                            {formatMoney(summary.avgTransactionAmount)}
                        </div>
                    </div>
                </div>
            </div>

            {/* LISTA KATEGORII */}
            <div className="flex flex-col gap-3">
                {filteredCategories.map((category, index) => {
                    const isExpanded = expandedCategories.has(category.categoryId)
                    const hasExpenses = category.totalAmount > 0

                    return (
                        <div key={category.categoryId} className={`
                            border transition-all rounded-3xl overflow-hidden
                            ${hasExpenses ? 'bg-slate-900/50 border-white/5 shadow-xl' : 'bg-slate-900/20 border-white/5 opacity-50'}
                        `}>
                            {/* GŁÓWNY RZĄD KATEGORII */}
                            <div
                                onClick={() => hasExpenses && toggleCategory(category.categoryId)}
                                className={`
                                    p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors
                                    ${hasExpenses ? 'cursor-pointer hover:bg-slate-800/50' : 'cursor-default'}
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-950/50 flex items-center justify-center text-2xl shadow-inner border border-white/5">
                                        {category.categoryIcon}
                                    </div>
                                    <div>
                                        <div className="text-base font-black text-slate-100 tracking-tight">
                                            {category.categoryName}
                                        </div>
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            {hasExpenses
                                                ? `${category.transactionCount} TRANSAKCJI • ŚR. ${formatMoney(category.avgTransactionAmount)}`
                                                : 'BRAK WYDATKÓW W TYM OKRESIE'
                                            }
                                        </div>
                                    </div>
                                </div>

                                {hasExpenses && (
                                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                                        <div className="text-left sm:text-right">
                                            <div className="text-xl font-black text-rose-400 tracking-tight">
                                                {formatMoney(category.totalAmount)}
                                            </div>
                                            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                {category.percentage}% CAŁOŚCI
                                            </div>
                                        </div>
                                        <div className={`text-slate-500 transition-transform duration-300 text-[10px] ${isExpanded ? 'rotate-180' : ''}`}>
                                            ▼
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* SZCZEGÓŁY KATEGORII */}
                            {isExpanded && hasExpenses && (
                                <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                                    {/* BREAKDOWN KOPERT */}
                                    {category.envelopeBreakdown.length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="text-sm font-semibold mb-2 text-slate-200 flex items-center gap-2">
                                                📦 Wydatki według kopert:
                                            </h4>
                                            <div className="flex flex-col gap-1.5">
                                                {category.envelopeBreakdown.map((envelope) => (
                                                    <div key={envelope.envelopeName} className="flex justify-between items-center p-2.5 bg-slate-950 rounded-lg text-sm border border-slate-800/50">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-base">{envelope.envelopeIcon}</span>
                                                            <span className="font-medium text-slate-300">{envelope.envelopeName}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-rose-400 font-semibold">
                                                                {formatMoney(envelope.amount)}
                                                            </span>
                                                            <span className="text-xs text-slate-500 min-w-[32px] text-right">
                                                                {envelope.percentage}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* TREND MIESIĘCZNY */}
                                    {category.monthlyTrend.length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="text-sm font-semibold mb-2 text-slate-200 flex items-center gap-2">
                                                📈 Trend miesięczny:
                                            </h4>
                                            <div className="flex flex-col gap-1">
                                                {category.monthlyTrend.slice(-6).map((month, i) => (
                                                    <div key={`${month.year}-${month.month}`} className="flex justify-between items-center px-3 py-1.5 bg-slate-950/50 rounded text-xs text-slate-400">
                                                        <span>
                                                            {month.month} {month.year}
                                                        </span>
                                                        <span className="text-rose-400 font-semibold">
                                                            {formatMoney(month.amount)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* SZCZEGÓŁY TRANSAKCJI */}
                                    {category.transactions.length > 0 && (
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2 m-0">
                                                    💳 Szczegóły transakcji:
                                                </h4>
                                                <button
                                                    onClick={() => toggleTransactions(category.categoryId)}
                                                    className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-colors"
                                                >
                                                    {expandedTransactions.has(category.categoryId) ? 'Ukryj' : 'Pokaż'} transakcje
                                                </button>
                                            </div>

                                            {expandedTransactions.has(category.categoryId) && (
                                                <div className="flex flex-col gap-1">
                                                    {category.transactions.map((transaction) => (
                                                        <div key={transaction.id} className="flex justify-between items-center p-2.5 bg-slate-950 rounded-lg text-sm border border-slate-800/50">
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                <span className="text-sm shrink-0">{transaction.envelopeIcon}</span>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-medium text-slate-200 truncate">
                                                                        {transaction.description}
                                                                    </div>
                                                                    <div className="text-[11px] text-slate-500">
                                                                        {transaction.envelopeName} • {formatDate(transaction.date)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-rose-400 font-semibold text-sm pl-2 shrink-0">
                                                                {formatMoney(transaction.amount)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {filteredCategories.length === 0 && (
                <div className="text-center p-10 text-slate-500 text-base">
                    🔍 Nie znaleziono kategorii pasujących do wyszukiwania
                </div>
            )}
        </div>
    )
}
