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
    const getVariantClasses = () => {
        switch (variant) {
            case 'success':
                return {
                    container: 'bg-emerald-500/5 border-emerald-500/20',
                    title: 'text-emerald-400',
                    description: 'text-emerald-500/60',
                    button: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                }
            case 'warning':
                return {
                    container: 'bg-amber-500/5 border-amber-500/20',
                    title: 'text-amber-400',
                    description: 'text-amber-500/60',
                    button: 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20'
                }
            case 'error':
                return {
                    container: 'bg-rose-500/5 border-rose-500/20',
                    title: 'text-rose-400',
                    description: 'text-rose-500/60',
                    button: 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
                }
            default:
                return {
                    container: 'bg-zinc-900/50 border-white/5 backdrop-blur-xl',
                    title: 'text-white',
                    description: 'text-zinc-500',
                    button: 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20'
                }
        }
    }

    const classes = getVariantClasses()

    return (
        <div className={`flex flex-col items-center justify-center py-16 px-8 border border-dashed rounded-3xl text-center min-h-[300px] shadow-xl ${classes.container}`}>
            <div className="text-6xl mb-6 opacity-80 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                {icon}
            </div>

            <h3 className={`text-xl font-black mb-2 tracking-tight ${classes.title}`}>
                {title}
            </h3>

            <p className={`text-xs font-black uppercase tracking-widest max-w-[320px] leading-relaxed ${actionText ? 'mb-8' : ''} ${classes.description}`}>
                {description}
            </p>

            {actionText && onAction && (
                <button
                    onClick={onAction}
                    className={`py-3 px-8 text-white border-none rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer shadow-xl hover:scale-105 active:scale-95 transition-all ${classes.button}`}
                >
                    {actionText}
                </button>
            )}
        </div>
    )
}
