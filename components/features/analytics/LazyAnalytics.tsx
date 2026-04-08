'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Skeleton loaders for lazy-loaded components
function ChartsSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-zinc-800/50 rounded-xl p-6 h-80 animate-pulse">
                <div className="h-4 w-32 bg-zinc-700 rounded mb-4" />
                <div className="h-60 bg-zinc-700/50 rounded-lg" />
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-6 h-80 animate-pulse">
                <div className="h-4 w-32 bg-zinc-700 rounded mb-4" />
                <div className="h-60 bg-zinc-700/50 rounded-lg" />
            </div>
        </div>
    )
}

function TrendsSkeleton() {
    return (
        <div className="bg-zinc-800/50 rounded-xl p-6 h-96 animate-pulse">
            <div className="h-4 w-48 bg-zinc-700 rounded mb-4" />
            <div className="h-80 bg-zinc-700/50 rounded-lg" />
        </div>
    )
}

function ExplorerSkeleton() {
    return (
        <div className="bg-zinc-800/50 rounded-xl p-6 animate-pulse">
            <div className="h-4 w-40 bg-zinc-700 rounded mb-4" />
            <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-12 bg-zinc-700/50 rounded-lg" />
                ))}
            </div>
        </div>
    )
}

// Lazy-loaded components with Next.js dynamic imports
export const LazyAnalyticsCharts = dynamic(
    () => import('@/components/features/analytics/AnalyticsCharts').then(mod => ({ default: mod.AnalyticsCharts })),
    {
        loading: () => <ChartsSkeleton />,
        ssr: false
    }
)

export const LazyTrendsVisualization = dynamic(
    () => import('@/components/features/analytics/TrendsVisualization').then(mod => ({ default: mod.TrendsVisualization })),
    {
        loading: () => <TrendsSkeleton />,
        ssr: false
    }
)

export const LazyInteractiveExpenseExplorer = dynamic(
    () => import('@/components/features/analytics/InteractiveExpenseExplorer').then(mod => ({ default: mod.InteractiveExpenseExplorer })),
    {
        loading: () => <ExplorerSkeleton />,
        ssr: false
    }
)

export const LazyIncomeAnalysis = dynamic(
    () => import('@/components/features/analytics/IncomeAnalysis').then(mod => ({ default: mod.IncomeAnalysis })),
    {
        loading: () => <TrendsSkeleton />,
        ssr: false
    }
)

// Export skeletons for reuse
export { ChartsSkeleton, TrendsSkeleton, ExplorerSkeleton }
