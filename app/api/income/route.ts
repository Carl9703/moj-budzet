import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { incomeSchema } from '@/lib/validations/transaction'
import { jsonResponse } from '@/lib/utils/api'
import { toNum } from '@/lib/utils/decimal'

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
            return jsonResponse(
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

                // Obsługa bonusDistribution (nowy sposób) lub stary sposób (kompatybilność wsteczna)
                let distributions: Array<{ envelopeId?: string; envelopeName?: string; amount: number }> = []

                if (data.bonusDistribution && Array.isArray(data.bonusDistribution)) {
                    // Nowy sposób: użyj bonusDistribution z envelopeId
                    distributions = data.bonusDistribution.map((d: any) => ({
                        envelopeId: d.envelopeId,
                        envelopeName: d.envelopeName,
                        amount: d.amount || 0
                    }))
                } else {
                    // Stary sposób: użyj sztywnych nazw (kompatybilność wsteczna)
                    const envelopeNames = [
                        { name: 'Prezenty i Okazje', amount: data.toGifts || 0 },
                        { name: 'Auto: Serwis i Ubezpieczenie', amount: data.toInsurance || 0 },
                        { name: 'Wolne środki (roczne)', amount: data.toFreedom || 0 }
                    ]
                    distributions = envelopeNames.map(e => ({ envelopeName: e.name, amount: e.amount }))
                }

                // Generuj unikalny ID dla transferów premii
                const bonusTransferPairId = `bonus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

                for (const dist of distributions) {
                    if (dist.amount > 0) {
                        let envelope
                        
                        if (dist.envelopeId) {
                            // Nowy sposób: znajdź kopertę po ID
                            envelope = await tx.envelope.findFirst({
                                where: {
                                    id: dist.envelopeId,
                                    userId: userId,
                                    type: 'yearly',
                                    isArchived: false
                                }
                            })
                        } else if (dist.envelopeName) {
                            // Stary sposób: znajdź kopertę po nazwie
                            envelope = await tx.envelope.findFirst({
                                where: {
                                    userId: userId,
                                    name: dist.envelopeName,
                                    type: 'yearly',
                                    isArchived: false
                                }
                            })
                        }

                        if (envelope) {
                            // Utwórz tylko transakcję income do koperty docelowej (podobnie jak w transferach)
                            // Ma includeInStats: false więc nie wpływa na główne saldo w statystykach
                            // Główne saldo jest już zwiększone przez główną transakcję premii
                            await tx.transaction.create({
                                data: {
                                    userId: userId,
                                    type: 'income',
                                    amount: dist.amount,
                                    description: `Premia → ${envelope.name}`,
                                    date: transactionDate,
                                    envelopeId: envelope.id,
                                    includeInStats: false, // Transfer nie wpływa na statystyki miesięczne
                                    transferPairId: `${bonusTransferPairId}_${envelope.id}`
                                }
                            })

                            // Zwiększ saldo koperty (dla kopert rocznych oprócz "Budowanie Przyszłości", income zwiększa saldo)
                            await tx.envelope.update({
                                where: { id: envelope.id },
                                data: {
                                    currentAmount: toNum(envelope.currentAmount) + dist.amount
                                }
                            })
                        } else {
                            console.error(`❌ Koperta nie znaleziona: ${dist.envelopeName} dla użytkownika ${userId}`)
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

        const response = jsonResponse({ success: true })
        
        // Wyłącz cache dla świeżych danych
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')
        
        return response

    } catch (error) {
        console.error('Error creating income:', error)
        return jsonResponse(
            { error: 'Błąd serwera' },
            { status: 500 }
        )
    }
}
