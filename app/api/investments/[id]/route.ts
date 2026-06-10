import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { prisma } from '@/lib/utils/prisma'
import { AssetType } from '@prisma/client'
import { jsonResponse } from '@/lib/utils/api'
import { z } from 'zod'

const updateInvestmentSchema = z.object({
    symbol: z.string().min(1).optional(),
    quantity: z.number().min(0, 'Ilość nie może być ujemna').optional(),
    averagePurchasePrice: z.number().min(0, 'Cena nie może być ujemna').optional(),
    type: z.enum(['CRYPTO', 'STOCK', 'PPK']).optional(),
    totalContributed: z.number().min(0).optional().nullable(),
    manualCurrentValue: z.number().min(0).optional().nullable()
})

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getUserIdFromToken(request)
        const { id } = await params
        const body = await request.json()
        // Transform string inputs to numbers first if they are passed as strings with commas
        const preprocessedBody = { ...body }
        if (typeof preprocessedBody.quantity === 'string') preprocessedBody.quantity = parseFloat(preprocessedBody.quantity.replace(',', '.'))
        if (typeof preprocessedBody.averagePurchasePrice === 'string') preprocessedBody.averagePurchasePrice = parseFloat(preprocessedBody.averagePurchasePrice.replace(',', '.'))
        if (typeof preprocessedBody.totalContributed === 'string') preprocessedBody.totalContributed = parseFloat(preprocessedBody.totalContributed.replace(',', '.'))
        if (typeof preprocessedBody.manualCurrentValue === 'string') preprocessedBody.manualCurrentValue = parseFloat(preprocessedBody.manualCurrentValue.replace(',', '.'))

        const validation = updateInvestmentSchema.safeParse(preprocessedBody)
        if (!validation.success) {
            return jsonResponse({ error: 'Nieprawidłowe dane', details: validation.error.issues }, { status: 400 })
        }

        const {
            symbol, quantity, averagePurchasePrice, type,
            totalContributed, manualCurrentValue
        } = validation.data

        const position = await prisma.investmentAsset.findUnique({
            where: { id }
        })

        if (!position || position.userId !== userId) {
            return jsonResponse({ error: 'Position not found' }, { status: 404 })
        }

        const updatedPosition = await prisma.investmentAsset.update({
            where: { id },
            data: {
                ...(symbol && { symbol: symbol.toUpperCase() }),
                ...(quantity !== undefined && { quantity }),
                ...(averagePurchasePrice !== undefined && { averagePurchasePrice }),
                ...(type && { type: type as AssetType }),
                ...(totalContributed !== undefined && { totalContributed }),
                ...(manualCurrentValue !== undefined && { manualCurrentValue }),
            }
        })

        return jsonResponse(updatedPosition)
    } catch (error) {
        console.error('Error updating investment:', error)
        if (error instanceof Error && error.message.includes('Brak autoryzacji')) {
            return unauthorizedResponse('Brak autoryzacji')
        }
        return jsonResponse({ error: 'Failed to update investment' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getUserIdFromToken(request)
        const { id } = await params

        const position = await prisma.investmentAsset.findUnique({
            where: { id }
        })

        if (!position) {
            return jsonResponse({ error: 'Position not found' }, { status: 404 })
        }

        if (position.userId !== userId) {
            return jsonResponse({ error: 'Unauthorized' }, { status: 403 })
        }

        await prisma.investmentAsset.delete({
            where: { id }
        })

        return jsonResponse({ success: true })
    } catch (error) {
        console.error('Error deleting investment:', error)
        if (error instanceof Error && error.message.includes('Brak autoryzacji')) {
            return unauthorizedResponse(error.message)
        }
        return jsonResponse({
            error: 'Failed to delete investment',
        }, { status: 500 })
    }
}
