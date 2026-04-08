import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { prisma } from '@/lib/utils/prisma'
import { AssetType } from '@prisma/client'
import { jsonResponse } from '@/lib/utils/api'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getUserIdFromToken(request)
        const { id } = await params
        const body = await request.json()
        const {
            symbol, quantity, averagePurchasePrice, type,
            totalContributed, manualCurrentValue
        } = body

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
                ...(quantity !== undefined && { quantity: parseFloat(String(quantity).replace(',', '.')) }),
                ...(averagePurchasePrice !== undefined && { averagePurchasePrice: parseFloat(String(averagePurchasePrice).replace(',', '.')) }),
                ...(type && { type: type as AssetType }),
                ...(totalContributed !== undefined && { totalContributed: parseFloat(String(totalContributed).replace(',', '.')) }),
                // Allow resetting to null if passed explicitly? Or just update if value.
                // Assuming client sends value to update.
                ...(manualCurrentValue !== undefined && { manualCurrentValue: parseFloat(String(manualCurrentValue).replace(',', '.')) }),
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
