'use client'
import { RouteError } from '@/components/ui/feedback/RouteError'
export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
    return <RouteError error={error} reset={reset} title="Błąd widoku Inwestycji" />
}
