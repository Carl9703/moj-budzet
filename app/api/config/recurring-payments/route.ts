import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { z } from 'zod'

const recurringPaymentSchema = z.object({
    name: z.string().min(1, 'Nazwa jest wymagana'),
    amount: z.number().positive('Kwota musi być większa od 0'),
    dayOfMonth: z.number().min(1).max(31, 'Dzień miesiąca musi być między 1 a 31'),
    type: z.enum(['expense', 'transfer']).default('expense'),
    envelopeId: z.string().optional(),
    category: z.string().optional(),
    fromEnvelopeId: z.string().optional(),
    toEnvelopeId: z.string().optional(),
    isActive: z.boolean().optional().default(true)
}).refine((data) => {
    // Dla wydatków wymagamy envelopeId i category
    if (data.type === 'expense') {
        return data.envelopeId && data.category
    }
    // Dla transferów wymagamy toEnvelopeId
    if (data.type === 'transfer') {
        return data.toEnvelopeId
    }
    return true
}, {
    message: "Nieprawidłowe dane dla wybranego typu automatyzacji"
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

        // Dla wydatków sprawdź kopertę źródłową
        if (data.type === 'expense') {
            const envelope = await prisma.envelope.findFirst({
                where: {
                    id: data.envelopeId,
                    userId: userId
                }
            })

            if (!envelope) {
                return NextResponse.json({ error: 'Koperta nie znaleziona' }, { status: 404 })
            }
        }

        // Dla transferów, sprawdź kopertę docelową
        if (data.type === 'transfer') {
            if (!data.toEnvelopeId) {
                return NextResponse.json({ error: 'Dla transferów wymagana jest koperta docelowa' }, { status: 400 })
            }

            const toEnvelope = await prisma.envelope.findFirst({
                where: { id: data.toEnvelopeId, userId }
            })

            if (!toEnvelope) {
                return NextResponse.json({ error: 'Koperta docelowa nie znaleziona' }, { status: 404 })
            }
        }

        // Przygotuj dane do zapisu
        const createData: any = {
            userId,
            name: data.name,
            amount: data.amount,
            dayOfMonth: data.dayOfMonth,
            type: data.type,
            isActive: data.isActive
        }

        // Dla wydatków dodaj envelopeId i category
        if (data.type === 'expense' && data.envelopeId && data.category) {
            createData.envelopeId = data.envelopeId
            createData.category = data.category
        }

        // Dla transferów dodaj toEnvelopeId
        if (data.type === 'transfer' && data.toEnvelopeId) {
            createData.toEnvelopeId = data.toEnvelopeId
        }

        const recurringPayment = await prisma.recurringPayment.create({
            data: createData,
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
