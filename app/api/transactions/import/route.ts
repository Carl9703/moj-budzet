import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { jsonResponse } from '@/lib/utils/api'
import { z } from 'zod'
import { buildMerchantSuggestion } from '@/lib/services/merchantSuggestions'

const importSchema = z.object({
    amount: z.number().positive('Kwota musi być większa od zera'),
    description: z.string().min(1, 'Opis jest wymagany'),
    date: z.string().or(z.date()).optional(),
    currency: z.string().optional(),
    source: z.string().optional(),
    cardLastFour: z.string().optional()
})

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]

        // Znajdź użytkownika po apiToken
        const userConfig = await prisma.userConfig.findUnique({
            where: { apiToken: token },
            select: { userId: true }
        })

        if (!userConfig) {
            return jsonResponse({ error: 'Invalid API Token' }, { status: 401 })
        }

        const userId = userConfig.userId
        const body = await req.json()

        const validation = importSchema.safeParse(body)

        if (!validation.success) {
            return jsonResponse({ error: 'Nieprawidłowe dane', details: validation.error.issues }, { status: 400 })
        }

        const { amount, description, date, currency, source, cardLastFour } = validation.data

        const parsedDate = date ? new Date(date) : new Date()

        // IDEMPOTENCY CHECK (Deduplikacja)
        // Szukaj takiej samej oczekującej transakcji (ta sama kwota, źródło i opis) w ciągu ostatnich 30 sekund
        const idempotencyWindow = new Date(parsedDate.getTime() - 30 * 1000)
        
        const existingPending = await prisma.pendingTransaction.findFirst({
            where: {
                userId,
                amount,
                source: source || 'api',
                createdAt: {
                    gte: idempotencyWindow
                }
            }
        })

        if (existingPending) {
            // Jeśli istnieje z tym samym opisem, potraktuj jako powtórzenie (retry) i zwróć OK, 
            // ale nie twórz nowej w bazie. (Używamy includes dla bezpieczeństwa przy lekkich różnicach w nazwach)
            if (existingPending.description.includes(description) || description.includes(existingPending.description)) {
                return jsonResponse({ success: true, pendingTransactionId: existingPending.id, duplicate: true })
            }
        }

        // Sugestie: nauczone reguły sprzedawców, a w razie ich braku historia transakcji.
        // Wynik poniżej progu pewności zwraca null - patrz lib/utils/merchantMatch.ts
        const { suggestedCat, suggestedEnv, suggestedDesc } = await buildMerchantSuggestion(
            prisma,
            userId,
            description
        )

        const pendingTx = await prisma.pendingTransaction.create({
            data: {
                userId,
                amount,
                currency: currency || 'PLN',
                description,
                date: parsedDate,
                source: source || 'api',
                cardLastFour: cardLastFour || null,
                suggestedCat,
                suggestedEnv,
                suggestedDesc
            }
        })

        return jsonResponse({ success: true, pendingTransactionId: pendingTx.id })
    } catch (error) {
        console.error('Import API Error:', error)
        return jsonResponse({ error: 'Internal Server Error' }, { status: 500 })
    }
}
