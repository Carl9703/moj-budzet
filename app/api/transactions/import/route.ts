import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { jsonResponse } from '@/lib/utils/api'

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

        const { amount, description, date, currency, source, cardLastFour } = body

        if (amount === undefined || !description) {
            return jsonResponse({ error: 'Missing required fields' }, { status: 400 })
        }

        // Prosta próba dopasowania z ostatnich 200 transakcji (podobna do /api/transactions/suggestions)
        let suggestedCat = null
        let suggestedEnv = null

        const recentTransactions = await prisma.transaction.findMany({
            where: { userId, type: 'expense' },
            select: { description: true, category: true, envelopeId: true },
            orderBy: { date: 'desc' },
            take: 200
        })

        // Rozbij nowy opis na słowa (dłuższe niż 2 znaki)
        const words = description.toLowerCase().split(/[\s,.-]+/).filter((w: string) => w.length > 2)
        
        let bestMatch: any = null
        let bestScore = 0

        if (words.length > 0) {
            recentTransactions.forEach(t => {
                if (!t.description) return
                const oldDesc = t.description.toLowerCase()
                let score = 0
                
                // Pierwsze słowo to z reguły nazwa sklepu, dajemy za nią najwięcej punktów
                if (oldDesc.includes(words[0])) score += 10
                
                // Za resztę słów (miasto, ulica) dajemy tylko po 1 punkcie
                for (let i = 1; i < words.length; i++) {
                    if (oldDesc.includes(words[i])) score += 1
                }

                if (score > bestScore) {
                    bestScore = score
                    bestMatch = t
                }
            })
        }

        const match = bestMatch

        if (match) {
            suggestedCat = match.category
            suggestedEnv = match.envelopeId
        }

        const parsedDate = date ? new Date(date) : new Date()

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
                suggestedEnv
            }
        })

        return jsonResponse({ success: true, pendingTransactionId: pendingTx.id })
    } catch (error) {
        console.error('Import API Error:', error)
        return jsonResponse({ error: 'Internal Server Error' }, { status: 500 })
    }
}
