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
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    maxWidth: '500px',
                    width: '90%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    position: 'relative',
                    zIndex: 51,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>{title}</h2>
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
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f3f4f6'
                            e.currentTarget.style.color = '#374151'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                            e.currentTarget.style.color = '#6b7280'
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