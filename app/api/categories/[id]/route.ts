
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { z } from 'zod'
import { jsonResponse } from '@/lib/utils/api'

const updateCategorySchema = z.object({
    name: z.string().min(1).optional(),
    icon: z.string().optional(),
    defaultEnvelope: z.string().optional(),
    isArchived: z.boolean().optional()
})


export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        const params = await context.params
        const body = await request.json()
        const validation = updateCategorySchema.safeParse(body)

        if (!validation.success) {
            return jsonResponse(
                { error: 'Nieprawidłowe dane', details: validation.error.issues },
                { status: 400 }
            )
        }

        // Verify ownership
        const existing = await prisma.category.findUnique({
            where: { id: params.id }
        })

        if (!existing || existing.userId !== userId) {
            return jsonResponse({ error: 'Kategoria nie znaleziona' }, { status: 404 })
        }

        const updated = await prisma.category.update({
            where: { id: params.id },
            data: validation.data
        })

        return jsonResponse(updated)

    } catch (error) {
        return jsonResponse(
            { error: 'Błąd aktualizacji kategorii' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        const params = await context.params

        // Verify ownership
        const existing = await prisma.category.findUnique({
            where: { id: params.id }
        })

        if (!existing || existing.userId !== userId) {
            return jsonResponse({ error: 'Kategoria nie znaleziona' }, { status: 404 })
        }

        // Check if category has transactions (by ID or name - legacy support)
        const transactionCount = await prisma.transaction.count({
            where: {
                userId,
                OR: [
                    { category: existing.id },
                    { category: existing.name }
                ]
            }
        })

        if (transactionCount > 0) {
            // Archive instead of delete
            await prisma.category.update({
                where: { id: params.id },
                data: { isArchived: true }
            })

            return jsonResponse({
                success: true,
                archived: true,
                message: `Kategoria została zarchiwizowana (${transactionCount} transakcji)`
            })
        }

        // No transactions - safe to delete
        await prisma.category.delete({
            where: { id: params.id }
        })

        return jsonResponse({ success: true, archived: false })

    } catch (error) {
        console.error('Error deleting/archiving category:', error)
        return jsonResponse(
            { error: 'Błąd usuwania kategorii' },
            { status: 500 }
        )
    }
}

// GET endpoint to check if category can be deleted (for UI confirmation)
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        const params = await context.params

        const category = await prisma.category.findUnique({
            where: { id: params.id }
        })

        if (!category || category.userId !== userId) {
            return jsonResponse({ error: 'Kategoria nie znaleziona' }, { status: 404 })
        }

        // Count transactions (by ID or name - legacy support)
        const transactionCount = await prisma.transaction.count({
            where: {
                userId,
                OR: [
                    { category: category.id },
                    { category: category.name }
                ]
            }
        })

        return jsonResponse({
            category,
            transactionCount,
            canDelete: transactionCount === 0,
            willArchive: transactionCount > 0
        })

    } catch (error) {
        return jsonResponse(
            { error: 'Błąd pobierania kategorii' },
            { status: 500 }
        )
    }
}
