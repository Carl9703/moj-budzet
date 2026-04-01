
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { z } from 'zod'
import { EXPENSE_CATEGORIES } from '@/lib/constants/categories'

const createCategorySchema = z.object({
    name: z.string().min(1, 'Nazwa jest wymagana'),
    icon: z.string().optional().default(''),
    type: z.enum(['monthly', 'yearly']),
    defaultEnvelope: z.string().optional()
})

export async function GET(request: NextRequest) {
    try {
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        const url = new URL(request.url)
        const reseed = url.searchParams.get('reseed') === 'true'
        const includeArchived = url.searchParams.get('includeArchived') === 'true'

        // Fetch categories (exclude archived by default)
        let categories = await prisma.category.findMany({
            where: {
                userId,
                ...(includeArchived ? {} : { isArchived: false })
            },
            orderBy: { name: 'asc' }
        })

        // Seed if empty OR reseed requested
        if (categories.length === 0 || reseed) {
            // console.log cleared

            const existingNames = new Set(categories.map(c => c.name))
            const missingCategories = EXPENSE_CATEGORIES.filter(c => !existingNames.has(c.name))

            if (missingCategories.length > 0) {
                // console.log cleared

                // Deduplicate items to prevent unique constraint violation within the batch itself
                const uniqueMissing = missingCategories.filter((c, index, self) =>
                    index === self.findIndex((t) => t.name === c.name)
                )

                if (uniqueMissing.length > 0) {
                    await prisma.category.createMany({
                        data: uniqueMissing.map(c => ({
                            userId,
                            name: c.name,
                            icon: c.icon,
                            type: c.type,
                            defaultEnvelope: c.defaultEnvelope || null
                        }))
                    })
                }

                // Re-fetch after seeding
                categories = await prisma.category.findMany({
                    where: { userId },
                    orderBy: { name: 'asc' }
                })
            }
        }

        return NextResponse.json(categories)

    } catch (error) {
        console.error('Error fetching/seeding categories:', error)
        return NextResponse.json(
            {
                error: 'Błąd pobierania/seedingowania kategorii',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        const body = await request.json()
        const validation = createCategorySchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Nieprawidłowe dane', details: validation.error.issues },
                { status: 400 }
            )
        }

        const category = await prisma.category.create({
            data: {
                userId,
                name: validation.data.name,
                icon: validation.data.icon,
                type: validation.data.type,
                defaultEnvelope: validation.data.defaultEnvelope || null
            }
        })

        return NextResponse.json(category)

    } catch (error) {
        console.error('Error creating category:', error)
        return NextResponse.json(
            { error: 'Błąd tworzenia kategorii' },
            { status: 500 }
        )
    }
}
