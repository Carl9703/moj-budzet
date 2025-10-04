import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const SECRET = 'migrate-my-data-2025'
const prismaClient = new PrismaClient()

export async function POST(request: Request) {
    try {
        const body = await request.json()
        
        if (body.secret !== SECRET) {
            return NextResponse.json({ error: 'Wrong secret' }, { status: 403 })
        }

        const targetEmail = body.targetEmail
        if (!targetEmail) {
            return NextResponse.json({ error: 'No targetEmail' }, { status: 400 })
        }

        // Wszyscy użytkownicy
        const users = await prismaClient.user.findMany({
            include: { _count: { select: { transactions: true } } },
            orderBy: { createdAt: 'asc' }
        })

        // Source (najwięcej transakcji)
        let source = users[0]
        for (const u of users) {
            if (u._count.transactions > source._count.transactions) {
                source = u
            }
        }

        // Target
        const target = users.find(u => u.email === targetEmail)
        if (!target) {
            return NextResponse.json({ error: 'Target not found' }, { status: 404 })
        }

        if (source.id === target.id) {
            return NextResponse.json({ error: 'Same user!' }, { status: 400 })
        }

        // MIGRACJA
        await prismaClient.$transaction(async (tx) => {
            await tx.envelope.deleteMany({ where: { userId: target.id } })
            await tx.transaction.updateMany({ where: { userId: source.id }, data: { userId: target.id } })
            await tx.envelope.updateMany({ where: { userId: source.id }, data: { userId: target.id } })
            await tx.userConfig.updateMany({ where: { userId: source.id }, data: { userId: target.id } })
        })

        return NextResponse.json({
            success: true,
            from: source.email,
            to: target.email
        })

    } catch (err) {
        const error = err as Error
        return NextResponse.json({ error: error.message }, { status: 500 })
    } finally {
        await prismaClient.$disconnect()
    }
}

