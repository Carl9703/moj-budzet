import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { createTransactionSchema } from '@/lib/validations/transaction'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { isSavingsEnvelope } from '@/lib/constants/envelopeTypes'

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

        const whereClause: Prisma.TransactionWhereInput = { userId }

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
                contains: searchText
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
        const order = sortOrder as Prisma.SortOrder
        const orderBy: Prisma.TransactionOrderByWithRelationInput = {}
        if (sortBy === 'date') {
            orderBy.date = order
        } else if (sortBy === 'amount') {
            orderBy.amount = order
        } else if (sortBy === 'description') {
            orderBy.description = order
        } else if (sortBy === 'type') {
            orderBy.type = order
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
        // Pobierz wszystkie kategorie, aby móc wnioskować kategorię na podstawie koperty
        const allCategories = await prisma.category.findMany({
            where: { userId },
            select: { id: true, defaultEnvelope: true }
        })

        // Formatuj dane
        const formatted = transactions.map(t => {
            let categoryId = t.category

            // Jeśli nie ma zapisanej kategorii, spróbuj wywnioskować z koperty
            if (!categoryId && t.envelope) {
                const envelopeName = t.envelope.name
                // Znajdź pierwszą kategorię, która ma tę kopertę jako domyślną
                const inferredCategory = allCategories.find(c => c.defaultEnvelope === envelopeName)
                if (inferredCategory) {
                    categoryId = inferredCategory.id
                }
            }

            // Legacy description fallback removed. We rely on Envelope Inference now.

            return {
                id: t.id,
                type: t.type,
                amount: t.amount,
                description: t.description,
                date: t.date.toISOString(),
                category: categoryId, // Zwracamy ID (lub null), frontend sobie poradzi z mapowaniem na nazwę/ikonę
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

    const rawCategories = categories.map(c => c.category!).filter(Boolean)
    const possibleIds = rawCategories.filter(c => !c.includes(' ')) // IDs usually don't have spaces
    const names = rawCategories.filter(c => c.includes(' '))

    if (possibleIds.length > 0) {
        const resolved = await prisma.category.findMany({
            where: {
                id: { in: possibleIds },
                userId
            },
            select: { name: true }
        })
        names.push(...resolved.map(c => c.name))

        // Add raw values for those that were NOT found as IDs (maybe they were just single-word legacy names)
        // This effectively keeps them if they weren't IDs.
        // But checking existance is harder without a full map.
        // Let's just create a set of found names to filter duplicates later.
    }

    // A simpler approach: Just filter out the resolved IDs from raw list if we found them? 
    // No, because we want the NAME relative to that ID.
    // So we return `names` + `resolvedNames`.
    // But what about `possibleIds` that were NOT found in DB? They might be legacy single-word categories.
    // We should keep them.

    // Better approach:
    // 1. Fetch names for all `possibleIds`.
    // 2. Create Map<Id, Name>.
    // 3. Map the original `rawCategories` using the map (or keep original if not found).

    // We can't easily distinguish a legacy single-word category "Food" from a CUID "cl..." without regex or length check.
    // CUIDs are 25 chars.

    // Re-implementation with mapping:
    const idCandidates = rawCategories.filter(c => !c.includes(' ') && c.length > 20)
    const finalCategories = new Set<string>()
    const idToName = new Map<string, string>()

    if (idCandidates.length > 0) {
        const resolved = await prisma.category.findMany({
            where: { id: { in: idCandidates }, userId },
            select: { id: true, name: true }
        })
        resolved.forEach(r => idToName.set(r.id, r.name))
    }

    rawCategories.forEach(c => {
        if (idToName.has(c)) {
            finalCategories.add(idToName.get(c)!)
        } else {
            finalCategories.add(c)
        }
    })

    return Array.from(finalCategories).sort()
}

async function getAvailableGroups(userId: string) {
    let groups
    try {
        groups = await prisma.envelope.findMany({
            where: { userId, isArchived: false },
            select: { group: true },
            distinct: ['group']
        })
    } catch (error) {
        // Fallback jeśli kolumna isArchived nie istnieje
        console.error('Error fetching groups with isArchived filter:', error)
        groups = await prisma.envelope.findMany({
            where: { userId },
            select: { group: true },
            distinct: ['group']
        })
    }
    return groups.map(g => g.group).filter(Boolean)
}

async function getAvailableEnvelopes(userId: string) {
    let envelopes
    try {
        envelopes = await prisma.envelope.findMany({
            where: { userId, isArchived: false },
            select: {
                id: true,
                name: true,
                icon: true,
                group: true
            }
        })
    } catch (error) {
        // Fallback jeśli kolumna isArchived nie istnieje
        console.error('Error fetching envelopes with isArchived filter:', error)
        envelopes = await prisma.envelope.findMany({
            where: { userId },
            select: {
                id: true,
                name: true,
                icon: true,
                group: true
            }
        })
    }
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
        const transactionDate = parseTransactionDate(data.date)

        // Atomowa transakcja: tworzenie transakcji + aktualizacja salda koperty
        const transaction = await prisma.$transaction(async (tx) => {
            // Walidacja własności koperty
            if (data.envelopeId) {
                const envelope = await tx.envelope.findFirst({
                    where: { id: data.envelopeId, userId }
                })
                if (!envelope) {
                    throw new Error('ENVELOPE_NOT_FOUND')
                }
            }

            // Utwórz transakcję
            const newTransaction = await tx.transaction.create({
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

            // Atomowa aktualizacja salda koperty (bez race condition)
            if (data.envelopeId && (data.type === 'expense' || data.type === 'income')) {
                const delta = data.type === 'expense' ? -data.amount : data.amount
                await tx.envelope.update({
                    where: { id: data.envelopeId },
                    data: { currentAmount: { increment: delta } }
                })
            }

            return newTransaction
        })

        return NextResponse.json(transaction)

    } catch (error) {
        if (error instanceof Error && error.message === 'ENVELOPE_NOT_FOUND') {
            return NextResponse.json(
                { error: 'Koperta nie znaleziona' },
                { status: 404 }
            )
        }
        console.error('Error creating transaction:', error)
        return NextResponse.json(
            { error: 'Błąd zapisywania transakcji' },
            { status: 500 }
        )
    }
}

/** Parsuje datę transakcji — YYYY-MM-DD otrzymuje aktualną godzinę */
function parseTransactionDate(dateString?: string): Date {
    if (!dateString) return new Date()
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number)
        const now = new Date()
        return new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds())
    }
    return new Date(dateString)
}
