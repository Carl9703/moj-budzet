interface Props {
    size?: 'small' | 'medium' | 'large'
    text?: string
}

export function LoadingSpinner({ size = 'medium', text }: Props) {
    const sizeClasses = {
        small: 'w-5 h-5 border-2',
        medium: 'w-8 h-8 border-[3px]',
        large: 'w-12 h-12 border-4'
    }

    return (
        <div className={`flex flex-col items-center justify-center ${text ? 'p-8 gap-3' : 'p-4'}`}>
            <div className={`${sizeClasses[size]} border-slate-200 border-t-indigo-500 rounded-full animate-spin`} />
            {text && <p className="text-sm text-slate-500 m-0 text-center">{text}</p>}
        </div>
    )
}
