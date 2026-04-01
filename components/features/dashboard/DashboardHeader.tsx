interface DashboardHeaderProps {
    children?: React.ReactNode
}

import { useAuth } from '@/lib/hooks/useAuth'

export const DashboardHeader = ({ children }: DashboardHeaderProps) => {
    const { user } = useAuth()
    const userName = user?.name?.split(' ')[0] || 'Użytkowniku'

    return (
        <div className="flex flex-col gap-4 pt-8 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
                        Cześć, {userName}! 👋
                    </h1>
                    <p className="text-xs text-slate-500 font-medium tracking-wide mt-1">
                        Twoje centrum dowodzenia finansami
                    </p>
                </div>
                {children && (
                    <div className="flex gap-2">
                        {children}
                    </div>
                )}
            </div>
        </div>
    )
}
