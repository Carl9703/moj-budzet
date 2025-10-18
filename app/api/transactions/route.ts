import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { createTransactionSchema } from '@/lib/validations/transaction'
import { z } from 'zod'

export async function GET(request: NextRequest) {
    try {
        // Pobierz userId z JWT tokenu
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        const { searchParams } = new URL(request.url)
        const envelopeId = searchParams.get('envelopeId')
        const limit = parseInt(searchParams.get('limit') || '100')

        const whereClause: any = { userId }
        if (envelopeId) {
            whereClause.envelopeId = envelopeId
        }

        const transactions = await prisma.transaction.findMany({
            where: whereClause,
            include: {
                envelope: true
            },
            orderBy: { date: 'desc' },
            take: limit
        })

        // Formatuj dane
        const formatted = transactions.map(t => {
            let category: string | undefined = t.category || undefined

            // Jeśli nie ma zapisanej kategorii, spróbuj wyprowadzić z opisu
            if (!category && t.description) {
                const desc = t.description.toLowerCase()
                if (desc.includes('transfer: konto wspólne')) {
                    category = 'joint-account'
                } else if (desc.includes('transfer: inwestycje')) {
                    category = 'investments'
                } else if (desc.includes('transfer:')) {
                    category = 'transfers'
                } else if (desc.includes('zamknięcie miesiąca')) {
                    category = 'month-close'
                }
            }

            return {
                id: t.id,
                type: t.type,
                amount: t.amount,
                description: t.description,
                date: t.date.toISOString(),
                category, // Może być undefined
                envelope: t.envelope ? {
                    name: t.envelope.name,
                    icon: t.envelope.icon || '📦'
                } : null
            }
        })

        return NextResponse.json(formatted)

    } catch (error) {
        return NextResponse.json(
            { error: 'Błąd pobierania transakcji' },
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

        // Walidacja danych wejściowych
        const validation = createTransactionSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Nieprawidłowe dane', details: validation.error.issues },
                { status: 400 }
            )
        }

        const data = validation.data

        const transactionDate = data.date ? new Date(data.date) : new Date()

        const transaction = await prisma.transaction.create({
            data: {
                userId,
                type: data.type,
                amount: data.amount,
                description: data.description || '',
                date: transactionDate,
                envelopeId: data.envelopeId || null,
                category: data.category || null
            }
        })

        if (data.type === 'expense' && data.envelopeId) {
            const envelope = await prisma.envelope.findUnique({
                where: { id: data.envelopeId }
            })

            if (envelope) {
                if (envelope.type === 'monthly') {
                    await prisma.envelope.update({
                        where: { id: data.envelopeId },
                        data: {
                            currentAmount: envelope.currentAmount - data.amount
                        }
                    })
                } else if (envelope.type === 'yearly') {
                    await prisma.envelope.update({
                        where: { id: data.envelopeId },
                        data: {
                            currentAmount: envelope.currentAmount - data.amount
                        }
                    })
                }
            }
        }

        return NextResponse.json(transaction)

    } catch (error) {
        return NextResponse.json(
            { error: 'Błąd zapisywania transakcji' },
            { status: 500 }
        )
    }
}