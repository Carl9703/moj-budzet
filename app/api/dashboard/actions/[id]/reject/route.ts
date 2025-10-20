import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Pobierz userId z JWT tokenu
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        const { id: paymentId } = await params

        // Znajdź płatność cykliczną
        const recurringPayment = await prisma.recurringPayment.findFirst({
            where: {
                id: paymentId,
                userId: userId,
                isActive: true
            }
        })

        if (!recurringPayment) {
            return NextResponse.json({ error: 'Płatność nie znaleziona' }, { status: 404 })
        }

        // Ustaw dismissedUntil na początek następnego miesiąca
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        nextMonth.setDate(1)
        nextMonth.setHours(0, 0, 0, 0)

        await prisma.recurringPayment.update({
            where: { id: paymentId },
            data: {
                dismissedUntil: nextMonth
            }
        })

        return NextResponse.json({
            success: true,
            message: `Płatność "${recurringPayment.name}" została odrzucona`,
            nextAppearance: nextMonth.toISOString().split('T')[0]
        })

    } catch (error) {
        console.error('Error rejecting payment:', error)
        return NextResponse.json(
            { error: 'Błąd odrzucania płatności', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
