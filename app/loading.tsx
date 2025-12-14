import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner'

export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950">
            <LoadingSpinner size="large" text="Ładowanie Quantum Budget..." />
        </div>
    )
}
