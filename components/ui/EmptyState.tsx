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
                    container: 'bg-emerald-500/10 border-emerald-500/30',
                    title: 'text-emerald-600',
                    description: 'text-emerald-500',
                    button: 'bg-emerald-500 hover:bg-emerald-600'
                }
            case 'warning':
                return {
                    container: 'bg-amber-500/10 border-amber-500/30',
                    title: 'text-amber-600',
                    description: 'text-amber-500',
                    button: 'bg-amber-500 hover:bg-amber-600'
                }
            case 'error':
                return {
                    container: 'bg-red-500/10 border-red-500/30',
                    title: 'text-red-600',
                    description: 'text-red-500',
                    button: 'bg-red-500 hover:bg-red-600'
                }
            default:
                return {
                    container: 'bg-slate-700/50 border-slate-600',
                    title: 'text-slate-300',
                    description: 'text-slate-400',
                    button: 'bg-slate-500 hover:bg-slate-600'
                }
        }
    }

    const classes = getVariantClasses()

    return (
        <div className={`flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed rounded-xl text-center min-h-[200px] ${classes.container}`}>
            <div className="text-5xl mb-4 drop-shadow-md">
                {icon}
            </div>

            <h3 className={`text-lg font-semibold mb-2 ${classes.title}`}>
                {title}
            </h3>

            <p className={`text-sm max-w-[300px] leading-relaxed ${actionText ? 'mb-5' : ''} ${classes.description}`}>
                {description}
            </p>

            {actionText && onAction && (
                <button
                    onClick={onAction}
                    className={`py-3 px-6 text-white border-none rounded-lg text-sm font-medium cursor-pointer shadow hover:-translate-y-0.5 hover:shadow-lg transition-all ${classes.button}`}
                >
                    {actionText}
                </button>
            )}
        </div>
    )
}
