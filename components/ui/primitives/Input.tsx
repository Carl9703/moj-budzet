import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, className = '', id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s/g, '-')

        return (
            <div className="flex flex-col gap-2">
                {label && (
                    <label htmlFor={inputId} className="text-sm font-medium text-slate-300 ml-1">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    <input
                        ref={ref}
                        id={inputId}
                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder:text-slate-500 
                        backdrop-blur-sm transition-all duration-300 shadow-sm
                        focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
                        ${error
                                ? 'border-rose-500/50 focus:ring-rose-500/50 text-rose-100'
                                : 'border-slate-700 hover:border-slate-600 focus:bg-slate-800/80'}
                        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
                        {...props}
                    />
                    {/* Optional glow effect on focus can be added via CSS if needed, but ring is good */}
                </div>

                {error && (
                    <div className="flex items-center gap-1.5 ml-1 mt-0.5 animate-slide-in">
                        <span className="w-1 h-1 rounded-full bg-rose-500" />
                        <span className="text-xs font-medium text-rose-400">{error}</span>
                    </div>
                )}

                {hint && !error && (
                    <span className="text-xs text-slate-500 ml-1">{hint}</span>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'
