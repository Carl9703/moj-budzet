import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { z } from 'zod'

const incomeSchema = z.object({
    amount: z.number().positive('Kwota musi być większa od 0'),
    description: z.string().optional(),
    includeInStats: z.boolean().optional().default(true),
    type: z.enum(['salary', 'other']),
    date: z.string().optional()
})

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

        // Walidacja danych wejściowych
        const validation = incomeSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Nieprawidłowe dane', details: validation.error.issues },
                { status: 400 }
            )
        }

        const data = validation.data

        // Proste dodanie przychodu bez automatycznego podziału
        await prisma.transaction.create({
            data: {
                userId: userId,
                type: 'income',
                amount: data.amount,
                description: data.description || (data.type === 'salary' ? 'Wypłata miesięczna' : 'Inny przychód'),
                date: data.date ? new Date(data.date) : new Date(),
                includeInStats: data.includeInStats
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Przychód dodany pomyślnie!'
        })

    } catch (error) {
        console.error('Income error:', error)
        return NextResponse.json(
            { error: 'Błąd dodawania przychodu', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}