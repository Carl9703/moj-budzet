'use client'

import { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'success' | 'error' | 'warning' | 'secondary'
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
  loading?: boolean
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  style = {},
  ...props 
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: 'var(--color-success)',
          color: 'var(--text-primary)',
          border: 'none'
        }
      case 'error':
        return {
          backgroundColor: 'var(--color-error)',
          color: 'var(--text-primary)',
          border: 'none'
        }
      case 'warning':
        return {
          backgroundColor: 'var(--color-warning)',
          color: 'var(--text-primary)',
          border: 'none'
        }
      case 'secondary':
        return {
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--bg-primary)'
        }
      default:
        return {
          backgroundColor: 'var(--brand-primary)',
          color: 'var(--text-primary)',
          border: 'none'
        }
    }
  }
  
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: 'var(--space-s) var(--space-m)',
          fontSize: 'var(--font-size-s)',
          height: '32px'
        }
      case 'large':
        return {
          padding: 'var(--space-m) var(--space-xl)',
          fontSize: 'var(--font-size-m)',
          height: '48px'
        }
      default:
        return {
          padding: 'var(--space-s) var(--space-m)',
          fontSize: 'var(--font-size-s)',
          height: '40px'
        }
    }
  }
  
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-s)',
    borderRadius: 'var(--border-radius-small)',
    fontWeight: 'var(--font-weight-medium)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'var(--transition-fast)',
    opacity: disabled || loading ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...style
  }
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      e.preventDefault()
      return
    }
    props.onClick?.(e)
  }
  
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={className}
      style={baseStyle}
      onClick={handleClick}
    >
      {loading && (
        <div style={{
          width: '16px',
          height: '16px',
          border: '2px solid transparent',
          borderTop: '2px solid currentColor',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      )}
      {children}
    </button>
  )
}
