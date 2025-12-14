import { formatMoney } from '@/lib/utils/money'
import { memo } from 'react'
import { Card } from '@/components/ui/layout/Card'

interface Props {
    balance: number
}

export const MainBalance = memo(function MainBalance({ balance }: Props) {
    return (
        <Card className="bg-slate-800 border border-slate-700 p-5 rounded-xl shadow-lg">
            <div className="flex flex-col gap-3">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Konto główne
                </div>

                <div>
                    <p className="text-3xl font-bold text-slate-100 tracking-tight leading-tight">
                        {formatMoney(balance)}
                    </p>
                    <div className="text-xs text-slate-400 mt-1">
                        Dostępne środki
                    </div>
                </div>
            </div>
        </Card>
    )
})