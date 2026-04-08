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
        <div className={`flex flex-col items-center justify-center ${text ? 'p-8 gap-4' : 'p-4'}`}>
            <div className="relative">
                <div className={`${sizeClasses[size]} border-amber-500/20 border-t-amber-500 rounded-full animate-spin`} />
                <div className={`absolute inset-0 ${sizeClasses[size]} border-amber-500/0 border-t-amber-500 rounded-full animate-spin blur-[2px] opacity-50`} />
            </div>
            {text && <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest animate-pulse">{text}</p>}
        </div>
    )
}
