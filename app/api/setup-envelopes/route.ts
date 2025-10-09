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

        // GRUPA 1: POTRZEBY (miesięczne)
        const needsEnvelopes = [
            { name: 'Mieszkanie', plannedAmount: 1500, icon: '🏠', group: 'needs' },
            { name: 'Żywność', plannedAmount: 1200, icon: '🍕', group: 'needs' },
            { name: 'Transport', plannedAmount: 400, icon: '🚗', group: 'needs' },
            { name: 'Zdrowie i Higiena', plannedAmount: 300, icon: '💊', group: 'needs' },
            { name: 'Rachunki i Subskrypcje', plannedAmount: 200, icon: '📱', group: 'needs' }
        ]

        // GRUPA 2: STYL ŻYCIA (miesięczne)
        const lifestyleEnvelopes = [
            { name: 'Wydatki Osobiste', plannedAmount: 500, icon: '🎮', group: 'lifestyle' },
            { name: 'Gastronomia', plannedAmount: 300, icon: '🍽️', group: 'lifestyle' },
            { name: 'Ubrania i Akcesoria', plannedAmount: 200, icon: '👕', group: 'lifestyle' }
        ]

        // GRUPA 3: CELE FINANSOWE (miesięczne)
        const financialGoalsEnvelopes = [
            { name: 'Fundusz Awaryjny', plannedAmount: 1000, icon: '🚨', group: 'financial' },
            { name: 'Budowanie Przyszłości', plannedAmount: 800, icon: '📈', group: 'financial' }
        ]

        // Stwórz wszystkie koperty miesięczne
        const allMonthlyEnvelopes = [...needsEnvelopes, ...lifestyleEnvelopes, ...financialGoalsEnvelopes]
        
        for (const envelope of allMonthlyEnvelopes) {
            await prisma.envelope.create({
                data: {
                    userId,
                    name: envelope.name,
                    type: 'monthly',
                    plannedAmount: envelope.plannedAmount,
                    currentAmount: 0,
                    icon: envelope.icon,
                    group: envelope.group
                }
            })
        }

        // FUNDUSZE CELOWE (roczne)
        const targetFundsEnvelopes = [
            { name: 'Auto: Serwis i Ubezpieczenie', plannedAmount: 2000, icon: '🚗', group: 'target' },
            { name: 'Prezenty i Okazje', plannedAmount: 1500, icon: '🎁', group: 'target' },
            { name: 'Podróże', plannedAmount: 5000, icon: '✈️', group: 'target' },
            { name: 'Wesele', plannedAmount: 15000, icon: '💍', group: 'target' },
            { name: 'Wolne środki (roczne)', plannedAmount: 2000, icon: '🎉', group: 'target' }
        ]

        for (const envelope of targetFundsEnvelopes) {
            await prisma.envelope.create({
                data: {
                    userId,
                    name: envelope.name,
                    type: 'yearly',
                    plannedAmount: envelope.plannedAmount,
                    currentAmount: 0,
                    icon: envelope.icon,
                    group: envelope.group
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
