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
        const today = new Date()
        const dayOfMonth = today.getDate()

        // Znajdź wszystkie aktywne płatności cykliczne na dzisiejszy dzień
        const recurringPayments = await prisma.recurringPayment.findMany({
            where: {
                userId: userId,
                isActive: true,
                dayOfMonth: dayOfMonth,
                OR: [
                    { dismissedUntil: null },
                    { dismissedUntil: { lt: today } }
                ]
            },
            include: {
                envelope: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        // Formatuj dane dla frontendu
        const actions = recurringPayments.map(payment => ({
            id: payment.id,
            name: payment.name,
            amount: payment.amount,
            envelope: {
                id: payment.envelope.id,
                name: payment.envelope.name,
                icon: payment.envelope.icon
            },
            category: payment.category,
            dayOfMonth: payment.dayOfMonth
        }))

        return NextResponse.json({
            actions,
            count: actions.length,
            date: today.toISOString().split('T')[0]
        })

    } catch (error) {
        console.error('Error fetching dashboard actions:', error)
        return NextResponse.json(
            { error: 'Błąd pobierania akcji', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
