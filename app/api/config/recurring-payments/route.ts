import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/jwt'
import { z } from 'zod'

const recurringPaymentSchema = z.object({
    name: z.string().min(1, 'Nazwa jest wymagana'),
    amount: z.number().positive('Kwota musi być większa od 0'),
    dayOfMonth: z.number().min(1).max(31, 'Dzień miesiąca musi być między 1 a 31'),
    envelopeId: z.string().min(1, 'Koperta jest wymagana'),
    category: z.string().min(1, 'Kategoria jest wymagana'),
    isActive: z.boolean().optional().default(true)
})

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id

        const recurringPayments = await prisma.recurringPayment.findMany({
            where: { userId },
            include: {
                envelope: true
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
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id
        const body = await request.json()

        const validation = recurringPaymentSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Nieprawidłowe dane', details: validation.error.errors },
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

        const recurringPayment = await prisma.recurringPayment.create({
            data: {
                userId,
                name: data.name,
                amount: data.amount,
                dayOfMonth: data.dayOfMonth,
                envelopeId: data.envelopeId,
                category: data.category,
                isActive: data.isActive
            },
            include: {
                envelope: true
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
