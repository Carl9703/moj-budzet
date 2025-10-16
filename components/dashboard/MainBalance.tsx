import { formatMoney } from '@/lib/utils/money'
import { memo } from 'react'

interface Props {
    balance: number
}

export const MainBalance = memo(function MainBalance({ balance }: Props) {
    return (
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                        <p className="text-blue-100 text-sm font-medium">Konto główne</p>
                    </div>
                    <p className="text-3xl font-bold text-white tracking-tight">
                        {formatMoney(balance)}
                    </p>
                    <div className="flex items-center space-x-1 text-blue-100 text-xs">
                        <span>💰</span>
                        <span>Dostępne środki</span>
                    </div>
                </div>
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-2xl">💳</span>
                </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-4 right-4 w-20 h-20 bg-white/5 rounded-full -z-10"></div>
            <div className="absolute bottom-4 left-4 w-12 h-12 bg-white/5 rounded-full -z-10"></div>
        </div>
    )
})