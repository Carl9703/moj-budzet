import { formatMoney } from '@/lib/utils/money'
import { memo } from 'react'

interface EnvelopeProps {
    name: string
    icon: string
    spent: number
    planned: number
    current: number
    type: 'monthly' | 'yearly'
}

export const EnvelopeCard = memo(function EnvelopeCard({ name, icon, spent, planned, current, type }: EnvelopeProps) {
    const isFreedomFunds = name.toLowerCase().includes('wolne środki')

    const percentage = type === 'monthly'
        ? (planned > 0 ? Math.round((spent / planned) * 100) : 0)
        : isFreedomFunds
            ? 100
            : (planned > 0 ? Math.round((current / planned) * 100) : 0)

    const remaining = Math.round(((type === 'monthly' ? planned - spent : planned - current) * 100)) / 100

    const isOverBudget = type === 'monthly' && spent > planned

    const getEnvelopeStatus = () => {
        if (type === 'monthly') {
            if (isOverBudget) return 'over'
            if (percentage >= 80) return 'warning'
            return 'good'
        } else {
            if (percentage >= 100) return 'completed'
            return 'progress'
        }
    }

    const status = getEnvelopeStatus()

    const getStatusIcon = () => {
        switch (status) {
            case 'over': return '⚠️'
            case 'warning': return '⚡'
            case 'good': return '✅'
            case 'completed': return '🎉'
            case 'progress': return '📈'
            default: return ''
        }
    }

    const getProgressColor = () => {
        if (type === 'monthly') {
            if (percentage > 100) return '#991b1b'
            if (percentage >= 90) return '#ef4444'
            if (percentage >= 75) return '#f59e0b'
            if (percentage >= 50) return '#3b82f6'
            return '#10b981'
        } else {
            if (isFreedomFunds) return '#6366f1'
            if (percentage >= 100) return '#10b981'
            if (percentage >= 75) return '#3b82f6'
            if (percentage >= 50) return '#f59e0b'
            return '#ef4444'
        }
    }

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group ${
            isOverBudget ? 'ring-2 ring-red-200 dark:ring-red-800 bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <span className="text-lg">{icon}</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {type === 'monthly' ? 'Miesięczne' : 'Roczne'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`text-sm font-bold ${
                        isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                    }`}>
                        {type === 'monthly' ?
                            `${formatMoney(spent, false)}/${formatMoney(planned, false)} zł` :
                            isFreedomFunds ?
                                formatMoney(current) :
                                `${formatMoney(current, false)}/${formatMoney(planned, false)} zł`
                        }
                    </p>
                    {!isFreedomFunds && (
                        <p className={`text-xs ${
                            isOverBudget ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                            {percentage}%
                        </p>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                        className="h-full rounded-full transition-all duration-300 ease-out"
                        style={{
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: getProgressColor()
                        }}
                    />
                </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1">
                    <span className={`w-2 h-2 rounded-full ${
                        status === 'over' ? 'bg-red-500' :
                        status === 'warning' ? 'bg-yellow-500' :
                        status === 'good' ? 'bg-green-500' :
                        status === 'completed' ? 'bg-blue-500' : 'bg-gray-400'
                    }`}></span>
                    <span className={`font-medium ${
                        isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                        {getStatusIcon()} {status === 'over' ? 'Przekroczono' : 
                         status === 'warning' ? 'Uwaga' : 
                         status === 'good' ? 'W porządku' : 
                         status === 'completed' ? 'Ukończono' : 'W toku'}
                    </span>
                </div>
                <span className={`font-medium ${
                    type === 'monthly' ?
                        (isOverBudget ? 'text-red-600 dark:text-red-400' : (remaining > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400')) :
                        isFreedomFunds ?
                            'text-blue-600 dark:text-blue-400' :
                            (percentage >= 100 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400')
                }`}>
                    {type === 'monthly' ?
                        (isOverBudget ?
                            `+${formatMoney(Math.round((spent - planned) * 100) / 100, false)} zł` :
                            (name === 'Fundusz Awaryjny' || name === 'Budowanie Przyszłości' ?
                                `-${formatMoney(Math.abs(remaining), false)} zł` :
                                `${formatMoney(remaining, false)} zł`)) :
                        isFreedomFunds ?
                            `Dostępne` :
                            (percentage >= 100 ?
                                `+${formatMoney(Math.abs(remaining), false)} zł` :
                                `-${formatMoney(Math.abs(remaining), false)} zł`)
                    }
                </span>
            </div>
        </div>
    )
})