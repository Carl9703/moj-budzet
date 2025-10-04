import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'

// 🔒 PROSTY SECRET - usuń ten endpoint po migracji!
const MIGRATION_SECRET = 'migrate-my-data-2025'

export async function POST(request: NextRequest) {
    try {
        const { secret, targetEmail } = await request.json()

        // Sprawdź secret
        if (secret !== MIGRATION_SECRET) {
            return NextResponse.json(
                { error: 'Nieprawidłowy secret' },
                { status: 403 }
            )
        }

        // Znajdź wszystkich użytkowników
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                _count: {
                    select: {
                        transactions: true,
                        envelopes: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        })

        if (allUsers.length === 0) {
            return NextResponse.json({ error: 'Brak użytkowników w bazie' }, { status: 404 })
        }

        // Znajdź użytkownika z danymi (najwięcej transakcji)
        const userWithData = allUsers.reduce((prev, current) => 
            (current._count.transactions > prev._count.transactions) ? current : prev
        )

        // Znajdź docelowego użytkownika
        const targetUser = allUsers.find(u => u.email === targetEmail)

        if (!targetUser) {
            return NextResponse.json(
                { 
                    error: `Nie znaleziono użytkownika: ${targetEmail}`,
                    availableUsers: allUsers.map(u => ({ email: u.email, name: u.name }))
                },
                { status: 404 }
            )
        }

        // Zabezpieczenie - nie przenoś jeśli target już ma dane
        if (targetUser._count.transactions > 0 || targetUser._count.envelopes > 0) {
            return NextResponse.json({
                error: 'Docelowy użytkownik już ma dane! Nie można nadpisać.',
                targetUser: {
                    email: targetUser.email,
                    transactions: targetUser._count.transactions,
                    envelopes: targetUser._count.envelopes
                }
            }, { status: 400 })
        }

        // Jeśli source i target to ten sam użytkownik - błąd
        if (userWithData.id === targetUser.id) {
            return NextResponse.json({
                error: 'Użytkownik źródłowy i docelowy są tacy sami',
                info: 'Twoje dane są już na właściwym koncie!'
            }, { status: 400 })
        }

        // 🔄 WYKONAJ MIGRACJĘ W TRANSAKCJI
        const result = await prisma.$transaction(async (tx) => {
            // 1. Przenieś transakcje
            const transactionsUpdated = await tx.transaction.updateMany({
                where: { userId: userWithData.id },
                data: { userId: targetUser.id }
            })

            // 2. Przenieś koperty
            const envelopesUpdated = await tx.envelope.updateMany({
                where: { userId: userWithData.id },
                data: { userId: targetUser.id }
            })

            // 3. Przenieś konfigurację
            const configUpdated = await tx.userConfig.updateMany({
                where: { userId: userWithData.id },
                data: { userId: targetUser.id }
            })

            // 4. Usuń duplikaty kopert (nowy user mógł mieć puste koperty z rejestracji)
            // Najpierw usuń puste koperty nowego użytkownika
            await tx.envelope.deleteMany({
                where: {
                    userId: targetUser.id,
                    currentAmount: 0,
                    id: { not: { in: [] } } // Hack żeby wziąć wszystkie
                }
            })

            return {
                transactionsMoved: transactionsUpdated.count,
                envelopesMoved: envelopesUpdated.count,
                configMoved: configUpdated.count
            }
        })

        // Sprawdź wyniki po migracji
        const verification = await prisma.user.findUnique({
            where: { id: targetUser.id },
            select: {
                email: true,
                name: true,
                _count: {
                    select: {
                        transactions: true,
                        envelopes: true
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            message: '✅ Migracja zakończona pomyślnie!',
            source: {
                email: userWithData.email,
                name: userWithData.name
            },
            target: {
                email: targetUser.email,
                name: targetUser.name
            },
            migrated: result,
            verification: verification?._count
        })

    } catch (error) {
        return NextResponse.json(
            { 
                error: 'Błąd podczas migracji',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

// GET - sprawdź użytkowników (bez migracji)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const secret = searchParams.get('secret')

        if (secret !== MIGRATION_SECRET) {
            return NextResponse.json({ error: 'Nieprawidłowy secret' }, { status: 403 })
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                _count: {
                    select: {
                        transactions: true,
                        envelopes: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        })

        return NextResponse.json({
            users: users.map(u => ({
                email: u.email,
                name: u.name,
                createdAt: u.createdAt,
                hasData: u._count.transactions > 0 || u._count.envelopes > 0,
                stats: {
                    transactions: u._count.transactions,
                    envelopes: u._count.envelopes
                }
            }))
        })

    } catch (error) {
        return NextResponse.json(
            { error: 'Błąd sprawdzania użytkowników' },
            { status: 500 }
        )
    }
}

