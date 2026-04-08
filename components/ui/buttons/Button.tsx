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
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: 'bg-amber-600 text-white hover:bg-amber-700',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600',
    error: 'bg-rose-500 text-white hover:bg-rose-600',
    warning: 'bg-amber-500 text-white hover:bg-amber-600',
    secondary: 'bg-zinc-700 text-zinc-100 border border-zinc-600 hover:bg-zinc-600'
  }

  const sizeClasses = {
    small: 'h-8 px-3 text-sm',
    medium: 'h-10 px-4 text-sm',
    large: 'h-12 px-6 text-base'
  }

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${disabled || loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {loading && <div className="w-4 h-4 border-2 border-transparent border-t-current rounded-full animate-spin" />}
      {children}
    </button>
  )
}
