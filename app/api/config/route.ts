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

        // Pobierz parametr archived z query string (domyślnie false - aktywne koperty)
        const { searchParams } = new URL(request.url)
        const archivedParam = searchParams.get('archived')
        const isArchived = archivedParam === 'true'

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
                    defaultToWedding: 0,
                    defaultToGroceries: 0,
                    bonusDistribution: null,
                },
            })
        }

        
        // zwróć także listę kopert miesięcznych (do edycji planów w UI konfiguratora)
        let monthlyEnvelopes
        try {
            monthlyEnvelopes = await prisma.envelope.findMany({
                where: { 
                    userId, 
                    type: 'monthly',
                    isArchived: isArchived
                },
                orderBy: { name: 'asc' },
                select: { id: true, name: true, icon: true, plannedAmount: true, currentAmount: true, group: true, isArchived: true },
            })
        } catch (dbError) {
            // Jeśli błąd związany z kolumną isArchived, spróbuj bez filtrowania
            try {
                monthlyEnvelopes = await prisma.envelope.findMany({
                    where: { userId, type: 'monthly' },
                    orderBy: { name: 'asc' },
                    select: { id: true, name: true, icon: true, plannedAmount: true, currentAmount: true, group: true, isArchived: true },
                })
                // Filtruj ręcznie jeśli kolumna nie istnieje
                if (!isArchived) {
                    monthlyEnvelopes = monthlyEnvelopes.filter(e => !e.isArchived)
                } else {
                    monthlyEnvelopes = monthlyEnvelopes.filter(e => e.isArchived)
                }
            } catch (fallbackError) {
                monthlyEnvelopes = []
            }
        }

        // zwróć także listę kopert rocznych (do edycji planów w UI konfiguratora)
        let yearlyEnvelopes
        try {
            yearlyEnvelopes = await prisma.envelope.findMany({
                where: { 
                    userId, 
                    type: 'yearly',
                    isArchived: isArchived
                },
                orderBy: { name: 'asc' },
                select: { id: true, name: true, icon: true, plannedAmount: true, currentAmount: true, group: true, isArchived: true },
            })
        } catch (dbError) {
            // Jeśli błąd związany z kolumną isArchived, spróbuj bez filtrowania
            try {
                yearlyEnvelopes = await prisma.envelope.findMany({
                    where: { userId, type: 'yearly' },
                    orderBy: { name: 'asc' },
                    select: { id: true, name: true, icon: true, plannedAmount: true, currentAmount: true, group: true, isArchived: true },
                })
                // Filtruj ręcznie jeśli kolumna nie istnieje
                if (!isArchived) {
                    yearlyEnvelopes = yearlyEnvelopes.filter(e => !e.isArchived)
                } else {
                    yearlyEnvelopes = yearlyEnvelopes.filter(e => e.isArchived)
                }
            } catch (fallbackError) {
                yearlyEnvelopes = []
            }
        }

        const response = NextResponse.json({ config, monthlyEnvelopes, yearlyEnvelopes })
        
        // Wyłącz cache dla świeżych danych
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')
        
        return response
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
            bonusDistribution,
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
            bonusDistribution?: string
            monthlyEnvelopes?: { id: string; plannedAmount: number }[]
            yearlyEnvelopes?: { id: string; plannedAmount: number }[]
        }

        const updateData: any = {}
        if (defaultSalary !== undefined) updateData.defaultSalary = defaultSalary
        if (defaultToJoint !== undefined) updateData.defaultToJoint = defaultToJoint
        if (defaultToSavings !== undefined) updateData.defaultToSavings = defaultToSavings
        if (defaultToVacation !== undefined) updateData.defaultToVacation = defaultToVacation
        if (defaultToWedding !== undefined) updateData.defaultToWedding = defaultToWedding
        if (defaultToGroceries !== undefined) updateData.defaultToGroceries = defaultToGroceries
        if (defaultToInvestment !== undefined) updateData.defaultToInvestment = defaultToInvestment
        // bonusDistribution może być string (JSON) lub null
        if (bonusDistribution !== undefined) {
            updateData.bonusDistribution = bonusDistribution === null || bonusDistribution === '' ? null : bonusDistribution
        }

        const updated = await prisma.userConfig.upsert({
            where: { userId },
            update: updateData,
            create: {
                userId,
                defaultSalary: defaultSalary ?? 0,
                defaultToJoint: defaultToJoint ?? 0,
                defaultToSavings: defaultToSavings ?? 0,
                defaultToVacation: defaultToVacation ?? 0,
                defaultToWedding: defaultToWedding ?? 0,
                defaultToGroceries: defaultToGroceries ?? 0,
                defaultToInvestment: defaultToInvestment ?? 0,
                bonusDistribution: bonusDistribution ?? null,
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
        console.error('Error saving config:', error)
        const errorMessage = error instanceof Error ? error.message : 'Błąd zapisu konfiguracji'
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}


