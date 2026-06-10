import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { jsonResponse } from '@/lib/utils/api'
import { SYSTEM_DESCRIPTIONS, POLISH_MONTHS } from '@/lib/constants/system'
import { toNum } from '@/lib/utils/decimal'

// === INTERFEJSY DLA ANALIZY PRZYCHODÓW ===

interface IncomeSource {
  source: string
  total: number
  percentage: number
  transactions: {
    id: string
    amount: number
    description: string
    date: string
  }[]
}

interface IncomeTrendData {
  period: string
  value: number
}

interface IncomeAnalyticsResponse {
  sources: IncomeSource[]
  trends: IncomeTrendData[]
  totalIncome: number
  period: string
  summary: {
    totalSources: number
    totalTransactions: number
    avgTransactionAmount: number
  }
}

// === FUNKCJE POMOCNICZE ===

async function getIncomeTrendsData(userId: string, startDate: Date, endDate: Date) {
  const trends = []
  const currentDate = new Date(startDate)

  // Upewnij się, że zaczynamy od pierwszego dnia miesiąca
  currentDate.setDate(1)

  while (currentDate <= endDate) {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59)

    const monthTransactions = await prisma.transaction.findMany({
      where: {
        userId: userId,
        type: 'income',
        date: { gte: monthStart, lte: monthEnd },
        NOT: [
          { description: { contains: SYSTEM_DESCRIPTIONS.BALANCE_TRANSFER } }
        ]
      }
    })

    const totalIncome = monthTransactions
      .filter(t => (t as { includeInStats?: boolean }).includeInStats !== false)
      .reduce((sum, t) => sum + toNum(t.amount), 0)

    trends.push({
      period: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
      value: totalIncome
    })

    // Przejdź do następnego miesiąca
    currentDate.setMonth(currentDate.getMonth() + 1)
  }

  return trends
}

