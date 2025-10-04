import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const MIGRATION_SECRET = 'migrate-my-data-2025'

// Bezpośrednie połączenie bez env.ts
const prisma = new PrismaClient()

export async function POST(request: Request) {
    try {
        const { secret, targetEmail } = await request.json()

        if (secret !== MIGRATION_SECRET) {
            return NextResponse.json({ error: 'Nieprawidłowy secret' }, { status: 403 })
        }

        // Znajdź wszystkich użytkowników
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                _count: { select: { transactions: true, envelopes: true } }
            },
            orderBy: { createdAt: 'asc' }
        })

        // Użytkownik z danymi (najwięcej transakcji)
        const userWithData = allUsers.reduce((prev, current) => 
            (current._count.transactions > prev._count.transactions) ? current : prev
        )

        // Docelowy użytkownik
        const targetUser = allUsers.find(u => u.email === targetEmail)
        if (!targetUser) {
            return NextResponse.json({ error: `Nie znaleziono: ${targetEmail}` }, { status: 404 })
        }

        if (targetUser._count.transactions > 0) {
            return NextResponse.json({ error: 'Target już ma transakcje!' }, { status: 400 })
        }

        if (userWithData.id === targetUser.id) {
            return NextResponse.json({ error: 'Source i target to ten sam user!' }, { status: 400 })
        }

        // MIGRACJA
        const result = await prisma.$transaction(async (tx) => {
            // Usuń puste koperty target
            await tx.envelope.deleteMany({ where: { userId: targetUser.id } })

            // Przenieś transakcje
            const trans = await tx.transaction.updateMany({
                where: { userId: userWithData.id },
                data: { userId: targetUser.id }
            })

            // Przenieś koperty
            const env = await tx.envelope.updateMany({
                where: { userId: userWithData.id },
                data: { userId: targetUser.id }
            })

            // Przenieś config
            const cfg = await tx.userConfig.updateMany({
                where: { userId: userWithData.id },
                data: { userId: targetUser.id }
            })

            return { transactionsMoved: trans.count, envelopesMoved: env.count, configMoved: cfg.count }
        })

        return NextResponse.json({
            success: true,
            message: '✅ Migracja zakończona pomyślnie!',
            source: { email: userWithData.email, name: userWithData.name },
            target: { email: targetUser.email, name: targetUser.name },
            migrated: result
        })

    } catch (error) {
        return NextResponse.json({
            error: 'Błąd migracji',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}

