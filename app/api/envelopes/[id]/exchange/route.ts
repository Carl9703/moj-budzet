import { NextRequest } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { jsonResponse } from '@/lib/utils/api'
import { createFxLot } from '@/lib/services/costBasis'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

const exchangeSchema = z.object({
    foreignAmount: z.number().positive('Kwota w walucie obcej musi być > 0'),
    foreignCurrency: z.string().min(1).max(10),
    costBasisPln: z.number().positive('Kwota PLN musi być > 0'),
    date: z.string().optional(),
})

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        const { id: envelopeId } = await params
        const body = await request.json()

        let data: z.infer<typeof exchangeSchema>
        try {
            data = exchangeSchema.parse(body)
        } catch (e) {
            if (e instanceof z.ZodError) {
                return jsonResponse({ error: e.issues[0].message }, { status: 400 })
            }
            throw e
        }

        const envelope = await prisma.envelope.findFirst({
            where: { id: envelopeId, userId }
        })

        if (!envelope) {
            return jsonResponse({ error: 'Koperta nie znaleziona' }, { status: 404 })
        }

        const costBasisDec = new Prisma.Decimal(data.costBasisPln)
        if (new Prisma.Decimal(envelope.currentAmount).lessThan(costBasisDec)) {
            return jsonResponse({
                error: `Brak środków w kopercie! Dostępne: ${new Prisma.Decimal(envelope.currentAmount).toFixed(2)} zł`
            }, { status: 400 })
        }

        // Parsowanie daty
        let exchangeDate: Date
        if (data.date) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
                const [year, month, day] = data.date.split('-').map(Number)
                const now = new Date()
                exchangeDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds())
            } else {
                exchangeDate = new Date(data.date)
            }
        } else {
            exchangeDate = new Date()
        }

        const foreignAmount = new Prisma.Decimal(data.foreignAmount)
        const costBasisPln = new Prisma.Decimal(data.costBasisPln)
        const exchangeRate = costBasisPln.div(foreignAmount).toDecimalPlaces(6, Prisma.Decimal.ROUND_HALF_UP)

        // Utwórz FxLot — saldo PLN pozostaje bez zmian (wartość jest "zablokowana" w locie)
        await prisma.$transaction(async (tx) => {
            await createFxLot(tx, {
                userId,
                envelopeId,
                date: exchangeDate,
                foreignAmount,
                costBasisPln,
                exchangeRate,
                foreignCurrency: data.foreignCurrency,
            })
        })

        return jsonResponse({
            success: true,
            message: `Zarejestrowano: ${data.foreignAmount} ${data.foreignCurrency} @ ${exchangeRate.toFixed(4)} PLN/${data.foreignCurrency}`
        })
    } catch (error) {
        console.error('Exchange error:', error)
        return jsonResponse({ error: 'Błąd rejestracji wymiany' }, { status: 500 })
    }
}
