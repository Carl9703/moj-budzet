'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { GroupBreakdown } from '@/lib/api/annual-report'
import { PieChart as PieChartIcon, ChevronRight, ArrowLeft } from 'lucide-react'
import { formatMoneyWithSeparators } from '@/lib/utils/money'
import { CHART_PALETTE, CHART_PALETTE_GLOW, GROUP_COLORS, TOOLTIP_STYLE } from '@/lib/constants/chart-colors'

interface DrillDownExpenseChartProps {
    groups: GroupBreakdown[]
    totalExpenses: number
    compareMode?: boolean
    previousGroups?: GroupBreakdown[]
    previousTotalExpenses?: number
    onSelectEnvelope?: (envelopeId: string | null) => void
    onSelectCategory?: (categoryId: string | null) => void
}

type DrillLevel = 'groups' | 'envelopes' | 'categories'

interface BreadcrumbItem {
    label: string
    level: DrillLevel
    data?: any
}

export function DrillDownExpenseChart({
    groups,
    totalExpenses,
    onSelectEnvelope,
    onSelectCategory
}: DrillDownExpenseChartProps) {
    const [drillLevel, setDrillLevel] = useState<DrillLevel>('groups')
    const [selectedGroup, setSelectedGroup] = useState<GroupBreakdown | null>(null)
    const [selectedEnvelope, setSelectedEnvelope] = useState<any | null>(null)
    const [activeIndex, setActiveIndex] = useState<number | null>(null)

    const chartData = useMemo(() => {
        if (drillLevel === 'groups') {
            return groups
                .filter(g => g.totalAmount > 0)
                .sort((a, b) => b.totalAmount - a.totalAmount)
                .map(g => ({ name: g.groupName, value: g.totalAmount, original: g }))
        }
        if (drillLevel === 'envelopes' && selectedGroup) {
            return selectedGroup.envelopes
                .filter(e => e.totalAmount > 0)
                .sort((a, b) => b.totalAmount - a.totalAmount)
                .map(e => ({
                    name: `${e.envelopeIcon || ''} ${e.envelopeName}`.trim(),
                    value: e.totalAmount,
                    original: e
                }))
        }
        if (drillLevel === 'categories' && selectedEnvelope?.categories) {
            return selectedEnvelope.categories
                .filter((c: any) => c.amount > 0)
                .sort((a: any, b: any) => b.amount - a.amount)
                .map((c: any) => ({
                    name: `${c.categoryIcon || ''} ${c.categoryName}`.trim(),
                    value: c.amount,
                    original: c
                }))
        }
        return []
    }, [drillLevel, groups, selectedGroup, selectedEnvelope])

    const currentTotal = useMemo(() => {
        if (drillLevel === 'groups') return totalExpenses
        if (drillLevel === 'envelopes' && selectedGroup) return selectedGroup.totalAmount
        if (drillLevel === 'categories' && selectedEnvelope) return selectedEnvelope.totalAmount
        return 0
    }, [drillLevel, selectedGroup, selectedEnvelope, totalExpenses])

    const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
        const items: BreadcrumbItem[] = [{ label: 'Wszystkie Grupy', level: 'groups' }]
        if (selectedGroup) items.push({ label: selectedGroup.groupName, level: 'envelopes', data: selectedGroup })
        if (selectedEnvelope) items.push({ label: selectedEnvelope.envelopeName, level: 'categories', data: selectedEnvelope })
        return items
    }, [selectedGroup, selectedEnvelope])

    const handleSegmentClick = (dataBlock: any) => {
        if (!dataBlock?.original) return
        if (drillLevel === 'groups') {
            setSelectedGroup(dataBlock.original)
            setDrillLevel('envelopes')
            setActiveIndex(null)
        } else if (drillLevel === 'envelopes') {
            if (dataBlock.original.categories?.length > 0) {
                setSelectedEnvelope(dataBlock.original)
                setDrillLevel('categories')
                onSelectEnvelope?.(dataBlock.original.envelopeId)
                setActiveIndex(null)
            }
        } else if (drillLevel === 'categories') {
            onSelectCategory?.(dataBlock.original.categoryId)
        }
    }

    const handleTremorClick = (v: any) => {
        if (v?.name) {
            const matched = chartData.find((item: { name: string; value: number; original: any }) => item.name === v.name)
            if (matched) handleSegmentClick(matched)
        }
    }

    const handleBreadcrumbClick = (item: BreadcrumbItem) => {
        if (item.level === 'groups') {
            setDrillLevel('groups'); setSelectedGroup(null); setSelectedEnvelope(null)
            onSelectEnvelope?.(null); onSelectCategory?.(null)
        } else if (item.level === 'envelopes') {
            setDrillLevel('envelopes'); setSelectedEnvelope(null)
            onSelectCategory?.(null)
        }
        setActiveIndex(null)
    }

    const handleBack = () => {
        if (drillLevel === 'categories') {
            setDrillLevel('envelopes'); setSelectedEnvelope(null); onSelectCategory?.(null)
        } else if (drillLevel === 'envelopes') {
            setDrillLevel('groups'); setSelectedGroup(null); onSelectEnvelope?.(null); onSelectCategory?.(null)
        }
        setActiveIndex(null)
    }

    const getLevelTitle = () => {
        if (drillLevel === 'groups') return 'Podział wg Grup'
        if (drillLevel === 'envelopes') return `Koperty: ${selectedGroup?.groupName}`
        if (drillLevel === 'categories') return `Kategorie: ${selectedEnvelope?.envelopeName}`
        return 'Podział Wydatków'
    }

    const getSegmentColor = (entry: any, index: number): string => {
        if (drillLevel === 'groups') {
            return GROUP_COLORS[entry.original?.groupName ?? entry.name]
                ?? GROUP_COLORS[entry.name]
                ?? CHART_PALETTE[index % CHART_PALETTE.length]
        }
        return CHART_PALETTE[index % CHART_PALETTE.length]
    }

    const canDrillDown = drillLevel !== 'categories'

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group p-5 sm:p-6 rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-xl relative overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4 gap-4">
                <div className="flex items-center gap-3">
                    {drillLevel !== 'groups' && (
                        <button
                            onClick={handleBack}
                            className="p-2 rounded-xl bg-zinc-800/60 border border-zinc-700/40 text-zinc-400 hover:text-white hover:bg-zinc-700/60 transition-all shrink-0"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    <div>
                        <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                            {getLevelTitle()}
                        </h2>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                            {canDrillDown ? 'Kliknij aby zobaczyć szczegóły' : 'Najniższy poziom szczegółowości'}
                        </p>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Suma</div>
                    <div className="text-xl font-bold text-white tabular-nums">{formatMoneyWithSeparators(currentTotal)} zł</div>
                </div>
            </div>

            {/* Breadcrumbs */}
            <AnimatePresence>
                {breadcrumbs.length > 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-center gap-1.5 mb-5 text-xs bg-zinc-800/40 px-3 py-2 rounded-xl border border-zinc-700/30 w-fit max-w-full overflow-x-auto"
                    >
                        {breadcrumbs.map((item, index) => (
                            <div key={index} className="flex items-center gap-1.5 shrink-0">
                                {index > 0 && <ChevronRight size={11} className="text-zinc-600" />}
                                <button
                                    onClick={() => handleBreadcrumbClick(item)}
                                    disabled={index === breadcrumbs.length - 1}
                                    className={`transition-colors px-1.5 py-0.5 rounded-md whitespace-nowrap ${index === breadcrumbs.length - 1
                                        ? 'text-amber-300 font-semibold cursor-default'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                                        }`}
                                >
                                    {item.label}
                                </button>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chart Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={drillLevel + selectedGroup?.groupName + selectedEnvelope?.envelopeName}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                >
                    {chartData.length > 0 ? (
                        <div className="flex flex-col lg:flex-row items-start gap-6 mt-2">
                            {/* Donut Chart */}
                            <div className="flex justify-center items-center relative w-full md:w-auto md:shrink-0">
                                <div className="h-56 sm:h-64 w-56 sm:w-64 relative mx-auto">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius="72%"
                                                outerRadius="95%"
                                                paddingAngle={2}
                                                dataKey="value"
                                                onClick={canDrillDown ? (entry: any) => handleSegmentClick(entry) : undefined}
                                                style={{ cursor: canDrillDown ? 'pointer' : 'default', outline: 'none' }}
                                                animationDuration={700}
                                                animationEasing="ease-out"
                                            >
                                                {chartData.map((entry: any, index: number) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={getSegmentColor(entry, index)}
                                                        stroke="transparent"
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: number) => [formatMoneyWithSeparators(value) + ' zł', '']}
                                                contentStyle={TOOLTIP_STYLE}
                                                itemStyle={{ color: '#e4e4e7' }}
                                                labelStyle={{ color: '#71717a', fontSize: '11px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Center label */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Suma</div>
                                        <div className="text-base font-bold text-white tabular-nums leading-tight">{formatMoneyWithSeparators(currentTotal)}</div>
                                        <div className="text-xs text-zinc-500">zł</div>
                                    </div>
                                </div>
                            </div>

                            {/* Legend List */}
                            <div className="flex-1 flex flex-col gap-1.5 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar w-full">
                                {chartData.map((entry: any, index: number) => {
                                    const pct = currentTotal > 0 ? (entry.value / currentTotal) * 100 : 0
                                    // Dla poziomu grup — użyj stałego koloru z GROUP_COLORS
                                    // Dla kopert/kategorii — użyj palety indeksowanej
                                    const color = drillLevel === 'groups'
                                        ? (GROUP_COLORS[entry.original?.groupName ?? entry.name] ?? GROUP_COLORS[entry.name] ?? CHART_PALETTE[index % CHART_PALETTE.length])
                                        : CHART_PALETTE[index % CHART_PALETTE.length]
                                    const glow = CHART_PALETTE_GLOW[index % CHART_PALETTE_GLOW.length]
                                    const isActive = activeIndex === index

                                    return (
                                        <button
                                            key={entry.name}
                                            onClick={() => canDrillDown && handleSegmentClick(entry)}
                                            onMouseEnter={() => setActiveIndex(index)}
                                            onMouseLeave={() => setActiveIndex(null)}
                                            disabled={!canDrillDown}
                                            className={`relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 overflow-hidden
                                                ${canDrillDown ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}
                                                ${isActive
                                                    ? 'border-white/10 bg-zinc-800/60'
                                                    : 'border-white/5 bg-zinc-900/30 hover:bg-zinc-800/40'
                                                }`}
                                            style={isActive ? { boxShadow: `0 0 0 1px ${color}30, 0 4px 16px ${glow}` } : {}}
                                        >
                                            {/* Progress bg */}
                                            <div
                                                className="absolute inset-y-0 left-0 pointer-events-none transition-all duration-700 ease-out rounded-l-xl"
                                                style={{ width: `${pct}%`, backgroundColor: color, opacity: isActive ? 0.12 : 0.07 }}
                                            />

                                            {/* Color dot */}
                                            <div
                                                className="w-2.5 h-2.5 rounded-full shrink-0 relative z-10 transition-all"
                                                style={{
                                                    backgroundColor: color,
                                                    boxShadow: isActive ? `0 0 8px ${color}` : 'none'
                                                }}
                                            />

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 relative z-10">
                                                <div className="text-sm font-medium text-zinc-200 truncate leading-tight">{entry.name}</div>
                                            </div>

                                            {/* Amounts */}
                                            <div className="text-right shrink-0 relative z-10">
                                                <div className="text-sm font-bold text-white tabular-nums">{formatMoneyWithSeparators(entry.value)} zł</div>
                                                <div className="text-[10px] text-zinc-500 tabular-nums">{pct.toFixed(1)}%</div>
                                            </div>

                                            {canDrillDown && (
                                                <ChevronRight size={14} className={`shrink-0 transition-all relative z-10 ${isActive ? 'text-zinc-300' : 'text-zinc-600'}`} />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-14 text-zinc-400">
                            <PieChartIcon size={40} className="mx-auto mb-3 opacity-20" />
                            <p className="font-medium text-sm">Brak danych do wyświetlenia</p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </motion.div>
    )
}
