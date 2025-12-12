import { formatMoney } from '@/lib/utils/money'
import { memo } from 'react'

interface Props {
    availableFunds: number
}

export const AvailableFunds = memo(function AvailableFunds({ availableFunds }: Props) {
    return (
        <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                        Wolne środki
                    </div>
                    <div className="text-3xl font-bold text-indigo-400">
                        {formatMoney(availableFunds)}
                    </div>
                </div>
            </div>
        </div>
    )
})
