import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
    try {
        let userId: string
        try {
            userId = await getUserIdFromToken(request)
        } catch (error) {
            return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
        }

        // Fetch all transaction dates for the user to determine unique years
        const transactions = await prisma.transaction.findMany({
            where: { userId },
            select: { date: true }
        })

        const currentYear = new Date().getFullYear()

        if (!transactions.length) {
            return NextResponse.json([currentYear])
        }

        // Extract distinct years and sort descending
        const uniqueYears = Array.from(
            new Set(transactions.map(t => t.date.getFullYear()))
        ).sort((a, b) => b - a)

        // Ensure current year is always in the list even if no transactions exist yet for it
        if (!uniqueYears.includes(currentYear)) {
            uniqueYears.unshift(currentYear)
            uniqueYears.sort((a, b) => b - a)
        }

        return NextResponse.json(uniqueYears)

    } catch (error) {
        console.error('Error fetching available years:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
