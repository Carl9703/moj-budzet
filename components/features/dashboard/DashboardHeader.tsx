interface DashboardHeaderProps {
    children?: React.ReactNode
    totalNetWorth?: number
}

import { useAuth } from '@/lib/hooks/useAuth'

export const DashboardHeader = ({ children, totalNetWorth }: DashboardHeaderProps) => {
    const { user } = useAuth()
    const userName = user?.name?.split(' ')[0] || 'Użytkowniku'

    return (
        <div className="flex flex-col gap-4 pt-8 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 tracking-tight">
                        Cześć, {userName}! 👋
                    </h1>
                    <p className="text-xs text-zinc-500 font-medium tracking-wide mt-1">
                        Twoje centrum dowodzenia finansami
                    </p>
                </div>
                {children && (
                    <div className="flex gap-2">
                        {children}
                    </div>
                )}
            </div>

            {totalNetWorth !== undefined && (
                <div className="flex items-baseline gap-3">
                    <span className="text-xs text-zinc-500 font-bold uppercase tracking-[0.2em]">Łącznie na kontach</span>
                    <span className="money text-3xl font-black tracking-tighter text-white">
                        {totalNetWorth.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-zinc-500 text-xl ml-1">zł</span>
                    </span>
                </div>
            )}
        </div>
    )
}
