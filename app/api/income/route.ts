import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { incomeSchema } from '@/lib/validations/transaction'

export async function POST(request: NextRequest) {
    try {
        // Pobierz userId z JWT tokenu
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        const body = await request.json()

        // Walidacja danych wejściowych
        const validation = incomeSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Nieprawidłowe dane', details: validation.error.issues },
                { status: 400 }
            )
        }

        const data = validation.data

        // Parsuj datę w lokalnej strefie czasowej
        let transactionDate: Date
        if (data.date) {
            // Jeśli data jest tylko datą (YYYY-MM-DD), dodaj aktualną godzinę
            const dateString = data.date
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                // Data bez czasu - użyj aktualnej godziny z tej daty
                const [year, month, day] = dateString.split('-').map(Number)
                const now = new Date()
                transactionDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds())
            } else {
                // Pełna data z czasem - użyj bezpośrednio
                transactionDate = new Date(dateString)
            }
        } else {
            transactionDate = new Date()
        }

        // Obsługa premii - rozdzielenie na koperty roczne
        if (data.type === 'bonus') {
            await prisma.$transaction(async (tx) => {
                // Utwórz główną transakcję premii
                await tx.transaction.create({
                    data: {
                        userId: userId,
                        type: 'income',
                        amount: data.amount,
                        description: data.description || 'Premia',
                        date: transactionDate,
                        includeInStats: data.includeInStats !== false
                    }
                })

                // Znajdź koperty roczne po nazwach
                const envelopeNames = [
                    { name: 'Prezenty i Okazje', amount: data.toGifts || 0 },
                    { name: 'Auto: Serwis i Ubezpieczenie', amount: data.toInsurance || 0 },
                    { name: 'Wolne środki (roczne)', amount: data.toFreedom || 0 }
                ]

                for (const { name, amount } of envelopeNames) {
                    if (amount > 0) {
                        // Znajdź kopertę użytkownika
                        const envelope = await tx.envelope.findFirst({
                            where: {
                                userId: userId,
                                name: name,
                                type: 'yearly'
                            }
                        })

                        if (envelope) {
                            // Utwórz transakcję typu income z przypisaną kopertą
                            await tx.transaction.create({
                                data: {
                                    userId: userId,
                                    type: 'income',
                                    amount: amount,
                                    description: `Premia → ${name}`,
                                    date: transactionDate,
                                    envelopeId: envelope.id,
                                    includeInStats: false // Nie wliczaj transferów do statystyk
                                }
                            })

                            // Zwiększ saldo koperty (dla kopert rocznych oprócz "Budowanie Przyszłości", income zwiększa saldo)
                            await tx.envelope.update({
                                where: { id: envelope.id },
                                data: {
                                    currentAmount: envelope.currentAmount + amount
                                }
                            })
                        } else {
                            console.error(`❌ Koperta nie znaleziona: ${name} dla użytkownika ${userId}`)
                        }
                    }
                }
            })
        } else {
            // Prosty zapis przychodu bez automatycznego podziału
            await prisma.transaction.create({
                data: {
                    userId: userId,
                    type: 'income',
                    amount: data.amount,
                    description: data.description || (data.type === 'salary' ? 'Wypłata' : 'Inny przychód'),
                    date: transactionDate,
                    includeInStats: data.includeInStats !== false
                }
            })
        }

        const response = NextResponse.json({ success: true })
        
        // Wyłącz cache dla świeżych danych
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')
        
        return response

    } catch (error) {
        console.error('Error creating income:', error)
        return NextResponse.json(
            { error: 'Błąd serwera' },
            { status: 500 }
        )
    }
}