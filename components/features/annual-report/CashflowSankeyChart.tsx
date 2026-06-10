'use client'

import React, { useMemo } from 'react'
import { Sankey, Tooltip, Layer, Rectangle } from 'recharts'
import { formatMoney } from '@/lib/utils/money'
import { motion } from 'framer-motion'

interface CashflowSankeyChartProps {
    incomeSources: any[]
    expenseGroups: any[]
    summary: any
}

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
    constructor(props: any) {
        super(props)
        this.state = { hasError: false, error: null }
    }
    static getDerivedStateFromError(error: any) {
        return { hasError: true, error }
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="h-[400px] flex flex-col items-center justify-center text-rose-500 text-sm overflow-auto">
                    <p className="font-bold">Błąd renderowania wykresu</p>
                    <pre className="mt-4 text-xs text-left text-rose-400/80">
                        {this.state.error?.toString()}
                    </pre>
                </div>
            )
        }
        return this.props.children
    }
}

export function CashflowSankeyChart({ incomeSources, expenseGroups, summary }: CashflowSankeyChartProps) {
    
    const data = useMemo(() => {
        const nodes: { name: string, category?: string, displayName?: string }[] = []
        const links: { source: number, target: number, value: number }[] = []

        // Helper to get or add node
        const getNodeIndex = (name: string, category: string = 'other') => {
            const uniqueName = `${name} (${category})` // unique name required by recharts
            const index = nodes.findIndex(n => n.name === uniqueName)
            if (index !== -1) return index
            nodes.push({ name: uniqueName, displayName: name, category })
            return nodes.length - 1
        }

        const budgetNode = getNodeIndex('Budżet', 'budget')

        // 1. Income to Budget
        let totalIncomeLinked = 0
        incomeSources.forEach(inc => {
            if (inc.total > 0) {
                const nodeIdx = getNodeIndex(inc.source || 'Inne Przychody', 'income')
                links.push({ source: nodeIdx, target: budgetNode, value: inc.total })
                totalIncomeLinked += inc.total
            }
        })

        // Handle Deficit
        if (summary.expenses > totalIncomeLinked && summary.expenses > 0) {
            const deficitNode = getNodeIndex('Z oszczędności', 'income')
            links.push({ source: deficitNode, target: budgetNode, value: summary.expenses - totalIncomeLinked })
            totalIncomeLinked = summary.expenses
        }

        // 2. Budget to Expense Groups
        let totalExpensesLinked = 0
        expenseGroups.forEach(group => {
            if (group.totalAmount > 0) {
                const groupNode = getNodeIndex(group.groupName || 'Inne Wydatki', 'expense')
                links.push({ source: budgetNode, target: groupNode, value: group.totalAmount })
                totalExpensesLinked += group.totalAmount

                // 3. Expense Groups to Envelopes
                group.envelopes?.forEach((env: any) => {
                    if (env.totalAmount > 0) {
                        const envNode = getNodeIndex(env.envelopeName, 'envelope')
                        links.push({ source: groupNode, target: envNode, value: env.totalAmount })
                    }
                })
            }
        })

        // Handle Unspent (Savings)
        if (totalIncomeLinked > totalExpensesLinked) {
            const savingsNode = getNodeIndex('Niewydane / Oszczędności', 'savings')
            links.push({ source: budgetNode, target: savingsNode, value: totalIncomeLinked - totalExpensesLinked })
        }

        return { nodes, links }
    }, [incomeSources, expenseGroups, summary])

    if (!data.nodes.length || !data.links.length) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center text-zinc-500 text-sm overflow-auto">
                <p>Brak danych przepływów</p>
                <pre className="mt-4 text-xs text-left text-zinc-600">
                    {JSON.stringify({ 
                        incomeSources: incomeSources?.length, 
                        expenseGroups: expenseGroups?.length, 
                        summary, 
                        nodes: data.nodes.length, 
                        links: data.links.length 
                    }, null, 2)}
                </pre>
            </div>
        )
    }

    const CustomNode = (props: any) => {
        const { x, y, width, height, index, payload } = props;
        if (typeof x !== 'number' || typeof y !== 'number' || typeof width !== 'number' || typeof height !== 'number') return null;

        const isBudget = payload.category === 'budget'
        const isIncome = payload.category === 'income'
        const isSavings = payload.category === 'savings'
        
        let fill = '#52525b' // zinc-600
        if (isBudget) fill = '#f59e0b' // amber-500
        else if (isIncome) fill = '#10b981' // emerald-500
        else if (isSavings) fill = '#3b82f6' // blue-500
        else fill = '#f43f5e' // rose-500

        return (
            <Layer key={`CustomNode${index}`}>
                <Rectangle
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={fill}
                    fillOpacity={0.8}
                    rx={4}
                />
                <text
                    textAnchor={x < 400 ? 'start' : 'end'}
                    x={x < 400 ? x + width + 8 : x - 8}
                    y={y + height / 2}
                    dy={4}
                    fontSize="12"
                    fill="#a1a1aa" // zinc-400
                    fontWeight={700}
                >
                    {payload.displayName || payload.name} ({formatMoney(payload.value, false)})
                </text>
            </Layer>
        );
    };

    const CustomLink = (props: any) => {
        const { sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, index } = props;
        if (typeof sourceX !== 'number' || typeof targetX !== 'number' || typeof sourceY !== 'number' || typeof targetY !== 'number') return null;
        
        return (
            <path
                d={`
                    M${sourceX},${sourceY}
                    C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
                `}
                stroke="#3f3f46" // zinc-700
                strokeWidth={Math.max(linkWidth || 0, 2)}
                fill="none"
                strokeOpacity={0.4}
                className="transition-all duration-300 hover:stroke-amber-500/50 hover:stroke-opacity-80"
            />
        );
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="bg-zinc-900 border border-white/10 p-3 rounded-xl shadow-xl backdrop-blur-xl">
                    <p className="text-zinc-300 font-bold text-sm">
                        {data.source?.payload?.displayName || data.source?.name} → {data.target?.payload?.displayName || data.target?.name}
                    </p>
                    <p className="text-amber-400 font-black text-lg mt-1">
                        {formatMoney(data.value)}
                    </p>
                </div>
            )
        }
        return null
    }

    return (
        <div className="w-full overflow-x-auto custom-scrollbar pb-4">
            <div className="min-w-[800px] h-[500px]">
                <ErrorBoundary>
                    <Sankey
                        width={960}
                        height={500}
                        data={data}
                        node={<CustomNode />}
                        link={<CustomLink />}
                        nodePadding={30}
                        margin={{ top: 20, right: 120, bottom: 20, left: 120 }}
                    >
                        <Tooltip content={<CustomTooltip />} />
                    </Sankey>
                </ErrorBoundary>
            </div>
        </div>
    )
}
