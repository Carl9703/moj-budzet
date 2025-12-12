import { ReactNode } from 'react'

type Direction = 'row' | 'column'
type Gap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type Align = 'start' | 'center' | 'end' | 'stretch'
type Justify = 'start' | 'center' | 'end' | 'between' | 'around'

interface StackProps {
    children: ReactNode
    direction?: Direction
    gap?: Gap
    align?: Align
    justify?: Justify
    wrap?: boolean
    className?: string
}

const gapClasses: Record<Gap, string> = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
}

const alignClasses: Record<Align, string> = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
}

const justifyClasses: Record<Justify, string> = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
}

export function Stack({
    children,
    direction = 'column',
    gap = 'md',
    align = 'stretch',
    justify = 'start',
    wrap = false,
    className = ''
}: StackProps) {
    const directionClass = direction === 'row' ? 'flex-row' : 'flex-col'
    const wrapClass = wrap ? 'flex-wrap' : ''

    return (
        <div className={`flex ${directionClass} ${gapClasses[gap]} ${alignClasses[align]} ${justifyClasses[justify]} ${wrapClass} ${className}`}>
            {children}
        </div>
    )
}
