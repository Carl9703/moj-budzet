import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getCategoryName, getCategoryIcon, EXPENSE_CATEGORIES } from '@/lib/constants/categories'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'

interface CategoryAnalysis {
    categoryId: string
    categoryName: string
    categoryIcon: string
    totalAmount: number
    transactionCount: number
    avgTransactionAmount: number
    percentage: number
    envelopeBreakdown: {
        envelopeName: string
        envelopeIcon: string
        amount: number
        percentage: number
    }[]
    monthlyTrend: {
        month: string
        year: number
        amount: number
    }[]
}

function getStartDate(period: string): Date {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    
    switch (period) {
        case 'currentMonth':
            return new Date(currentYear, currentMonth, 1)
        case '1month':
            return new Date(currentYear, currentMonth - 1, 1)
        case '3months':
            return new Date(currentYear, currentMonth - 3, 1)
        case '6months':
            return new Date(currentYear, currentMonth - 6, 1)
        case 'currentYear':
            return new Date(currentYear, 0, 1)
        default:
            return new Date(currentYear, currentMonth - 3, 1)
    }
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

        const { searchParams } = new URL(request.url)
        const period = searchParams.get('period') || '3months'
        const startDate = getStartDate(period)

        // Pobierz wszystkie transakcje wydatków dla wybranego okresu
        const expenseTransactions = await prisma.transaction.findMany({
            where: {
                userId: userId,
                type: 'expense',
                date: { gte: startDate },
                includeInStats: { not: false }, // Tylko rzeczywiste wydatki, nie transfery
                NOT: [
                    { description: { contains: 'Zamknięcie miesiąca' } },
                    { description: { contains: 'przeniesienie bilansu' } }
                ]
            },
            include: { envelope: true },
            orderBy: { date: 'desc' }
        })

        // Pobierz koperty użytkownika
        const envelopes = await prisma.envelope.findMany({
            where: { userId: userId }
        })

        // Grupuj transakcje według kategorii
        const categoryData: { [key: string]: {
            transactions: any[]
            totalAmount: number
            envelopeBreakdown: { [key: string]: number }
            monthlyData: { [key: string]: number }
        } } = {}

        expenseTransactions.forEach(transaction => {
            const categoryId = transaction.category || 'other'
            const categoryName = getCategoryName(categoryId)
            const envelopeName = transaction.envelope?.name || 'Inne'
            
            if (!categoryData[categoryId]) {
                categoryData[categoryId] = {
                    transactions: [],
                    totalAmount: 0,
                    envelopeBreakdown: {},
                    monthlyData: {}
                }
            }

            categoryData[categoryId].transactions.push(transaction)
            categoryData[categoryId].totalAmount += transaction.amount

            // Grupuj według kopert
            if (!categoryData[categoryId].envelopeBreakdown[envelopeName]) {
                categoryData[categoryId].envelopeBreakdown[envelopeName] = 0
            }
            categoryData[categoryId].envelopeBreakdown[envelopeName] += transaction.amount

            // Grupuj według miesięcy
            const monthKey = `${transaction.date.getFullYear()}-${String(transaction.date.getMonth() + 1).padStart(2, '0')}`
            if (!categoryData[categoryId].monthlyData[monthKey]) {
                categoryData[categoryId].monthlyData[monthKey] = 0
            }
            categoryData[categoryId].monthlyData[monthKey] += transaction.amount
        })

        // Oblicz całkowitą kwotę wydatków
        const totalExpenses = Object.values(categoryData).reduce((sum, data) => sum + data.totalAmount, 0)

        // Stwórz analizę kategorii
        const categoryAnalysis: CategoryAnalysis[] = Object.entries(categoryData).map(([categoryId, data]) => {
            const categoryName = getCategoryName(categoryId)
            const categoryIcon = getCategoryIcon(categoryId)
            
            // Przygotuj dane o kopertach
            const envelopeBreakdown = Object.entries(data.envelopeBreakdown).map(([envelopeName, amount]) => {
                const envelope = envelopes.find(e => e.name === envelopeName)
                return {
                    envelopeName,
                    envelopeIcon: envelope?.icon || '📦',
                    amount,
                    percentage: Math.round((amount / data.totalAmount) * 100)
                }
            }).sort((a, b) => b.amount - a.amount)

            // Przygotuj trendy miesięczne
            const monthlyTrend = Object.entries(data.monthlyData)
                .map(([monthKey, amount]) => {
                    const [year, month] = monthKey.split('-')
                    const monthNames = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
                        'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień']
                    return {
                        month: monthNames[parseInt(month) - 1],
                        year: parseInt(year),
                        amount
                    }
                })
                .sort((a, b) => {
                    if (a.year !== b.year) return a.year - b.year
                    const months = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
                        'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień']
                    return months.indexOf(a.month) - months.indexOf(b.month)
                })

            return {
                categoryId,
                categoryName,
                categoryIcon,
                totalAmount: data.totalAmount,
                transactionCount: data.transactions.length,
                avgTransactionAmount: Math.round(data.totalAmount / data.transactions.length),
                percentage: totalExpenses > 0 ? Math.round((data.totalAmount / totalExpenses) * 100) : 0,
                envelopeBreakdown,
                monthlyTrend
            }
        }).sort((a, b) => b.totalAmount - a.totalAmount)

        // Dodaj kategorie bez wydatków (dla kompletności)
        const usedCategories = new Set(categoryAnalysis.map(c => c.categoryId))
        const unusedCategories = EXPENSE_CATEGORIES
            .filter(c => !usedCategories.has(c.id) && c.defaultEnvelope !== '')
            .map(category => ({
                categoryId: category.id,
                categoryName: category.name,
                categoryIcon: category.icon,
                totalAmount: 0,
                transactionCount: 0,
                avgTransactionAmount: 0,
                percentage: 0,
                envelopeBreakdown: [],
                monthlyTrend: []
            }))

        return NextResponse.json({
            categoryAnalysis: [...categoryAnalysis, ...unusedCategories],
            totalExpenses,
            period,
            summary: {
                totalCategories: categoryAnalysis.length,
                totalTransactions: expenseTransactions.length,
                avgTransactionAmount: expenseTransactions.length > 0 
                    ? Math.round(totalExpenses / expenseTransactions.length) 
                    : 0
            }
        })

    } catch (error) {
        console.error('Category analytics error:', error)
        return NextResponse.json(
            { error: 'Błąd podczas pobierania analiz kategorii' },
            { status: 500 }
        )
    }
}
