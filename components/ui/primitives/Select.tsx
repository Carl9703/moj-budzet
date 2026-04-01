import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    error?: string
    hint?: string
    options: Array<{ label: string; value: string | number }>
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, hint, className = '', id, options, ...props }, ref) => {
        const selectId = id || label?.toLowerCase().replace(/\s/g, '-')

        return (
            <div className="flex flex-col gap-1.5">
                {label && (
                    <label htmlFor={selectId} className="text-sm font-medium text-slate-300">
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    id={selectId}
                    className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-slate-100 
            focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none
            backdrop-blur-sm
            ${error ? 'border-rose-500/50' : 'border-slate-700 hover:border-slate-600 focus:bg-slate-800/80'}
            disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
                    {...props}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && <span className="text-xs text-rose-400">{error}</span>}
                {hint && !error && <span className="text-xs text-slate-500">{hint}</span>}
            </div>
        )
    }
)

Select.displayName = 'Select'
