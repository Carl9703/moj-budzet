'use client'

import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  hover?: boolean
}

export function Card({ children, className = '', style = {}, onClick, hover = false }: CardProps) {
  const baseStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--border-radius-main)',
    padding: 'var(--space-l)',
    border: 'none',
    transition: 'var(--transition-normal)',
    ...style
  }

  const hoverStyle = hover ? {
    transform: 'translateY(-2px)',
    boxShadow: 'var(--shadow-lg)'
  } : {}

  return (
    <div
      className={className}
      style={{
        ...baseStyle,
        ...hoverStyle,
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
