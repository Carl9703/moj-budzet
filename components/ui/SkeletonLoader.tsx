interface SkeletonProps {
    width?: string
    height?: string
    className?: string
}

export function Skeleton({ width = '100%', height = '20px', className = '' }: SkeletonProps) {
    return <div className={`bg-slate-800/50 animate-pulse rounded-md ${className}`} style={{ width, height }} />
}

export function EnvelopeCardSkeleton() {
    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <Skeleton width="32px" height="32px" className="rounded-xl" />
                    <Skeleton width="100px" height="20px" />
                </div>
                <Skeleton width="60px" height="16px" />
            </div>
            <div className="mb-3"><Skeleton width="100%" height="8px" className="rounded-full" /></div>
            <div className="flex justify-between">
                <Skeleton width="40px" height="14px" />
                <Skeleton width="120px" height="14px" />
            </div>
        </div>
    )
}

export function MainBalanceSkeleton() {
    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 text-center shadow-xl backdrop-blur-xl">
            <Skeleton width="140px" height="14px" className="mx-auto mb-4 opacity-50" />
            <Skeleton width="180px" height="40px" className="mx-auto" />
        </div>
    )
}

export function MonthStatusSkeleton() {
    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
            <div className="mb-6">
                <Skeleton width="120px" height="14px" className="mb-2 opacity-50" />
                <Skeleton width="160px" height="28px" />
            </div>
            <div className="mb-6">
                <Skeleton width="100px" height="14px" className="mb-2 opacity-50" />
                <Skeleton width="140px" height="28px" />
            </div>
            <Skeleton width="100%" height="48px" className="rounded-2xl" />
        </div>
    )
}

export function QuickActionsSkeleton() {
    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
            <Skeleton width="140px" height="14px" className="mb-6 opacity-50" />
            <div className="flex flex-col gap-4">
                <Skeleton width="100%" height="48px" className="rounded-2xl" />
                <Skeleton width="100%" height="48px" className="rounded-2xl" />
            </div>
        </div>
    )
}

export function TransactionRowSkeleton() {
    return (
        <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
            <div className="flex items-center gap-4">
                <Skeleton width="40px" height="40px" className="rounded-2xl" />
                <div>
                    <Skeleton width="140px" height="18px" className="mb-1" />
                    <Skeleton width="100px" height="14px" className="opacity-50" />
                </div>
            </div>
            <div className="text-right">
                <Skeleton width="80px" height="18px" className="mb-1 ml-auto" />
                <Skeleton width="60px" height="14px" className="ml-auto opacity-50" />
            </div>
        </div>
    )
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
            <Skeleton width="160px" height="24px" className="mb-6" />
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
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 shadow-xl h-full min-h-[350px] flex flex-col backdrop-blur-xl">
            <div className="flex justify-between items-center mb-8">
                <Skeleton width="180px" height="24px" />
                <Skeleton width="120px" height="36px" className="rounded-xl" />
            </div>
            <div className="flex-1 flex items-end justify-between gap-3 px-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} width="100%" height={`${Math.random() * 60 + 20}%`} className="rounded-t-lg" />
                ))}
            </div>
        </div>
    )
}

export function DashboardSkeleton() {
    return (
        <div className="w-full max-w-[2560px] mx-auto pb-20 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8 flex justify-between items-end">
                <div className="flex items-center gap-4">
                    <Skeleton width="56px" height="56px" className="rounded-2xl" />
                    <div>
                        <Skeleton width="180px" height="28px" className="mb-1.5" />
                        <Skeleton width="120px" height="16px" className="opacity-50" />
                    </div>
                </div>
                <div className="flex gap-3">
                    <Skeleton width="48px" height="48px" className="rounded-2xl" />
                    <Skeleton width="48px" height="48px" className="rounded-2xl" />
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MainBalanceSkeleton />
                <MainBalanceSkeleton />
                <MainBalanceSkeleton />
                <MainBalanceSkeleton />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2">
                    <ChartSkeleton />
                </div>
                <div className="space-y-6">
                    <QuickActionsSkeleton />
                    <MonthStatusSkeleton />
                </div>
            </div>

            {/* Envelopes */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <Skeleton width="160px" height="28px" />
                    <Skeleton width="100px" height="40px" className="rounded-2xl" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <EnvelopeCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    )
}
