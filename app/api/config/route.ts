import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
    try {
        // Pobierz userId z JWT tokenu
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        let config = await prisma.userConfig.findUnique({ where: { userId } })

        if (!config) {
            // utwórz pustą konfigurację, jeśli brak
            config = await prisma.userConfig.create({
                data: {
                    userId,
                    defaultSalary: 0,
                    defaultToJoint: 0,
                    defaultToSavings: 0,
                    defaultToVacation: 0,
                    defaultToInvestment: 0,
                },
            })
        }

        // zwróć także listę kopert miesięcznych (do edycji planów w UI konfiguratora)
        const monthlyEnvelopes = await prisma.envelope.findMany({
            where: { userId, type: 'monthly' },
            orderBy: { name: 'asc' },
            select: { id: true, name: true, icon: true, plannedAmount: true, currentAmount: true, group: true },
        })

        return NextResponse.json({ config, monthlyEnvelopes })
    } catch (error) {
        return NextResponse.json({ error: 'Błąd pobierania konfiguracji' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        // Pobierz userId z JWT tokenu
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        const body = await request.json()
        const {
            defaultSalary,
            defaultToJoint,
            defaultToSavings,
            defaultToVacation,
            defaultToInvestment,
            monthlyEnvelopes,
        } = body as {
            defaultSalary?: number
            defaultToJoint?: number
            defaultToSavings?: number
            defaultToVacation?: number
            defaultToInvestment?: number
            monthlyEnvelopes?: { id: string; plannedAmount: number }[]
        }

        const updated = await prisma.userConfig.upsert({
            where: { userId },
            update: {
                defaultSalary: defaultSalary ?? undefined,
                defaultToJoint: defaultToJoint ?? undefined,
                defaultToSavings: defaultToSavings ?? undefined,
                defaultToVacation: defaultToVacation ?? undefined,
                defaultToInvestment: defaultToInvestment ?? undefined,
            },
            create: {
                userId,
                defaultSalary: defaultSalary ?? 0,
                defaultToJoint: defaultToJoint ?? 0,
                defaultToSavings: defaultToSavings ?? 0,
                defaultToVacation: defaultToVacation ?? 0,
                defaultToInvestment: defaultToInvestment ?? 0,
            },
        })

        // aktualizuj domyślne plany dla kopert miesięcznych, jeśli podano
        if (Array.isArray(monthlyEnvelopes) && monthlyEnvelopes.length > 0) {
            for (const env of monthlyEnvelopes) {
                await prisma.envelope.update({
                    where: { id: env.id },
                    data: { plannedAmount: env.plannedAmount },
                })
            }
        }

        return NextResponse.json({ success: true, config: updated })
    } catch (error) {
        return NextResponse.json({ error: 'Błąd zapisu konfiguracji' }, { status: 500 })
    }
}


