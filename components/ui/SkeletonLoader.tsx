interface SkeletonProps {
    width?: string
    height?: string
    borderRadius?: string
    className?: string
}

export function Skeleton({ width = '100%', height = '20px', borderRadius = '4px', className }: SkeletonProps) {
    return (
        <div 
            className={`loading-shimmer ${className || ''}`}
            style={{
                width,
                height,
                borderRadius,
            }}
        />
    )
}

// Skeleton dla EnvelopeCard
export function EnvelopeCardSkeleton() {
    return (
        <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Skeleton width="20px" height="20px" borderRadius="50%" />
                    <Skeleton width="80px" height="16px" />
                </div>
                <Skeleton width="60px" height="14px" />
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: '8px' }}>
                <Skeleton width="100%" height="6px" borderRadius="6px" />
            </div>

            {/* Footer */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between'
            }}>
                <Skeleton width="30px" height="12px" />
                <Skeleton width="100px" height="12px" />
            </div>
        </div>
    )
}

// Skeleton dla MainBalance
export function MainBalanceSkeleton() {
    return (
        <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center' as const,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
        }}>
            <Skeleton width="120px" height="16px" style={{ margin: '0 auto 12px' }} />
            <Skeleton width="150px" height="32px" style={{ margin: '0 auto' }} />
        </div>
    )
}

// Skeleton dla MonthStatus
export function MonthStatusSkeleton() {
    return (
        <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
        }}>
            <div style={{ marginBottom: '16px' }}>
                <Skeleton width="100px" height="16px" style={{ marginBottom: '8px' }} />
                <Skeleton width="120px" height="24px" />
            </div>
            <div style={{ marginBottom: '16px' }}>
                <Skeleton width="80px" height="16px" style={{ marginBottom: '8px' }} />
                <Skeleton width="100px" height="24px" />
            </div>
            <Skeleton width="100%" height="36px" borderRadius="8px" />
        </div>
    )
}

// Skeleton dla QuickActions
export function QuickActionsSkeleton() {
    return (
        <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
        }}>
            <Skeleton width="120px" height="16px" style={{ marginBottom: '16px' }} />
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
                <Skeleton width="100%" height="40px" borderRadius="8px" />
                <Skeleton width="100%" height="40px" borderRadius="8px" />
            </div>
        </div>
    )
}
