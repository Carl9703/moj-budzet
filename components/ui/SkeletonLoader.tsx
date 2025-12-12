interface SkeletonProps {
    width?: string
    height?: string
    className?: string
}

export function Skeleton({ width = '100%', height = '20px', className = '' }: SkeletonProps) {
    return <div className={`bg-slate-700 animate-pulse rounded ${className}`} style={{ width, height }} />
}

export function EnvelopeCardSkeleton() {
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Skeleton width="20px" height="20px" className="rounded-full" />
                    <Skeleton width="80px" height="16px" />
                </div>
                <Skeleton width="60px" height="14px" />
            </div>
            <div className="mb-2"><Skeleton width="100%" height="6px" className="rounded-full" /></div>
            <div className="flex justify-between">
                <Skeleton width="30px" height="12px" />
                <Skeleton width="100px" height="12px" />
            </div>
        </div>
    )
}

export function MainBalanceSkeleton() {
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 text-center shadow-md">
            <Skeleton width="120px" height="16px" className="mx-auto mb-3" />
            <Skeleton width="150px" height="32px" className="mx-auto" />
        </div>
    )
}

export function MonthStatusSkeleton() {
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-md">
            <div className="mb-4">
                <Skeleton width="100px" height="16px" className="mb-2" />
                <Skeleton width="120px" height="24px" />
            </div>
            <div className="mb-4">
                <Skeleton width="80px" height="16px" className="mb-2" />
                <Skeleton width="100px" height="24px" />
            </div>
            <Skeleton width="100%" height="36px" className="rounded-lg" />
        </div>
    )
}

export function QuickActionsSkeleton() {
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-md">
            <Skeleton width="120px" height="16px" className="mb-4" />
            <div className="flex flex-col gap-3">
                <Skeleton width="100%" height="40px" className="rounded-lg" />
                <Skeleton width="100%" height="40px" className="rounded-lg" />
            </div>
        </div>
    )
}

export function TransactionRowSkeleton() {
    return (
        <div className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
            <div className="flex items-center gap-3">
                <Skeleton width="32px" height="32px" className="rounded-full" />
                <div>
                    <Skeleton width="120px" height="16px" className="mb-1" />
                    <Skeleton width="80px" height="12px" />
                </div>
            </div>
            <div className="text-right">
                <Skeleton width="60px" height="16px" className="mb-1 ml-auto" />
                <Skeleton width="40px" height="12px" className="ml-auto" />
            </div>
        </div>
    )
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-md">
            <Skeleton width="140px" height="20px" className="mb-4" />
            <div className="flex flex-col">
                {Array.from({ length: count }).map((_, i) => (
                    <TransactionRowSkeleton key={i} />
                ))}
            </div>
        </div>
    )
}

export function ChartSkeleton() {
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-md h-full min-h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <Skeleton width="150px" height="20px" />
                <Skeleton width="100px" height="32px" className="rounded-lg" />
            </div>
            <div className="flex-1 flex items-end justify-between gap-2 px-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} width="100%" height={`${Math.random() * 60 + 20}%`} className="rounded-t" />
                ))}
            </div>
        </div>
    )
}

export function DashboardSkeleton() {
    return (
        <div className="max-w-4xl mx-auto pb-20 p-4">
            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Skeleton width="48px" height="48px" className="rounded-full" />
                    <div>
                        <Skeleton width="140px" height="24px" className="mb-1" />
                        <Skeleton width="100px" height="14px" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Skeleton width="40px" height="40px" className="rounded-full" />
                    <Skeleton width="40px" height="40px" className="rounded-full" />
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <MainBalanceSkeleton />
                <MonthStatusSkeleton />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="md:col-span-2">
                    <ChartSkeleton />
                </div>
                <div>
                    <QuickActionsSkeleton />
                </div>
            </div>

            {/* Envelopes */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <Skeleton width="120px" height="24px" />
                    <Skeleton width="80px" height="32px" className="rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <EnvelopeCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    )
}
