import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'

interface Transaction {
    id: string
    userId: string
    type: string
    amount: number
    description: string | null
    date: Date
    envelopeId: string | null
}

export async function GET(request: NextRequest) {
    try {
        // Pobierz userId z JWT tokenu
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        console.log(`📊 Dashboard API called for user: ${userId}`)

        // Sprawdź czy użytkownik istnieje
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Użytkownik nie znaleziony' },
                { status: 404 }
            )
        }

        const envelopes = await prisma.envelope.findMany({
            where: { userId },
            orderBy: { name: 'asc' }
        })

        // Pobierz WSZYSTKIE transakcje do obliczenia salda (wykluczając operacje zamknięcia)
        const allTransactions = await prisma.transaction.findMany({
            where: {
                userId,
                type: { in: ['income', 'expense'] },
                NOT: [
                    {
                        description: {
                            contains: 'Zamknięcie miesiąca'
                        }
                    },
                    {
                        description: {
                            contains: 'przeniesienie bilansu'
                        }
                    }
                ]
            }
        })

        // Oblicz rzeczywiste saldo konta głównego
        const totalAllIncome = Math.round(allTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0) * 100) / 100

        const totalAllExpenses = Math.round(allTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0) * 100) / 100

        const balance = Math.round((totalAllIncome - totalAllExpenses) * 100) / 100

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        const monthCloseTransaction = await prisma.transaction.findFirst({
            where: {
                userId,
                description: {
                    contains: 'Zamknięcie miesiąca'
                },
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        })

        let monthTransactions: Transaction[] = []

        if (monthCloseTransaction) {
            monthTransactions = await prisma.transaction.findMany({
                where: {
                    userId,
                    date: {
                        gt: monthCloseTransaction.date,
                        lte: endOfMonth
                    },
                    type: { in: ['income', 'expense'] },
                    NOT: {
                        description: {
                            contains: 'Zamknięcie miesiąca'
                        }
                    }
                }
            })
        } else {
            monthTransactions = await prisma.transaction.findMany({
                where: {
                    userId,
                    date: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    },
                    type: { in: ['income', 'expense'] },
                    NOT: {
                        description: {
                            contains: 'Zamknięcie miesiąca'
                        }
                    }
                }
            })
        }

        const totalIncome = Math.round(monthTransactions
            .filter(t => t.type === 'income' && (t as { includeInStats?: boolean }).includeInStats !== false)
            .reduce((sum, t) => sum + t.amount, 0) * 100) / 100

        const totalExpenses = Math.round(monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0) * 100) / 100

        const isMonthClosed = !!monthCloseTransaction

        const envelopeActivity: { [key: string]: number } = {}

        monthTransactions
            .filter(t => t.type === 'expense' && t.envelopeId)
            .forEach(transaction => {
                const envelopeId = transaction.envelopeId!
                envelopeActivity[envelopeId] = (envelopeActivity[envelopeId] || 0) + 1
            })

        const monthlyEnvelopes = envelopes
            .filter(e => e.type === 'monthly')
            .map(e => {
                const envelopeTransactions = monthTransactions.filter(t => 
                    t.type === 'expense' && t.envelopeId === e.id
                )
                const spent = Math.round(envelopeTransactions.reduce((sum, t) => sum + t.amount, 0) * 100) / 100

                return {
                    id: e.id,
                    name: e.name,
                    icon: e.icon,
                    spent: spent,
                    planned: e.plannedAmount,
                    current: e.currentAmount,
                    activityCount: envelopeActivity[e.id] || 0,
                    group: e.group
                }
            })
            .sort((a, b) => {
                if (a.activityCount !== b.activityCount) {
                    return b.activityCount - a.activityCount
                }
                return a.name.localeCompare(b.name)
            })

        const yearlyEnvelopes = envelopes
            .filter(e => e.type === 'yearly')
            .map(e => {
                const envelopeTransactions = monthTransactions.filter(t => 
                    t.type === 'expense' && t.envelopeId === e.id
                )
                const spent = Math.round(envelopeTransactions.reduce((sum, t) => sum + t.amount, 0) * 100) / 100

                console.log(`📈 Koperta ${e.name}: currentAmount=${e.currentAmount}, spent=${spent}`)

                return {
                    id: e.id,
                    name: e.name,
                    icon: e.icon,
                    spent: spent,
                    planned: e.plannedAmount,
                    current: e.currentAmount,
                    group: e.group
                }
            })
            .sort((a, b) => a.name.localeCompare(b.name))

        return NextResponse.json({
            balance,
            totalIncome,
            totalExpenses,
            monthlyEnvelopes,
            yearlyEnvelopes,
            transactions: monthTransactions.slice(0, 10),
            isMonthClosed
        })

    } catch (error) {
        return NextResponse.json(
            { error: 'Błąd pobierania danych' },
            { status: 500 }
        )
    }
}