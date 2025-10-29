import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { incomeSchema } from '@/lib/validations/transaction'

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

        // Parsuj datę w lokalnej strefie czasowej
        let transactionDate: Date
        if (data.date) {
            // Jeśli data jest tylko datą (YYYY-MM-DD), dodaj aktualną godzinę
            const dateString = data.date
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                // Data bez czasu - użyj aktualnej godziny z tej daty
                const [year, month, day] = dateString.split('-').map(Number)
                const now = new Date()
                transactionDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds())
            } else {
                // Pełna data z czasem - użyj bezpośrednio
                transactionDate = new Date(dateString)
            }
        } else {
            transactionDate = new Date()
        }

        // Prosty zapis przychodu bez automatycznego podziału
            await prisma.transaction.create({
                data: {
                    userId: userId,
                    type: 'income',
                    amount: data.amount,
                description: data.description || (data.type === 'salary' ? 'Wypłata' : data.type === 'bonus' ? 'Premia' : 'Inny przychód'),
                    date: transactionDate,
                includeInStats: data.includeInStats !== false
            }
        })

        const response = NextResponse.json({ success: true })
        
        // Wyłącz cache dla świeżych danych
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')
        
        return response

    } catch (error) {
        console.error('Error creating income:', error)
        return NextResponse.json(
            { error: 'Błąd serwera' },
            { status: 500 }
        )
    }
}