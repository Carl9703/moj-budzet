interface Props {
    icon: string
    title: string
    description: string
    actionText?: string
    onAction?: () => void
    variant?: 'default' | 'success' | 'warning' | 'error'
}

export function EmptyState({ 
    icon, 
    title, 
    description, 
    actionText, 
    onAction,
    variant = 'default' 
}: Props) {
    const getVariantStyles = () => {
        switch (variant) {
            case 'success':
                return {
                    iconColor: '#10b981',
                    titleColor: '#065f46',
                    descriptionColor: '#047857',
                    backgroundColor: 'var(--bg-success)',
                    borderColor: '#bbf7d0'
                }
            case 'warning':
                return {
                    iconColor: '#f59e0b',
                    titleColor: '#92400e',
                    descriptionColor: '#b45309',
                    backgroundColor: 'var(--bg-warning)',
                    borderColor: '#fed7aa'
                }
            case 'error':
                return {
                    iconColor: '#ef4444',
                    titleColor: '#991b1b',
                    descriptionColor: '#dc2626',
                    backgroundColor: 'var(--bg-error)',
                    borderColor: '#fecaca'
                }
            default:
                return {
                    iconColor: '#6b7280',
                    titleColor: '#374151',
                    descriptionColor: '#6b7280',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: '#e5e7eb'
                }
        }
    }

    const styles = getVariantStyles()

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 24px',
            backgroundColor: styles.backgroundColor,
            border: `2px dashed ${styles.borderColor}`,
            borderRadius: '12px',
            textAlign: 'center',
            minHeight: '200px'
        }}>
            <div style={{
                fontSize: '48px',
                marginBottom: '16px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }}>
                {icon}
            </div>
            
            <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: styles.titleColor,
                marginBottom: '8px',
                margin: 0
            }}>
                {title}
            </h3>
            
            <p style={{
                fontSize: '14px',
                color: styles.descriptionColor,
                marginBottom: actionText ? '20px' : '0',
                margin: 0,
                maxWidth: '300px',
                lineHeight: '1.5'
            }}>
                {description}
            </p>

            {actionText && onAction && (
                <button
                    onClick={onAction}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: styles.iconColor,
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    {actionText}
                </button>
            )}
        </div>
    )
}
