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
        let monthlyEnvelopes
        try {
            monthlyEnvelopes = await prisma.envelope.findMany({
                where: { userId, type: 'monthly' },
                orderBy: { name: 'asc' },
                select: { id: true, name: true, icon: true, plannedAmount: true, currentAmount: true, group: true },
            })
            
        } catch (dbError) {
            throw dbError
        }

        // zwróć także listę kopert rocznych (do edycji planów w UI konfiguratora)
        let yearlyEnvelopes
        try {
            yearlyEnvelopes = await prisma.envelope.findMany({
                where: { userId, type: 'yearly' },
                orderBy: { name: 'asc' },
                select: { id: true, name: true, icon: true, plannedAmount: true, currentAmount: true, group: true },
            })
            
        } catch (dbError) {
            throw dbError
        }

        return NextResponse.json({ config, monthlyEnvelopes, yearlyEnvelopes })
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
            defaultToWedding,
            defaultToGroceries,
            defaultToInvestment,
            monthlyEnvelopes,
            yearlyEnvelopes,
        } = body as {
            defaultSalary?: number
            defaultToJoint?: number
            defaultToSavings?: number
            defaultToVacation?: number
            defaultToWedding?: number
            defaultToGroceries?: number
            defaultToInvestment?: number
            monthlyEnvelopes?: { id: string; plannedAmount: number }[]
            yearlyEnvelopes?: { id: string; plannedAmount: number }[]
        }

        const updated = await prisma.userConfig.upsert({
            where: { userId },
            update: {
                defaultSalary: defaultSalary ?? undefined,
                defaultToJoint: defaultToJoint ?? undefined,
                defaultToSavings: defaultToSavings ?? undefined,
                defaultToVacation: defaultToVacation ?? undefined,
                defaultToWedding: defaultToWedding ?? undefined,
                defaultToGroceries: defaultToGroceries ?? undefined,
                defaultToInvestment: defaultToInvestment ?? undefined,
            },
            create: {
                userId,
                defaultSalary: defaultSalary ?? 0,
                defaultToJoint: defaultToJoint ?? 0,
                defaultToSavings: defaultToSavings ?? 0,
                defaultToVacation: defaultToVacation ?? 0,
                defaultToWedding: defaultToWedding ?? 0,
                defaultToGroceries: defaultToGroceries ?? 0,
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

        // aktualizuj domyślne plany dla kopert rocznych, jeśli podano
        if (Array.isArray(yearlyEnvelopes) && yearlyEnvelopes.length > 0) {
            for (const env of yearlyEnvelopes) {
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


