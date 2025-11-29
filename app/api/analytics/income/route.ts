import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'

// === INTERFEJSY DLA ANALIZY PRZYCHODÓW ===

interface IncomeSource {
  source: string
  total: number
  count: number
  avgAmount: number
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
          { description: { contains: 'Zamknięcie miesiąca' } },
          { description: { contains: 'przeniesienie bilansu' } }
        ]
      }
    })
    
    const totalIncome = monthTransactions
      .filter(t => (t as { includeInStats?: boolean }).includeInStats !== false)
      .reduce((sum, t) => sum + t.amount, 0)

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
          { description: { contains: 'Zamknięcie miesiąca' } },
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
    const sourceData: { [key: string]: {
      transactions: any[]
      totalAmount: number
    } } = {}

    filteredTransactions.forEach(transaction => {
      // Używamy description jako źródło przychodu
      let source = transaction.description || 'Inne przychody'
      
      // Grupuj wypłaty miesięczne razem - bardziej zaawansowana logika
      const description = source.toLowerCase()
      
      // Wzorce dla wypłat miesięcznych
      const monthlySalaryPatterns = [
        /wypłata.*\d{4}/i,           // "Wypłata - Marzec 2025"
        /wypłata.*(styczeń|luty|marzec|kwiecień|maj|czerwiec|lipiec|sierpień|wrzesień|październik|listopad|grudzień)/i,
        /salary.*\d{4}/i,           // "Salary - March 2025"
        /pensja.*\d{4}/i,           // "Pensja - Marzec 2025"
        /wypłata\s+miesięczna/i,    // "Wypłata miesięczna"
        /miesięczna\s+wypłata/i     // "Miesięczna wypłata"
      ]
      
      // Wzorce dla premii miesięcznych
      const monthlyBonusPatterns = [
        /premia.*\d{4}/i,            // "Premia - Luty 2025"
        /premia.*(styczeń|luty|marzec|kwiecień|maj|czerwiec|lipiec|sierpień|wrzesień|październik|listopad|grudzień)/i,
        /bonus.*\d{4}/i,            // "Bonus - February 2025"
        /premia\s+miesięczna/i,      // "Premia miesięczna"
        /miesięczna\s+premia/i,     // "Miesięczna premia"
        /dodatek.*\d{4}/i,          // "Dodatek - Luty 2025"
        /dodatek.*(styczeń|luty|marzec|kwiecień|maj|czerwiec|lipiec|sierpień|wrzesień|październik|listopad|grudzień)/i
      ]
      
      // Wzorce dla innych przychodów miesięcznych
      const monthlyOtherIncomePatterns = [
        /inne\s+przychody.*\d{4}/i,  // "Inne przychody - Luty 2025"
        /inne\s+przychody.*(styczeń|luty|marzec|kwiecień|maj|czerwiec|lipiec|sierpień|wrzesień|październik|listopad|grudzień)/i,
        /dodatkowe\s+przychody.*\d{4}/i,  // "Dodatkowe przychody - Luty 2025"
        /dodatkowe\s+przychody.*(styczeń|luty|marzec|kwiecień|maj|czerwiec|lipiec|sierpień|wrzesień|październik|listopad|grudzień)/i,
        /pozostałe\s+przychody.*\d{4}/i,  // "Pozostałe przychody - Luty 2025"
        /pozostałe\s+przychody.*(styczeń|luty|marzec|kwiecień|maj|czerwiec|lipiec|sierpień|wrzesień|październik|listopad|grudzień)/i
      ]
      
      // Wzorce dla Multisport
      const multisportPatterns = [
        /multisport/i,              // "Multisport"
        /multisport\s+karolina/i,   // "Multisport Karolina"
        /multisport\s+.*/i          // "Multisport [dowolny tekst]"
      ]
      
      // Sprawdź czy to wypłata miesięczna
      const isMonthlySalary = monthlySalaryPatterns.some(pattern => pattern.test(description))
      
      // Sprawdź czy to premia miesięczna
      const isMonthlyBonus = monthlyBonusPatterns.some(pattern => pattern.test(description))
      
      // Sprawdź czy to inne przychody miesięczne
      const isMonthlyOtherIncome = monthlyOtherIncomePatterns.some(pattern => pattern.test(description))
      
      // Sprawdź czy to Multisport
      const isMultisport = multisportPatterns.some(pattern => pattern.test(description))
      
      if (isMonthlySalary) {
        source = 'Wypłata miesięczna'
      } else if (isMonthlyBonus) {
        source = 'Premia miesięczna'
      } else if (isMonthlyOtherIncome) {
        source = 'Inne przychody miesięczne'
      } else if (isMultisport) {
        source = 'Multisport'
      }
      
      if (!sourceData[source]) {
        sourceData[source] = {
          transactions: [],
          totalAmount: 0
        }
      }

      sourceData[source].transactions.push(transaction)
      sourceData[source].totalAmount += transaction.amount
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
    // Używamy danych z całego roku dla trendów
    const yearStart = new Date(new Date().getFullYear(), 0, 1)
    const yearEnd = new Date()
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

    const nextResponse = NextResponse.json(response)
    
    // Wyłącz cache dla świeżych danych
    nextResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    nextResponse.headers.set('Pragma', 'no-cache')
    nextResponse.headers.set('Expires', '0')
    
    return nextResponse

  } catch (error) {
    console.error('Income Analytics API error:', error)
    return NextResponse.json(
      { error: 'Błąd pobierania analiz przychodów' },
      { status: 500 }
    )
  }
}
