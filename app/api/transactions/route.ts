import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { createTransactionSchema } from '@/lib/validations/transaction'
import { z } from 'zod'

export async function GET(request: NextRequest) {
    try {
        // Pobierz userId z JWT tokenu
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        const { searchParams } = new URL(request.url)
        
        // Podstawowe parametry
        const envelopeId = searchParams.get('envelopeId')
        const limit = parseInt(searchParams.get('limit') || '100')
        const currentMonth = searchParams.get('currentMonth') === 'true'
        
        // Zaawansowane filtry
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const searchText = searchParams.get('search')
        const transactionType = searchParams.get('type')
        const category = searchParams.get('category')
        const group = searchParams.get('group')
        const sortBy = searchParams.get('sortBy') || 'date'
        const sortOrder = searchParams.get('sortOrder') || 'desc'

        const whereClause: any = { userId }
        
        // Filtry podstawowe
        if (transactionType) {
            whereClause.type = transactionType
        }
        
        if (category) {
            whereClause.category = category
        }
        
        // Wyszukiwanie tekstowe
        if (searchText) {
            whereClause.description = {
                contains: searchText,
                mode: 'insensitive'
            }
        }
        
        // Filtry dat
        if (currentMonth) {
            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
            whereClause.date = {
                gte: startOfMonth,
                lte: endOfMonth
            }
        } else if (startDate || endDate) {
            whereClause.date = {}
            if (startDate) {
                whereClause.date.gte = new Date(startDate)
            }
            if (endDate) {
                whereClause.date.lte = new Date(endDate)
            }
        }
        
        // Filtrowanie po kopertach - priorytet: konkretna koperta > grupa > envelopeId
        const envelope = searchParams.get('envelope')
        if (envelope) {
            // Konkretna koperta ma najwyższy priorytet
            whereClause.envelopeId = envelope
        } else if (group) {
            // Filtrowanie po grupie kopert
            whereClause.envelope = {
                group: group
            }
        } else if (envelopeId) {
            // Fallback na envelopeId
            whereClause.envelopeId = envelopeId
        }

        // Przygotuj sortowanie
        const orderBy: any = {}
        if (sortBy === 'date') {
            orderBy.date = sortOrder
        } else if (sortBy === 'amount') {
            orderBy.amount = sortOrder
        } else if (sortBy === 'description') {
            orderBy.description = sortOrder
        } else if (sortBy === 'type') {
            orderBy.type = sortOrder
        }

        const transactions = await prisma.transaction.findMany({
            where: whereClause,
            include: {
                envelope: true
            },
            orderBy: Object.keys(orderBy).length > 0 ? orderBy : { date: 'desc' },
            take: limit
        })

        // Formatuj dane
        const formatted = transactions.map(t => {
            let category: string | undefined = t.category || undefined

            // Jeśli nie ma zapisanej kategorii, spróbuj wyprowadzić z opisu
            if (!category && t.description) {
                const desc = t.description.toLowerCase()
                if (desc.includes('transfer: konto wspólne')) {
                    category = 'joint-account'
                } else if (desc.includes('transfer: inwestycje')) {
                    category = 'investments'
                } else if (desc.includes('transfer:')) {
                    category = 'transfers'
                } else if (desc.includes('zamknięcie miesiąca')) {
                    category = 'month-close'
                }
            }

            return {
                id: t.id,
                type: t.type,
                amount: t.amount,
                description: t.description,
                date: t.date.toISOString(),
                category, // Może być undefined
                envelope: t.envelope ? {
                    name: t.envelope.name,
                    icon: t.envelope.icon || '📦'
                } : null
            }
        })

        const response = NextResponse.json({
            transactions: formatted,
            total: formatted.length,
            filters: {
                categories: await getAvailableCategories(userId),
                groups: await getAvailableGroups(userId),
                envelopes: await getAvailableEnvelopes(userId)
            }
        })

        // Wyłącz cache dla świeżych danych
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')

        return response

    } catch (error) {
        console.error('Error fetching transactions:', error)
        return NextResponse.json(
            { error: 'Błąd pobierania transakcji', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

// Funkcje pomocnicze do pobierania opcji filtrów
async function getAvailableCategories(userId: string) {
    const categories = await prisma.transaction.findMany({
        where: { 
            userId,
            category: { not: null }
        },
        select: { category: true },
        distinct: ['category']
    })
    return categories.map(c => c.category).filter(Boolean)
}

async function getAvailableGroups(userId: string) {
    const groups = await prisma.envelope.findMany({
        where: { userId },
        select: { group: true },
        distinct: ['group']
    })
    return groups.map(g => g.group).filter(Boolean)
}

async function getAvailableEnvelopes(userId: string) {
    const envelopes = await prisma.envelope.findMany({
        where: { userId },
        select: { 
            id: true,
            name: true,
            icon: true,
            group: true
        }
    })
    return envelopes
}

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
        const validation = createTransactionSchema.safeParse(body)
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

        const transaction = await prisma.transaction.create({
            data: {
                userId,
                type: data.type,
                amount: data.amount,
                description: data.description || '',
                date: transactionDate,
                envelopeId: data.envelopeId || null,
                category: data.category || null
            }
        })

        if (data.type === 'expense' && data.envelopeId) {
            const envelope = await prisma.envelope.findUnique({
                where: { id: data.envelopeId }
            })

            if (envelope) {
                if (envelope.type === 'monthly') {
                    // Dla kopert miesięcznych: expense zmniejsza saldo (wydatek z budżetu)
                    await prisma.envelope.update({
                        where: { id: data.envelopeId },
                        data: {
                            currentAmount: envelope.currentAmount - data.amount
                        }
                    })
                } else if (envelope.type === 'yearly') {
                    // Dla kopert rocznych: rozróżniamy oszczędzanie od wydawania
                    // "Budowanie Przyszłości" - expense zwiększa saldo (oszczędzanie)
                    // "Wesele", "Podróże" itp. - expense zmniejsza saldo (wydawanie z oszczędzonych środków)
                    const isSavingsEnvelope = envelope.name === 'Budowanie Przyszłości'
                    
                    if (isSavingsEnvelope) {
                        // Koperty oszczędnościowe: expense zwiększa saldo (oszczędzanie)
                        await prisma.envelope.update({
                            where: { id: data.envelopeId },
                            data: {
                                currentAmount: envelope.currentAmount + data.amount
                            }
                        })
                    } else {
                        // Koperty wydatkowe roczne: expense zmniejsza saldo (wydawanie z oszczędzonych środków)
                        await prisma.envelope.update({
                            where: { id: data.envelopeId },
                            data: {
                                currentAmount: envelope.currentAmount - data.amount
                            }
                        })
                    }
                }
            }
        }

        if (data.type === 'income' && data.envelopeId) {
            const envelope = await prisma.envelope.findUnique({
                where: { id: data.envelopeId }
            })

            if (envelope) {
                if (envelope.type === 'monthly') {
                    // Dla kopert miesięcznych: income zwiększa saldo (transfer do koperty)
                    await prisma.envelope.update({
                        where: { id: data.envelopeId },
                        data: {
                            currentAmount: envelope.currentAmount + data.amount
                        }
                    })
                } else if (envelope.type === 'yearly') {
                    // Dla kopert rocznych: rozróżniamy oszczędzanie od wydawania
                    // "Budowanie Przyszłości" - income zmniejsza saldo (wypłata z oszczędności)
                    // "Wesele", "Podróże" itp. - income zwiększa saldo (zwrot/wpłata do koperty)
                    const isSavingsEnvelope = envelope.name === 'Budowanie Przyszłości'
                    
                    if (isSavingsEnvelope) {
                        // Koperty oszczędnościowe: income zmniejsza saldo (wypłata z oszczędności)
                        await prisma.envelope.update({
                            where: { id: data.envelopeId },
                            data: {
                                currentAmount: envelope.currentAmount - data.amount
                            }
                        })
                    } else {
                        // Koperty wydatkowe roczne: income zwiększa saldo (zwrot/wpłata do koperty)
                        await prisma.envelope.update({
                            where: { id: data.envelopeId },
                            data: {
                                currentAmount: envelope.currentAmount + data.amount
                            }
                        })
                    }
                }
            }
        }

        return NextResponse.json(transaction)

    } catch (error) {
        return NextResponse.json(
            { error: 'Błąd zapisywania transakcji' },
            { status: 500 }
        )
    }
}