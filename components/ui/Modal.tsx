import { ReactNode } from 'react'

interface Props {
    title: string
    children: ReactNode
    onClose: () => void
}

export function Modal({ title, children, onClose }: Props) {
    return (
        <div 
            className="modal-backdrop"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 50
            }}
            onClick={onClose}
        >
            <div 
                className="modal-content smooth-all"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    padding: '24px',
                    maxWidth: '500px',
                    width: '90%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    position: 'relative',
                    zIndex: 51,
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--border-primary)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                }}>
                    <h2 className="section-header" style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{title}</h2>
                    <button
                        onClick={onClose}
                        className="btn-animate smooth-colors"
                        style={{
                            fontSize: '20px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '6px',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                            e.currentTarget.style.color = 'var(--text-primary)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                            e.currentTarget.style.color = 'var(--text-secondary)'
                        }}
                    >
                        ✕
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}