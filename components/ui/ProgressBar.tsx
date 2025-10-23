'use client'

interface ProgressBarProps {
  value: number
  max: number
  showLabel?: boolean
  label?: string
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export function ProgressBar({ 
  value, 
  max, 
  showLabel = true, 
  label, 
  size = 'medium',
  className = '' 
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)
  const isOverBudget = value > max
  
  const getProgressColor = () => {
    if (isOverBudget) return 'var(--color-error)'
    if (percentage > 80) return 'var(--color-warning)'
    return 'var(--brand-primary)'
  }
  
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { height: '6px', fontSize: 'var(--font-size-xs)' }
      case 'large':
        return { height: '12px', fontSize: 'var(--font-size-s)' }
      default:
        return { height: '8px', fontSize: 'var(--font-size-s)' }
    }
  }
  
  const sizeStyles = getSizeStyles()
  
  return (
    <div className={className} style={{ width: '100%' }}>
      {showLabel && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-s)',
          fontSize: sizeStyles.fontSize,
          color: 'var(--text-secondary)'
        }}>
          <span>{label || 'Postęp'}</span>
          <span style={{
            color: isOverBudget ? 'var(--color-error)' : 'var(--text-primary)',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            {value.toLocaleString()} / {max.toLocaleString()} zł
          </span>
        </div>
      )}
      
      <div style={{
        width: '100%',
        height: sizeStyles.height,
        backgroundColor: 'var(--bg-tertiary)',
        borderRadius: '999px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: getProgressColor(),
          borderRadius: '999px',
          transition: 'var(--transition-normal)',
          position: 'relative'
        }} />
      </div>
      
    </div>
  )
}
