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
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

        // Znajdź wszystkie aktywne płatności cykliczne:
        // 1. Na dzisiejszy dzień (niezrealizowane)
        // 2. Z poprzednich dni tego miesiąca (niezrealizowane)
        const recurringPayments = await prisma.recurringPayment.findMany({
            where: {
                userId: userId,
                isActive: true,
                dayOfMonth: { lte: dayOfMonth }, // Wszystkie dni od początku miesiąca do dziś
                OR: [
                    { dismissedUntil: null },
                    { dismissedUntil: { lte: startOfMonth } } // Tylko te, które nie zostały zatwierdzone w tym miesiącu (lte aby uwzględnić te odrzucone na początek miesiąca)
                ]
            },
            include: {
                envelope: true,
                fromEnvelope: true,
                toEnvelope: true
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
            type: payment.type,
            envelope: payment.envelope ? {
                id: payment.envelope.id,
                name: payment.envelope.name,
                icon: payment.envelope.icon
            } : null,
            fromEnvelope: payment.type === 'transfer' ? {
                id: 'main-balance',
                name: 'Główne saldo',
                icon: '💰'
            } : (payment.fromEnvelope ? {
                id: payment.fromEnvelope.id,
                name: payment.fromEnvelope.name,
                icon: payment.fromEnvelope.icon
            } : null),
            toEnvelope: payment.toEnvelope ? {
                id: payment.toEnvelope.id,
                name: payment.toEnvelope.name,
                icon: payment.toEnvelope.icon
            } : null,
            category: payment.category,
            dayOfMonth: payment.dayOfMonth
        }))

        const response = NextResponse.json({
            actions,
            count: actions.length,
            date: today.toISOString().split('T')[0]
        })

        // Wyłącz cache dla świeżych danych
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')

        return response

    } catch (error) {
        console.error('Error fetching dashboard actions:', error)
        return NextResponse.json(
            { error: 'Błąd pobierania akcji', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
