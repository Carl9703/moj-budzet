import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
    try {
        // Pobierz userId z JWT tokenu
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        // Sprawdź czy użytkownik już ma koperty
        const existingEnvelopes = await prisma.envelope.findMany({
            where: { userId }
        })

        if (existingEnvelopes.length > 0) {
            return NextResponse.json(
                { error: 'Użytkownik już ma skonfigurowane koperty' },
                { status: 400 }
            )
        }

        // Stwórz koperty miesięczne
        const monthlyEnvelopes = [
            { name: 'Jedzenie', plannedAmount: 1200, icon: '🍕' },
            { name: 'Transport', plannedAmount: 400, icon: '🚗' },
            { name: 'Rozrywka', plannedAmount: 300, icon: '🎬' },
            { name: 'Higiena/Zdrowie', plannedAmount: 200, icon: '💊' },
            { name: 'Ubrania', plannedAmount: 200, icon: '👕' },
            { name: 'Dom', plannedAmount: 300, icon: '🏠' },
            { name: 'Telekom/Subskrypcje', plannedAmount: 150, icon: '📱' },
            { name: 'Nieprzewidziane', plannedAmount: 250, icon: '⚠️' }
        ]

        for (const envelope of monthlyEnvelopes) {
            await prisma.envelope.create({
                data: {
                    userId,
                    name: envelope.name,
                    type: 'monthly',
                    plannedAmount: envelope.plannedAmount,
                    currentAmount: 0,
                    icon: envelope.icon
                }
            })
        }

        // Stwórz koperty roczne
        const yearlyEnvelopes = [
            { name: 'Wakacje', plannedAmount: 5000, icon: '✈️' },
            { name: 'Prezenty', plannedAmount: 2000, icon: '🎁' },
            { name: 'OC', plannedAmount: 800, icon: '📋' },
            { name: 'Święta', plannedAmount: 1500, icon: '🎄' },
            { name: 'Awaryjne', plannedAmount: 10000, icon: '🚨' },
            { name: 'Wolne środki (roczne)', plannedAmount: 2000, icon: '💰' }
        ]

        for (const envelope of yearlyEnvelopes) {
            await prisma.envelope.create({
                data: {
                    userId,
                    name: envelope.name,
                    type: 'yearly',
                    plannedAmount: envelope.plannedAmount,
                    currentAmount: 0,
                    icon: envelope.icon
                }
            })
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Koperty zostały utworzone pomyślnie' 
        })

    } catch (error) {
        return NextResponse.json(
            { error: 'Błąd tworzenia kopert' },
            { status: 500 }
        )
    }
}
