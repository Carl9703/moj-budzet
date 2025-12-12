interface Props {
    size?: 'small' | 'medium' | 'large'
    text?: string
}

export function LoadingSpinner({ size = 'medium', text }: Props) {
    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return { width: '20px', height: '20px', borderWidth: '2px' }
            case 'large':
                return { width: '48px', height: '48px', borderWidth: '4px' }
            default:
                return { width: '32px', height: '32px', borderWidth: '3px' }
        }
    }

    const sizeStyles = getSizeStyles()

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: text ? '32px' : '16px',
            gap: text ? '12px' : '0'
        }}>
            <div style={{
                width: sizeStyles.width,
                height: sizeStyles.height,
                border: `${sizeStyles.borderWidth} solid #f3f4f6`,
                borderTop: `${sizeStyles.borderWidth} solid #6366f1`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            {text && (
                <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: 0,
                    textAlign: 'center'
                }}>
                    {text}
                </p>
            )}
            
            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}
