import { ReactNode } from 'react'

type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label'

interface TextProps {
    variant?: TextVariant
    children: ReactNode
    className?: string
    as?: keyof JSX.IntrinsicElements
    color?: 'primary' | 'secondary' | 'muted' | 'success' | 'error' | 'warning'
}

const variantClasses: Record<TextVariant, string> = {
    h1: 'text-3xl font-bold',
    h2: 'text-2xl font-semibold',
    h3: 'text-xl font-semibold',
    body: 'text-base',
    caption: 'text-sm',
    label: 'text-xs font-medium uppercase tracking-wider',
}

const colorClasses = {
    primary: 'text-zinc-100',
    secondary: 'text-zinc-400',
    muted: 'text-zinc-500',
    success: 'text-emerald-400',
    error: 'text-rose-400',
    warning: 'text-amber-400',
}

export function Text({
    variant = 'body',
    children,
    className = '',
    as,
    color = 'primary'
}: TextProps) {
    const Component = as || (variant.startsWith('h') ? variant as 'h1' | 'h2' | 'h3' : 'p')

    return (
        <Component className={`${variantClasses[variant]} ${colorClasses[color]} ${className}`}>
            {children}
        </Component>
    )
}
