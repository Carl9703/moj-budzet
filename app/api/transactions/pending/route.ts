import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { jsonResponse } from '@/lib/utils/api'
import { z } from 'zod'
import { learnMerchantRule } from '@/lib/services/merchantSuggestions'

const approvePendingSchema = z.object({
    pendingId: z.string().min(1),
    amount: z.number().positive('Kwota musi być większa od zera'),
    description: z.string().min(1, 'Opis jest wymagany'),
    date: z.string().or(z.date()),
    envelopeId: z.string().optional().nullable(),
    category: z.string().optional().nullable()
})

export async function GET(request: NextRequest) {
    try {
        const userId = await getUserIdFromToken(request)
        const pending = await prisma.pendingTransaction.findMany({
            where: { userId },
            orderBy: { date: 'desc' }
        })
        return jsonResponse({ pendingTransactions: pending })
    } catch (error) {
        return unauthorizedResponse('Brak autoryzacji')
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = await getUserIdFromToken(request)
        const body = await request.json()
        const validation = approvePendingSchema.safeParse(body)
        if (!validation.success) {
            return jsonResponse(
                { error: 'Nieprawidłowe dane', details: validation.error.issues },
                { status: 400 }
            )
        }

        const { pendingId, amount, description, date, envelopeId, category } = validation.data

        // Upewnij się, że transakcja istnieje i należy do usera
        const pending = await prisma.pendingTransaction.findUnique({
            where: { id: pendingId }
        })

        if (!pending || pending.userId !== userId) {
            return jsonResponse({ error: 'Pending transaction not found' }, { status: 404 })
        }

        if (envelopeId) {
            const envelope = await prisma.envelope.findFirst({
                where: { id: envelopeId, userId }
            })
            if (!envelope) {
                return jsonResponse({ error: 'Koperta nie należy do użytkownika' }, { status: 403 })
            }
        }

        // Utworzenie nowej "prawdziwej" transakcji
        // Oczekujące transakcje traktujemy jako WYDATKI (type: 'expense')
        await prisma.$transaction(async (tx) => {
            const newTx = await tx.transaction.create({
                data: {
                    userId,
                    type: 'expense',
                    amount: amount,
                    description: description,
                    date: new Date(date),
                    envelopeId: envelopeId || null,
                    category: category || null,
                    includeInStats: true
                }
            })

            // Jeśli wybrano kopertę, zdejmij z niej środki
            if (envelopeId) {
                await tx.envelope.update({
                    where: { id: envelopeId },
                    data: { currentAmount: { decrement: amount } }
                })
            }

            // Zapamiętaj decyzję użytkownika, żeby ten sam sprzedawca był
            // rozpoznany przy kolejnym imporcie (patrz lib/services/merchantSuggestions.ts)
            await learnMerchantRule(tx, userId, pending.description, {
                description,
                category: category || null,
                envelopeId: envelopeId || null
            })

            // Usuń pending
            await tx.pendingTransaction.delete({
                where: { id: pendingId }
            })
        })

        return jsonResponse({ success: true })
    } catch (error) {
        console.error('Error approving pending transaction:', error)
        return jsonResponse({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const userId = await getUserIdFromToken(request)
        const { searchParams } = new URL(request.url)
        const pendingId = searchParams.get('id')

        if (!pendingId) {
            return jsonResponse({ error: 'Missing pendingId' }, { status: 400 })
        }

        const pending = await prisma.pendingTransaction.findUnique({
            where: { id: pendingId }
        })

        if (!pending || pending.userId !== userId) {
            return jsonResponse({ error: 'Not found' }, { status: 404 })
        }

        await prisma.pendingTransaction.delete({
            where: { id: pendingId }
        })

        return jsonResponse({ success: true })
    } catch (error) {
        console.error('Error deleting pending transaction:', error)
        return jsonResponse({ error: 'Internal Server Error' }, { status: 500 })
    }
}
