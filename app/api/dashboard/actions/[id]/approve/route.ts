import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/jwt'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id
        const paymentId = params.id

        // Znajdź płatność cykliczną
        const recurringPayment = await prisma.recurringPayment.findFirst({
            where: {
                id: paymentId,
                userId: userId,
                isActive: true
            },
            include: {
                envelope: true
            }
        })

        if (!recurringPayment) {
            return NextResponse.json({ error: 'Płatność nie znaleziona' }, { status: 404 })
        }

        // Wykonaj transakcję w bazie danych
        await prisma.$transaction(async (tx) => {
            // Utwórz transakcję EXPENSE
            await tx.transaction.create({
                data: {
                    userId: userId,
                    type: 'expense',
                    amount: recurringPayment.amount,
                    description: recurringPayment.name,
                    date: new Date(),
                    envelopeId: recurringPayment.envelopeId,
                    category: recurringPayment.category,
                    includeInStats: true
                }
            })

            // Zwiększ saldo koperty
            await tx.envelope.update({
                where: { id: recurringPayment.envelopeId },
                data: {
                    currentAmount: {
                        increment: recurringPayment.amount
                    }
                }
            })

            // Ustaw dismissedUntil na początek następnego miesiąca
            const nextMonth = new Date()
            nextMonth.setMonth(nextMonth.getMonth() + 1)
            nextMonth.setDate(1)
            nextMonth.setHours(0, 0, 0, 0)

            await tx.recurringPayment.update({
                where: { id: paymentId },
                data: {
                    dismissedUntil: nextMonth
                }
            })
        })

        return NextResponse.json({
            success: true,
            message: `Płatność "${recurringPayment.name}" została zatwierdzona`,
            amount: recurringPayment.amount,
            envelope: recurringPayment.envelope.name
        })

    } catch (error) {
        console.error('Error approving payment:', error)
        return NextResponse.json(
            { error: 'Błąd zatwierdzania płatności', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
