'use client'

interface ProgressBarProps {
  value: number
  max: number
  showLabel?: boolean
  label?: string
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export function ProgressBar({ value, max, showLabel = true, label, size = 'medium', className = '' }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)
  const isOverBudget = value > max

  const sizeClasses = { small: 'h-1.5', medium: 'h-2', large: 'h-3' }
  const textSizes = { small: 'text-xs', medium: 'text-sm', large: 'text-sm' }

  const getProgressColor = () => {
    if (isOverBudget) return 'bg-rose-500'
    if (percentage > 80) return 'bg-amber-500'
    return 'bg-emerald-400'
  }

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className={`flex justify-between items-center mb-1.5 ${textSizes[size]} text-slate-400`}>
          <span>{label || 'Postęp'}</span>
          <span className={`font-medium ${isOverBudget ? 'text-rose-400' : 'text-slate-100'}`}>
            {value.toLocaleString()} / {max.toLocaleString()} zł
          </span>
        </div>
      )}
      <div className={`w-full ${sizeClasses[size]} bg-slate-900 rounded-full overflow-hidden`}>
        <div className={`h-full ${getProgressColor()} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}
