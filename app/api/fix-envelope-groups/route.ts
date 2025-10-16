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


        // Mapowanie nazw kopert na grupy
        const envelopeGroupMap: { [key: string]: string } = {
            'Mieszkanie': 'needs',
            'Żywność': 'needs',
            'Transport': 'needs',
            'Zdrowie i Higiena': 'needs',
            'Rachunki i Subskrypcje': 'needs',
            'Wydatki Osobiste': 'lifestyle',
            'Gastronomia': 'lifestyle',
            'Ubrania i Akcesoria': 'lifestyle',
            'Fundusz Awaryjny': 'financial',
            'Budowanie Przyszłości': 'financial',
            'Auto: Serwis i Ubezpieczenie': 'target',
            'Prezenty i Okazje': 'target',
            'Podróże': 'target',
            'Wesele': 'target',
            'Wolne środki (roczne)': 'target'
        }

        // Pobierz wszystkie koperty użytkownika
        const envelopes = await prisma.envelope.findMany({
            where: { userId }
        })


        // Napraw grupy dla każdej koperty
        for (const envelope of envelopes) {
            const group = envelopeGroupMap[envelope.name]
            if (group && envelope.group !== group) {
                await prisma.envelope.update({
                    where: { id: envelope.id },
                    data: { group }
                })
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Grupy kopert zostały naprawione pomyślnie' 
        })

    } catch (error) {
        console.error('❌ Błąd podczas naprawy grup kopert:', error)
        return NextResponse.json(
            { error: 'Błąd podczas naprawy grup kopert', details: error instanceof Error ? error.message : 'Nieznany błąd' },
            { status: 500 }
        )
    }
}
