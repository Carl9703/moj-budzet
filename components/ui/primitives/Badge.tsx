import { ReactNode } from 'react'

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
    children: ReactNode
    variant?: BadgeVariant
    size?: BadgeSize
    className?: string
    dot?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    error: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    info: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    neutral: 'bg-slate-700 text-slate-300 border-slate-600',
}

const sizeClasses: Record<BadgeSize, string> = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
}

const dotColors: Record<BadgeVariant, string> = {
    success: 'bg-emerald-400',
    error: 'bg-rose-400',
    warning: 'bg-amber-400',
    info: 'bg-indigo-400',
    neutral: 'bg-slate-400',
}

export function Badge({
    children,
    variant = 'neutral',
    size = 'sm',
    className = '',
    dot = false
}: BadgeProps) {
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
            {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
            {children}
        </span>
    )
}
