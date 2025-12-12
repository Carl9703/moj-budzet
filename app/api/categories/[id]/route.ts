
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { z } from 'zod'

const updateCategorySchema = z.object({
    name: z.string().min(1).optional(),
    icon: z.string().min(1).optional(),
    defaultEnvelope: z.string().optional()
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
            return NextResponse.json(
                { error: 'Nieprawidłowe dane', details: validation.error.issues },
                { status: 400 }
            )
        }

        // Verify ownership
        const existing = await prisma.category.findUnique({
            where: { id: params.id }
        })

        if (!existing || existing.userId !== userId) {
            return NextResponse.json({ error: 'Kategoria nie znaleziona' }, { status: 404 })
        }

        const updated = await prisma.category.update({
            where: { id: params.id },
            data: validation.data
        })

        return NextResponse.json(updated)

    } catch (error) {
        return NextResponse.json(
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
            return NextResponse.json({ error: 'Kategoria nie znaleziona' }, { status: 404 })
        }

        await prisma.category.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        return NextResponse.json(
            { error: 'Błąd usuwania kategorii' },
            { status: 500 }
        )
    }
}
