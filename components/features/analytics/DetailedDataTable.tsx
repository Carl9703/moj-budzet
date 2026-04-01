'use client'

import { useState, useMemo } from 'react'

interface TableRow {
    name: string
    amount: number
    percentage: number
    icon: string
    comparison?: {
        previousAmount: number
        change: number
        changePercent: number
    }
}

interface DetailedDataTableProps {
    data: TableRow[]
    viewType: 'categories' | 'envelopes'
    compareMode: boolean
    loading?: boolean
    onViewTypeChange: (type: 'categories' | 'envelopes') => void
    onRowClick?: (row: TableRow) => void
}

type SortField = 'name' | 'amount' | 'percentage' | 'change'
type SortDirection = 'asc' | 'desc'

export function DetailedDataTable({
    data,
    viewType,
    compareMode,
    loading = false,
    onViewTypeChange,
    onRowClick
}: DetailedDataTableProps) {
    const [sortField, setSortField] = useState<SortField>('amount')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
    const [searchTerm, setSearchTerm] = useState('')

    const sortedData = useMemo(() => {
        const filtered = data.filter(row =>
            row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.icon.includes(searchTerm)
        )

        return filtered.sort((a, b) => {
            let aValue: number | string
            let bValue: number | string

            switch (sortField) {
                case 'name':
                    aValue = a.name.toLowerCase()
                    bValue = b.name.toLowerCase()
                    break
                case 'amount':
                    aValue = a.amount
                    bValue = b.amount
                    break
                case 'percentage':
                    aValue = a.percentage
                    bValue = b.percentage
                    break
                case 'change':
                    aValue = a.comparison?.change || 0
                    bValue = b.comparison?.change || 0
                    break
                default:
                    aValue = a.amount
                    bValue = b.amount
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue)
            }

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
            }

            return 0
        })
    }, [data, sortField, sortDirection, searchTerm])

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('desc')
        }
    }

    const formatMoney = (amount: number) => amount.toLocaleString('pl-PL') + ' zł'

    const formatChange = (change: number) => {
        const sign = change >= 0 ? '+' : ''
        return `${sign}${formatMoney(change)}`
    }

    const formatChangePercent = (percent: number) => {
        const sign = percent >= 0 ? '+' : ''
        return `${sign}${percent.toFixed(1)}%`
    }

    const getChangeColor = (change: number, isExpense: boolean = true) => {
        if (change === 0) return 'text-slate-500'
        if (isExpense) {
            return change < 0 ? 'text-emerald-400' : 'text-rose-400'
        } else {
            return change > 0 ? 'text-emerald-400' : 'text-rose-400'
        }
    }

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return '↕️'
        return sortDirection === 'asc' ? '↑' : '↓'
    }

    if (loading) {
        return (
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-md mb-6">
                <div className="flex justify-center items-center h-[200px]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
                        <div className="text-base text-slate-400">
                            Ładowanie tabeli...
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-slate-900 p-4 sm:p-6 rounded-xl border border-slate-800 shadow-md mb-6">
            {/* Nagłówek z przełącznikiem */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2 m-0">
                    📊 Szczegółowe dane
                </h3>

                {/* Przełącznik widoku */}
                <div className="flex gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 w-full sm:w-auto">
                    <button
                        onClick={() => onViewTypeChange('envelopes')}
                        className={`flex-1 sm:flex-none px-4 py-3 sm:py-2 rounded-md border-none text-sm font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0 ${viewType === 'envelopes'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-transparent text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        <span>📦</span> <span className="hidden xs:inline">Koperty</span>
                    </button>
                    <button
                        onClick={() => onViewTypeChange('categories')}
                        className={`flex-1 sm:flex-none px-4 py-3 sm:py-2 rounded-md border-none text-sm font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0 ${viewType === 'categories'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-transparent text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        <span>🏷️</span> <span className="hidden xs:inline">Kategorie</span>
                    </button>
                </div>
            </div>

            {/* Filtry i wyszukiwanie */}
            <div className="flex flex-col md:flex-row gap-4 items-center mb-5 flex-wrap">
                {/* Wyszukiwanie */}
                <div className="flex items-center gap-2 flex-1 min-w-[200px] w-full">
                    <span className="text-sm text-slate-400">🔍</span>
                    <input
                        type="text"
                        placeholder={`Szukaj ${viewType === 'envelopes' ? 'kopert' : 'kategorii'}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 px-4 py-3 sm:py-2 border border-slate-700 rounded-lg text-sm bg-slate-950 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] sm:min-h-0"
                    />
                </div>

                {/* Statystyki */}
                <div className="flex gap-4 text-xs text-slate-400 w-full md:w-auto justify-between md:justify-end">
                    <span>Znaleziono: <strong className="text-slate-200">{sortedData.length}</strong></span>
                    <span>Łącznie: <strong className="text-slate-200">{formatMoney(data.reduce((sum, item) => sum + item.amount, 0))}</strong></span>
                </div>
            </div>

            {/* Desktop Table View (Hidden on Mobile) */}
            <div className="hidden sm:block overflow-auto rounded-lg border border-slate-800">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="bg-slate-950 border-b-2 border-slate-800">
                            <th className="p-3 text-left font-semibold text-slate-200 cursor-pointer select-none hover:bg-slate-900 transition-colors" onClick={() => handleSort('name')}>
                                Nazwa {getSortIcon('name')}
                            </th>
                            <th className="p-3 text-right font-semibold text-slate-200 cursor-pointer select-none hover:bg-slate-900 transition-colors" onClick={() => handleSort('amount')}>
                                Kwota {getSortIcon('amount')}
                            </th>
                            <th className="p-3 text-right font-semibold text-slate-200 cursor-pointer select-none hover:bg-slate-900 transition-colors" onClick={() => handleSort('percentage')}>
                                % Udziału {getSortIcon('percentage')}
                            </th>
                            {compareMode && (
                                <th className="p-3 text-right font-semibold text-slate-200 cursor-pointer select-none hover:bg-slate-900 transition-colors" onClick={() => handleSort('change')}>
                                    Porównanie {getSortIcon('change')}
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((row) => (
                            <tr
                                key={row.name}
                                className={`border-b border-slate-800 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-slate-800/50' : ''}`}
                                onClick={() => onRowClick?.(row)}
                            >
                                <td className="p-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{row.icon}</span>
                                        <div>
                                            <div className="font-semibold text-slate-200">
                                                {row.name}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3 text-right font-semibold text-rose-400">
                                    {formatMoney(row.amount)}
                                </td>
                                <td className="p-3 text-right">
                                    <div className="flex items-center gap-2 justify-end">
                                        <span className="font-semibold text-slate-200">
                                            {row.percentage}%
                                        </span>
                                        <div className="w-[60px] h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                                                style={{ width: `${row.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                {compareMode && row.comparison && (
                                    <td className="p-3 text-right">
                                        <div className="flex flex-col items-end gap-0.5">
                                            <div className="text-xs text-slate-500">
                                                vs. poprzedni okres
                                            </div>
                                            <div className={`flex items-center gap-1 text-sm font-semibold ${getChangeColor(row.comparison.change, true)}`}>
                                                <span>{row.comparison.change > 0 ? '📈' : row.comparison.change < 0 ? '📉' : '➡️'}</span>
                                                <span>{formatChange(row.comparison.change)}</span>
                                                <span className="text-xs opacity-80">({formatChangePercent(row.comparison.changePercent)})</span>
                                            </div>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View (Hidden on Desktop) */}
            <div className="flex flex-col gap-3 sm:hidden">
                {sortedData.map((row) => (
                    <div
                        key={row.name}
                        onClick={() => onRowClick?.(row)}
                        className={`bg-slate-950 p-4 rounded-xl border border-slate-800 ${onRowClick ? 'active:bg-slate-900 touch-manipulation' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{row.icon}</span>
                                <div>
                                    <div className="font-semibold text-slate-100 text-lg">
                                        {row.name}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                                            {row.percentage}% udziału
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-bold text-rose-400">
                                    {formatMoney(row.amount)}
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar Row */}
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mb-3">
                            <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${row.percentage}%` }}
                            />
                        </div>

                        {/* Comparison Row Mobile */}
                        {compareMode && row.comparison && (
                            <div className="pt-3 border-t border-slate-900 flex justify-between items-center text-sm">
                                <span className="text-slate-500">Vs. poprzedni okres:</span>
                                <div className={`flex items-center gap-1 font-medium ${getChangeColor(row.comparison.change, true)}`}>
                                    <span>{row.comparison.change > 0 ? '📈' : row.comparison.change < 0 ? '📉' : '➡️'}</span>
                                    <span>{formatChange(row.comparison.change)}</span>
                                    <span className="opacity-80">({formatChangePercent(row.comparison.changePercent)})</span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Podsumowanie */}
            {sortedData.length > 0 && (
                <div className="mt-4 p-4 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <div className="p-2 sm:p-0">
                            <div className="text-xs text-slate-500 mb-1">
                                Łączna kwota
                            </div>
                            <div className="text-base font-bold text-rose-400">
                                {formatMoney(sortedData.reduce((sum, item) => sum + item.amount, 0))}
                            </div>
                        </div>
                        <div className="p-2 sm:p-0 border-t xs:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
                            <div className="text-xs text-slate-500 mb-1">
                                Liczba pozycji
                            </div>
                            <div className="text-base font-bold text-indigo-400">
                                {sortedData.length}
                            </div>
                        </div>
                        <div className="p-2 sm:p-0 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
                            <div className="text-xs text-slate-500 mb-1">
                                Średnia kwota
                            </div>
                            <div className="text-base font-bold text-emerald-400">
                                {formatMoney(sortedData.reduce((sum, item) => sum + item.amount, 0) / sortedData.length)}
                            </div>
                        </div>
                        {compareMode && (
                            <div className="p-2 sm:p-0 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
                                <div className="text-xs text-slate-500 mb-1">
                                    Zmiana łącznie
                                </div>
                                <div className={`text-base font-bold ${sortedData.reduce((sum, item) => sum + (item.comparison?.change || 0), 0) >= 0
                                    ? 'text-rose-400'
                                    : 'text-emerald-400'
                                    }`}>
                                    {formatChange(sortedData.reduce((sum, item) => sum + (item.comparison?.change || 0), 0))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Brak danych */}
            {sortedData.length === 0 && (
                <div className="text-center p-10 text-slate-500">
                    <div className="text-5xl mb-4">📊</div>
                    <div className="text-lg font-semibold mb-2 text-slate-300">
                        Brak danych do wyświetlenia
                    </div>
                    <div className="text-sm">
                        {searchTerm ? 'Spróbuj zmienić kryteria wyszukiwania' : 'Dodaj transakcje w wybranym okresie'}
                    </div>
                </div>
            )}
        </div>
    )
}
