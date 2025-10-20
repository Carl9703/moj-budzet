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
    isActive: z.boolean().optional()
})

export async function PUT(
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
        const body = await request.json()

        const validation = recurringPaymentSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Nieprawidłowe dane', details: validation.error.issues },
                { status: 400 }
            )
        }

        const data = validation.data

        // Sprawdź czy płatność należy do użytkownika
        const existingPayment = await prisma.recurringPayment.findFirst({
            where: {
                id: paymentId,
                userId: userId
            }
        })

        if (!existingPayment) {
            return NextResponse.json({ error: 'Płatność nie znaleziona' }, { status: 404 })
        }

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

        const updatedPayment = await prisma.recurringPayment.update({
            where: { id: paymentId },
            data: {
                name: data.name,
                amount: data.amount,
                dayOfMonth: data.dayOfMonth,
                envelopeId: data.envelopeId,
                category: data.category,
                isActive: data.isActive,
                dismissedUntil: null // Reset dismissed status when editing
            },
            include: {
                envelope: true
            }
        })

        return NextResponse.json({
            success: true,
            recurringPayment: updatedPayment,
            message: 'Płatność cykliczna została zaktualizowana'
        })

    } catch (error) {
        console.error('Error updating recurring payment:', error)
        return NextResponse.json(
            { error: 'Błąd aktualizacji płatności cyklicznej', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
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

        // Sprawdź czy płatność należy do użytkownika
        const existingPayment = await prisma.recurringPayment.findFirst({
            where: {
                id: paymentId,
                userId: userId
            }
        })

        if (!existingPayment) {
            return NextResponse.json({ error: 'Płatność nie znaleziona' }, { status: 404 })
        }

        await prisma.recurringPayment.delete({
            where: { id: paymentId }
        })

        return NextResponse.json({
            success: true,
            message: 'Płatność cykliczna została usunięta'
        })

    } catch (error) {
        console.error('Error deleting recurring payment:', error)
        return NextResponse.json(
            { error: 'Błąd usuwania płatności cyklicznej', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
