import { NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'

const MIGRATION_SECRET = 'migrate-my-data-2025'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { secret, targetEmail } = body

        if (secret !== MIGRATION_SECRET) {
            return NextResponse.json({ error: 'Nieprawidłowy secret' }, { status: 403 })
        }

        if (!targetEmail) {
            return NextResponse.json({ error: 'Brak targetEmail' }, { status: 400 })
        }

        // Znajdź wszystkich użytkowników
        const allUsers = await prisma.user.findMany({
            include: {
                _count: {
                    select: {
                        transactions: true,
                        envelopes: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        })

        if (allUsers.length === 0) {
            return NextResponse.json({ error: 'Brak użytkowników' }, { status: 404 })
        }

        // Znajdź source (użytkownik z największą liczbą transakcji)
        const sourceUser = allUsers.reduce((prev, curr) => 
            curr._count.transactions > prev._count.transactions ? curr : prev
        )

        // Znajdź target
        const targetUser = allUsers.find(u => u.email === targetEmail)
        if (!targetUser) {
            return NextResponse.json({ 
                error: `Nie znaleziono użytkownika: ${targetEmail}`,
                available: allUsers.map(u => u.email)
            }, { status: 404 })
        }

        if (sourceUser.id === targetUser.id) {
            return NextResponse.json({ error: 'To ten sam użytkownik!' }, { status: 400 })
        }

        // MIGRACJA W TRANSAKCJI
        await prisma.$transaction(async (tx) => {
            // 1. Usuń koperty target
            await tx.envelope.deleteMany({
                where: { userId: targetUser.id }
            })

            // 2. Przenieś wszystko ze source na target
            await tx.transaction.updateMany({
                where: { userId: sourceUser.id },
                data: { userId: targetUser.id }
            })

            await tx.envelope.updateMany({
                where: { userId: sourceUser.id },
                data: { userId: targetUser.id }
            })

            await tx.userConfig.updateMany({
                where: { userId: sourceUser.id },
                data: { userId: targetUser.id }
            })
        })

        return NextResponse.json({
            success: true,
            message: 'Migracja zakończona!',
            from: sourceUser.email,
            to: targetUser.email
        })

    } catch (error) {
        return NextResponse.json({
            error: 'Błąd',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 })
    }
}

