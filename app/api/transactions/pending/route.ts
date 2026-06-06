import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { jsonResponse } from '@/lib/utils/api'

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
        const { pendingId, amount, description, date, envelopeId, category } = body

        if (!pendingId || amount === undefined || !description) {
            return jsonResponse({ error: 'Missing required fields' }, { status: 400 })
        }

        // Upewnij się, że transakcja istnieje i należy do usera
        const pending = await prisma.pendingTransaction.findUnique({
            where: { id: pendingId }
        })

        if (!pending || pending.userId !== userId) {
            return jsonResponse({ error: 'Pending transaction not found' }, { status: 404 })
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
