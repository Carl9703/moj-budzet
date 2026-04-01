import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
    try {
        // Pobierz userId z JWT tokenu
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        const { searchParams } = new URL(request.url)
        const categoryId = searchParams.get('categoryId')
        const type = searchParams.get('type') || 'expense'

        const where: any = {
            userId,
            type: type,
            description: {
                not: '',
                notIn: ['Zamknięcie miesiąca', 'przeniesienie bilansu', 'Wypłata', 'Premia'] // Wykluczamy systemowe i oczywiste
            }
        }

        // Jeśli mamy kategorię, filtrujemy po niej
        if (categoryId && categoryId !== 'income_other' && categoryId !== 'all') {
            // Spróbujmy znaleźć nazwę kategorii, aby obsłużyć też stare transakcje zapisane po nazwie
            const categoryRecord = await prisma.category.findUnique({
                where: { id: categoryId }
            })

            if (categoryRecord) {
                where.OR = [
                    { category: categoryId },
                    { category: categoryRecord.name }
                ]
            } else {
                where.category = categoryId
            }
        } else if (categoryId === 'income_other') {
            where.category = null
        }

        // console.log cleared

        // Pobierz ostatnie 200 transakcji (większa próbka dla lepszych sugestii)
        const recentTransactions = await prisma.transaction.findMany({
            where,
            select: { description: true },
            orderBy: { date: 'desc' },
            take: 200
        })

        // console.log cleared

        // Policz wystąpienia opisów (case-insensitive)
        const counts: Record<string, number> = {} // lowercase -> count
        const casingMap: Record<string, Record<string, number>> = {} // lowercase -> { originalCase -> count }

        recentTransactions.forEach(t => {
            if (t.description) {
                const original = t.description.trim()
                if (original.length >= 2) {
                    const lower = original.toLowerCase()
                    counts[lower] = (counts[lower] || 0) + 1

                    if (!casingMap[lower]) casingMap[lower] = {}
                    casingMap[lower][original] = (casingMap[lower][original] || 0) + 1
                }
            }
        })

        // Sortujemy po popularności i wybieramy najczęstszy wariant wielkości liter
        const suggestions = Object.entries(counts)
            .sort((a, b) => b[1] - a[1]) // Najpierw najczęstsze grupy
            .slice(0, 12) // Bierzemy trochę więcej do finalnego formatowania
            .map(([lower]) => {
                // Dla każdej grupy wybieramy najpopularniejszą wielkość liter
                const originalVariants = Object.entries(casingMap[lower])
                return originalVariants.sort((a, b) => b[1] - a[1])[0][0]
            })
            .slice(0, 10) // Ostateczne Top 10

        return NextResponse.json({ suggestions })

    } catch (error) {
        console.error('Error fetching description suggestions:', error)
        return NextResponse.json(
            { error: 'Błąd pobierania sugestii', suggestions: [] },
            { status: 500 }
        )
    }
}
