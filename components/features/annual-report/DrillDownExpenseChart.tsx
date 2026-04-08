'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DonutChart } from '@tremor/react'
import { GroupBreakdown } from '@/lib/api/annual-report'
import { PieChart as PieChartIcon, ChevronRight, ArrowLeft } from 'lucide-react'
import { formatMoneyWithSeparators } from '@/lib/utils/money'

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

const TREMOR_COLORS = [
    'amber', 'pink', 'emerald', 'amber', 'violet',
    'cyan', 'rose', 'blue', 'fuchsia', 'lime',
    'teal', 'orange', 'purple', 'green', 'yellow'
]

// To match background bar colors with Tremor's standard equivalents
const CSS_COLORS = [
    '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#e11d48', '#3b82f6', '#d946ef', '#84cc16',
    '#14b8a6', '#f97316', '#a855f7', '#22c55e', '#eab308',
]

export function DrillDownExpenseChart({
    groups,
    totalExpenses,
    onSelectEnvelope,
    onSelectCategory
}: DrillDownExpenseChartProps) {
    const [drillLevel, setDrillLevel] = useState<DrillLevel>('groups')
    const [selectedGroup, setSelectedGroup] = useState<GroupBreakdown | null>(null)
    const [selectedEnvelope, setSelectedEnvelope] = useState<any | null>(null)

    // Compute chart data based on drill level
    const chartData = useMemo(() => {
        if (drillLevel === 'groups') {
            return groups
                .filter(g => g.totalAmount > 0)
                .sort((a, b) => b.totalAmount - a.totalAmount)
                .map(g => ({
                    name: g.groupName,
                    value: g.totalAmount,
                    original: g
                }))
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
        if (selectedGroup) {
            items.push({ label: selectedGroup.groupName, level: 'envelopes', data: selectedGroup })
        }
        if (selectedEnvelope) {
            items.push({ label: selectedEnvelope.envelopeName, level: 'categories', data: selectedEnvelope })
        }
        return items
    }, [selectedGroup, selectedEnvelope])

    const handleSegmentClick = (dataBlock: any) => {
        if (!dataBlock || !dataBlock.original) return

        if (drillLevel === 'groups') {
            setSelectedGroup(dataBlock.original)
            setDrillLevel('envelopes')
        } else if (drillLevel === 'envelopes') {
            if (dataBlock.original.categories && dataBlock.original.categories.length > 0) {
                setSelectedEnvelope(dataBlock.original)
                setDrillLevel('categories')
                onSelectEnvelope?.(dataBlock.original.envelopeId)
            }
        } else if (drillLevel === 'categories') {
            onSelectCategory?.(dataBlock.original.categoryId)
        }
    }

    const handleTremorChartClick = (v: any) => {
        if (v && v.name) {
            const matchedData = chartData.find((item: any) => item.name === v.name)
            if (matchedData) {
                handleSegmentClick(matchedData)
            }
        }
    }

    const handleBreadcrumbClick = (item: BreadcrumbItem) => {
        if (item.level === 'groups') {
            setDrillLevel('groups')
            setSelectedGroup(null)
            setSelectedEnvelope(null)
            onSelectEnvelope?.(null)
            onSelectCategory?.(null)
        } else if (item.level === 'envelopes') {
            setDrillLevel('envelopes')
            setSelectedEnvelope(null)
            onSelectCategory?.(null)
        }
    }

    const handleBack = () => {
        if (drillLevel === 'categories') {
            setDrillLevel('envelopes')
            setSelectedEnvelope(null)
            onSelectCategory?.(null)
        } else if (drillLevel === 'envelopes') {
            setDrillLevel('groups')
            setSelectedGroup(null)
            onSelectEnvelope?.(null)
            onSelectCategory?.(null)
        }
    }

    const getLevelTitle = () => {
        if (drillLevel === 'groups') return 'Podział wg Grup'
        if (drillLevel === 'envelopes') return `Koperty w: ${selectedGroup?.groupName}`
        if (drillLevel === 'categories') return `Kategorie w: ${selectedEnvelope?.envelopeName}`
        return 'Podział Wydatków'
    }

    const canDrillDown = drillLevel !== 'categories'

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group p-6 rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-xl relative overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    {drillLevel !== 'groups' && (
                        <button
                            onClick={handleBack}
                            className="p-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                            {getLevelTitle()}
                        </h2>
                        <p className="text-xs text-zinc-500">
                            {canDrillDown ? 'Kliknij element aby zobaczyć szczegóły' : 'Najniższy poziom szczegółowości'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Suma z grupy</div>
                    <div className="text-xl font-bold text-white">{formatMoneyWithSeparators(currentTotal)}</div>
                </div>
            </div>

            {/* Breadcrumbs */}
            <AnimatePresence>
                {breadcrumbs.length > 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 mb-6 text-xs bg-zinc-800/30 p-2 rounded-lg border border-zinc-700/30 w-fit"
                    >
                        {breadcrumbs.map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                                {index > 0 && <ChevronRight size={12} className="text-zinc-600" />}
                                <button
                                    onClick={() => handleBreadcrumbClick(item)}
                                    className={`transition-colors px-2 py-1 rounded-md ${index === breadcrumbs.length - 1
                                        ? 'bg-amber-500/15 text-amber-300 font-medium cursor-default pointer-events-none'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                                        }`}
                                    disabled={index === breadcrumbs.length - 1}
                                >
                                    {item.label}
                                </button>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chart + custom BarList Side by Side */}
            <motion.div
                key={drillLevel + selectedGroup?.groupName + selectedEnvelope?.envelopeName}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                {chartData.length > 0 ? (
                    <div className="flex flex-col lg:flex-row items-center gap-8 mt-4">
                        {/* Chart */}
                        <div className="w-full lg:w-1/2 flex justify-center items-center">
                            <DonutChart
                                data={chartData}
                                category="value"
                                index="name"
                                valueFormatter={(number: number) => formatMoneyWithSeparators(number)}
                                colors={TREMOR_COLORS}
                                variant="donut"
                                className="h-64 sm:h-72 w-full font-medium"
                                showAnimation={true}
                                animationDuration={800}
                                onValueChange={canDrillDown ? handleTremorChartClick : undefined}
                            />
                        </div>

                        {/* Custom BarList Legend */}
                        <div className="w-full lg:w-1/2 flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {chartData.map((entry: any, index: number) => {
                                const percentage = currentTotal > 0 ? ((entry.value / currentTotal) * 100) : 0
                                return (
                                    <button
                                        key={entry.name}
                                        onClick={() => canDrillDown && handleSegmentClick(entry)}
                                        disabled={!canDrillDown}
                                        className={`group relative flex items-center justify-between p-3 rounded-xl border border-white/5 bg-zinc-900/40 overflow-hidden text-left transition-all ${canDrillDown ? 'hover:bg-zinc-800 hover:border-white/10 cursor-pointer active:scale-[0.98]' : 'cursor-default'}`}
                                    >
                                        {/* Background Progress Bar */}
                                        <div
                                            className="absolute inset-y-0 left-0 opacity-20 pointer-events-none transition-all duration-1000 ease-out"
                                            style={{
                                                width: `${percentage}%`,
                                                backgroundColor: CSS_COLORS[index % CSS_COLORS.length]
                                            }}
                                        />

                                        {/* Content */}
                                        <div className="flex items-center gap-3 relative z-10 w-full">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                                                style={{ backgroundColor: CSS_COLORS[index % CSS_COLORS.length] }}
                                            />
                                            <div className="flex justify-between w-full items-center gap-4">
                                                <span className="text-sm font-medium text-zinc-200 truncate pr-4">
                                                    {entry.name}
                                                </span>
                                                <div className="flex gap-4 items-center shrink-0">
                                                    <span className="text-sm font-bold text-white tabular-nums tracking-tight">
                                                        {formatMoneyWithSeparators(entry.value)}
                                                    </span>
                                                    <span className="text-xs text-zinc-400 font-medium tabular-nums min-w-[40px] text-right">
                                                        {percentage.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-16 text-zinc-400">
                        <PieChartIcon size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="font-medium">Brak danych do wyświetlenia dla wybranej grupy</p>
                    </div>
                )}
            </motion.div>
        </motion.div>
    )
}