export async function GET(request: NextRequest) {
  try {
    let userId: string
    try {
      userId = await getUserIdFromToken(request)
    } catch (error) {
      return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let start: Date, end: Date
    if (startDate && endDate) {
      start = new Date(startDate)
      end = new Date(endDate)
      // Upewnij się, że koniec dnia obejmuje wszystkie transakcje z tego dnia
      end.setHours(23, 59, 59, 999)
    } else {
      // Domyślnie ostatnie 3 miesiące
      const now = new Date()
      start = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      end = new Date()
    }

    // === POBRANIE TRANSAKCJI PRZYCHODÓW ===
    const incomeTransactions = await prisma.transaction.findMany({
      where: {
        userId: userId,
        type: 'income',
        date: { gte: start, lte: end },
        NOT: [
          { description: { contains: 'przeniesienie bilansu' } }
        ]
      },
      orderBy: { date: 'desc' }
    })

    // Filtruj transakcje uwzględniane w statystykach
    const filteredTransactions = incomeTransactions.filter(
      t => (t as { includeInStats?: boolean }).includeInStats !== false
    )

    // === GRUPOWANIE WEDŁUG ŹRÓDŁA PRZYCHODU ===
    const sourceData: {
      [key: string]: {
        transactions: any[]
        totalAmount: number
      }
    } = {}

    filteredTransactions.forEach(transaction => {
      const originalSource = transaction.description || 'Inne przychody'
      let normalizedSource = originalSource.trim()

      const description = normalizedSource.toLowerCase()
      const monthsPattern = POLISH_MONTHS.join('|')

      // Advanced grouping patterns (merging case-insensitive and similar)
      const patterns = [
        {
          name: 'Wypłata miesięczna', regex: [
            /wypłata.*\d{4}/i, /salary.*\d{4}/i, /pensja.*\d{4}/i,
            /wypłata\s+miesięczna/i, /miesięczna\s+wypłata/i, /wypłata/i, /pensja/i, /salary/i,
            new RegExp(`wypłata.*(${monthsPattern})`, 'i')
          ]
        },
        {
          name: 'Premia miesięczna', regex: [
            /premia.*\d{4}/i, /bonus.*\d{4}/i, /premia\s+miesięczna/i, /miesięczna\s+premia/i,
            /dodatek.*\d{4}/i, /premia/i, /bonus/i,
            new RegExp(`premia.*(${monthsPattern})`, 'i'),
            new RegExp(`dodatek.*(${monthsPattern})`, 'i')
          ]
        },
        {
          name: 'Inne przychody miesięczne', regex: [
            /inne\s+przychody.*\d{4}/i, /dodatkowe\s+przychody.*\d{4}/i, /pozostałe\s+przychody.*\d{4}/i,
            new RegExp(`inne\\s+przychody.*(${monthsPattern})`, 'i'),
            new RegExp(`dodatkowe\\s+przychody.*(${monthsPattern})`, 'i'),
            new RegExp(`pozostałe\\s+przychody.*(${monthsPattern})`, 'i')
          ]
        },
        { name: 'Multisport', regex: [/multisport/i] },
        { name: 'Delegacja', regex: [/delegacja/i] }
      ]

      let found = false
      for (const p of patterns) {
        if (p.regex.some(r => r.test(description))) {
          normalizedSource = p.name
          found = true
          break
        }
      }

      if (!found) {
        // Simple normalization for unknown sources: Title Case
        normalizedSource = normalizedSource.charAt(0).toUpperCase() + normalizedSource.slice(1).toLowerCase()
      }

      if (!sourceData[normalizedSource]) {
        sourceData[normalizedSource] = {
          transactions: [],
          totalAmount: 0
        }
      }

      sourceData[normalizedSource].transactions.push(transaction)
      sourceData[normalizedSource].totalAmount += toNum(transaction.amount)
    })

    // Oblicz całkowitą kwotę przychodów
    const totalIncome = Object.values(sourceData).reduce((sum, data) => sum + data.totalAmount, 0)

    // Stwórz analizę źródeł przychodów
    const sources: IncomeSource[] = Object.entries(sourceData).map(([source, data]) => {
      const avgAmount = Math.round(data.totalAmount / data.transactions.length)

      return {
        source,
        total: data.totalAmount,
        count: data.transactions.length,
        avgAmount,
        percentage: totalIncome > 0 ? Math.round((data.totalAmount / totalIncome) * 100) : 0,
        transactions: data.transactions.map(transaction => ({
          id: transaction.id,
          amount: transaction.amount,
          description: transaction.description || 'Brak opisu',
          date: transaction.date.toISOString().split('T')[0]
        }))
      }
    }).sort((a, b) => b.total - a.total)

    // === TRENDY CZASOWE ===
    // Używamy roku z wybranego zakresu lub bieżącego roku
    const trendYear = startDate ? new Date(startDate).getFullYear() : new Date().getFullYear()
    const yearStart = new Date(trendYear, 0, 1) // 1 stycznia
    const yearEnd = new Date(trendYear, 11, 31, 23, 59, 59) // 31 grudnia
    const trends = await getIncomeTrendsData(userId, yearStart, yearEnd)

    const response: IncomeAnalyticsResponse = {
      sources,
      trends,
      totalIncome,
      period: searchParams.get('period') || '3months',
      summary: {
        totalSources: sources.length,
        totalTransactions: filteredTransactions.length,
        avgTransactionAmount: filteredTransactions.length > 0
          ? Math.round(totalIncome / filteredTransactions.length)
          : 0
      }
    }

    const nextResponse = jsonResponse(response)

    // Wyłącz cache dla świeżych danych
    nextResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    nextResponse.headers.set('Pragma', 'no-cache')
    nextResponse.headers.set('Expires', '0')

    return nextResponse

  } catch (error) {
    console.error('Income Analytics API error:', error)
    return jsonResponse(
      { error: 'Błąd pobierania analiz przychodów' },
      { status: 500 }
    )
  }
}
