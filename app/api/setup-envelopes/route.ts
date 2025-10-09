import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
    try {
        console.log('🚀 Rozpoczynam tworzenie kopert...')
        
        // Timeout dla całej operacji (30 sekund)
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout: Operacja trwa zbyt długo')), 30000)
        })
        
        const operationPromise = (async () => {
        
        // Pobierz userId z JWT tokenu
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
            console.log('✅ UserId pobrany:', userId)
        } catch (error) {
            console.error('❌ Błąd autoryzacji:', error)
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        // Sprawdź czy użytkownik ma nowe koperty (z grupami)
        console.log('🔍 Sprawdzam istniejące koperty...')
        let existingEnvelopes
        try {
            existingEnvelopes = await prisma.envelope.findMany({
                where: { userId }
            })
            console.log('📊 Znaleziono kopert:', existingEnvelopes.length)
            console.log('📋 Koperty:', existingEnvelopes.map(e => ({ name: e.name, group: e.group })))
        } catch (error) {
            console.error('❌ Błąd podczas sprawdzania kopert:', error)
            throw error
        }

        // Jeśli ma stare koperty (bez group), usuń je i utwórz nowe
        if (existingEnvelopes.length > 0) {
            const hasNewStructure = existingEnvelopes.some(e => e.group !== null)
            console.log('🔄 Ma nową strukturę:', hasNewStructure)
            
            if (hasNewStructure) {
                console.log('❌ Użytkownik już ma nowe koperty - blokuję')
                return NextResponse.json(
                    { error: 'Użytkownik już ma skonfigurowane koperty' },
                    { status: 400 }
                )
            } else {
                console.log('🗑️ Usuwam stare koperty...')
                // Usuń stare koperty
                await prisma.envelope.deleteMany({
                    where: { userId }
                })
                console.log('✅ Stare koperty usunięte')
            }
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
            try {
                console.log('Tworzenie koperty:', envelope.name, 'group:', envelope.group)
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
                console.log('Koperta utworzona:', envelope.name)
            } catch (error) {
                console.error('Błąd podczas tworzenia koperty:', envelope.name, error)
                throw error
            }
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
            try {
                console.log('Tworzenie koperty rocznej:', envelope.name, 'group:', envelope.group)
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
                console.log('Koperta roczna utworzona:', envelope.name)
            } catch (error) {
                console.error('Błąd podczas tworzenia koperty rocznej:', envelope.name, error)
                throw error
            }
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
