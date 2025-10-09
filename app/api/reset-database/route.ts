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

        // Usuń wszystkie dane użytkownika
        await prisma.$transaction(async (tx) => {
            // Usuń transakcje
            await tx.transaction.deleteMany({
                where: { userId }
            })

            // Usuń koperty
            await tx.envelope.deleteMany({
                where: { userId }
            })

            // Usuń konfigurację
            await tx.userConfig.deleteMany({
                where: { userId }
            })
        })

        return NextResponse.json({ 
            success: true, 
            message: 'Wszystkie dane użytkownika zostały usunięte' 
        })

    } catch (error) {
        console.error('Błąd podczas czyszczenia bazy:', error)
        return NextResponse.json(
            { error: 'Błąd podczas czyszczenia bazy danych' },
            { status: 500 }
        )
    }
}
