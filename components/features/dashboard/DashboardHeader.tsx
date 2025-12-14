interface DashboardHeaderProps {
    children?: React.ReactNode
}

export const DashboardHeader = ({ children }: DashboardHeaderProps) => {
    return (
        <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-50 mb-1">
                        Panel Główny
                    </h2>
                    <p className="text-sm text-slate-400">
                        Twoje centrum dowodzenia finansami.
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
