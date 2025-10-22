import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { z } from 'zod'

const recurringPaymentSchema = z.object({
    name: z.string().min(1, 'Nazwa jest wymagana'),
    amount: z.number().positive('Kwota musi być większa od 0'),
    dayOfMonth: z.number().min(1).max(31, 'Dzień miesiąca musi być między 1 a 31'),
    envelopeId: z.string().min(1, 'Koperta jest wymagana'),
    category: z.string().min(1, 'Kategoria jest wymagana'),
    type: z.enum(['expense', 'transfer']).default('expense'),
    fromEnvelopeId: z.string().optional(),
    toEnvelopeId: z.string().optional(),
    isActive: z.boolean().optional().default(true)
})

export async function GET(request: NextRequest) {
    try {
        // Pobierz userId z JWT tokenu
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        const recurringPayments = await prisma.recurringPayment.findMany({
            where: { userId },
            include: {
                envelope: true,
                fromEnvelope: true,
                toEnvelope: true
            },
            orderBy: {
                dayOfMonth: 'asc'
            }
        })

        return NextResponse.json({ recurringPayments })

    } catch (error) {
        console.error('Error fetching recurring payments:', error)
        return NextResponse.json(
            { error: 'Błąd pobierania płatności cyklicznych', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        // Pobierz userId z JWT tokenu
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }
        const body = await request.json()

        const validation = recurringPaymentSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Nieprawidłowe dane', details: validation.error.issues },
                { status: 400 }
            )
        }

        const data = validation.data

        // Sprawdź czy koperta należy do użytkownika
        const envelope = await prisma.envelope.findFirst({
            where: {
                id: data.envelopeId,
                userId: userId
            }
        })

        if (!envelope) {
            return NextResponse.json({ error: 'Koperta nie znaleziona' }, { status: 404 })
        }

        // Dla transferów, sprawdź dodatkowe koperty
        if (data.type === 'transfer') {
            if (!data.fromEnvelopeId || !data.toEnvelopeId) {
                return NextResponse.json({ error: 'Dla transferów wymagane są koperty źródłowa i docelowa' }, { status: 400 })
            }

            const fromEnvelope = await prisma.envelope.findFirst({
                where: { id: data.fromEnvelopeId, userId }
            })
            const toEnvelope = await prisma.envelope.findFirst({
                where: { id: data.toEnvelopeId, userId }
            })

            if (!fromEnvelope || !toEnvelope) {
                return NextResponse.json({ error: 'Koperty źródłowa lub docelowa nie znalezione' }, { status: 404 })
            }
        }

        const recurringPayment = await prisma.recurringPayment.create({
            data: {
                userId,
                name: data.name,
                amount: data.amount,
                dayOfMonth: data.dayOfMonth,
                envelopeId: data.envelopeId,
                category: data.category,
                type: data.type,
                fromEnvelopeId: data.fromEnvelopeId,
                toEnvelopeId: data.toEnvelopeId,
                isActive: data.isActive
            },
            include: {
                envelope: true,
                fromEnvelope: true,
                toEnvelope: true
            }
        })

        return NextResponse.json({
            success: true,
            recurringPayment,
            message: 'Płatność cykliczna została utworzona'
        })

    } catch (error) {
        console.error('Error creating recurring payment:', error)
        return NextResponse.json(
            { error: 'Błąd tworzenia płatności cyklicznej', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
