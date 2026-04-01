import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'

import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { SYSTEM_DESCRIPTIONS, GROUP_NAME_MAP, GROUP_ICON_MAP, SYSTEM_GROUPS } from '@/lib/constants/system'

// === INTERFEJSY DLA NOWEJ STRUKTURY ===

interface MainMetrics {
  currentPeriod: {
    income: number
    expense: number
    balance: number
    savingsRate: number
  }
  previousPeriod?: {
    income: number
    expense: number
    balance: number
    savingsRate: number
  }
}

interface ComparisonData {
  previousTotal: number
  change: number
  changePercent: number
}

interface SpendingTreeNode {
  type: 'GROUP' | 'ENVELOPE' | 'CATEGORY' | 'TRANSACTION'
  id: string
  name: string
  total: number
  comparison?: ComparisonData
  children?: SpendingTreeNode[]
  // Dodatkowe pola dla transakcji
  date?: string
  description?: string
  amount?: number
  categoryId?: string // Dodajemy categoryId dla kategorii
  // Dodatkowe pola dla progress bars
  budget?: number // Budżet dla kopert
  budgetPercentage?: number // Procent wykorzystania budżetu
  icon?: string | null // Ikona dla wyświetlania
}

interface TrendData {
  period: string
  value: number
}

interface TrendsData {
  totalExpenses: TrendData[]
  byEnvelope: { [envelopeId: string]: TrendData[] }
  byEnvelopeName: { [envelopeName: string]: TrendData[] }
  byCategoryName: { [categoryName: string]: TrendData[] } // Added category trends
}

// === INTERFEJSY Z CATEGORIES ===

interface TransactionDetail {
  id: string
  amount: number
  description: string
  date: string
  envelopeName: string
  envelopeIcon: string
}

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
  transactions: TransactionDetail[]
}

interface AnalyticsResponse {
  mainMetrics: MainMetrics
  spendingTree: SpendingTreeNode[]
  trends: TrendsData
  categoryAnalysis: CategoryAnalysis[]
  totalExpenses: number
  period: string
  summary: {
    totalCategories: number
    totalTransactions: number
    avgTransactionAmount: number
  }
}

// === FUNKCJE POMOCNICZE ===

function getStartDate(period: string): Date {
  const now = new Date()

  switch (period) {
    case '1month':
      return new Date(now.getFullYear(), now.getMonth() - 1, 1)
    case 'currentMonth':
      return new Date(now.getFullYear(), now.getMonth(), 1)
    case '6months':
      return new Date(now.getFullYear(), now.getMonth() - 6, 1)
    case 'currentYear':
      return new Date(now.getFullYear(), 0, 1)
    default: // 3months
      return new Date(now.getFullYear(), now.getMonth() - 3, 1)
  }
}

function getGroupDisplayName(groupName: string): string {
  return GROUP_NAME_MAP[groupName] || GROUP_NAME_MAP['Inne']
}

function getPreviousPeriod(start: Date, end: Date, periodType: string | null): { start: Date; end: Date } {
  // Jeśli okres zaczyna się od 1-go dnia miesiąca, stosujemy logikę kalendarzową
  if (start.getDate() === 1) {
    // Obliczamy ile pełnych lub rozpoczętych miesięcy obejmuje obecny okres
    const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1

    // Poprzedni okres to tyle samo miesięcy wstecz, zaczynając od 1-go dnia i kończąc na ostatnim dniu
    const prevStart = new Date(start.getFullYear(), start.getMonth() - monthDiff, 1)
    const prevEnd = new Date(start.getFullYear(), start.getMonth(), 0, 23, 59, 59)

    return { start: prevStart, end: prevEnd }
  }

  // Domyślna logika: przesunięcie o ten sam czas trwania (dla zakresów niestandardowych nie zaczynających się 1-go)
  const durationMs = end.getTime() - start.getTime()
  const previousEnd = new Date(start.getTime() - 1)
  const previousStart = new Date(previousEnd.getTime() - durationMs)

  return { start: previousStart, end: previousEnd }
}

function getGroupIcon(groupName: string): string {
  return GROUP_ICON_MAP[groupName] || GROUP_ICON_MAP['Inne']
}

async function getTrendsData(userId: string, startDate: Date, endDate: Date, envelopeId?: string) {
  const trends = []
  const currentDate = new Date(startDate)

  // Upewnij się, że zaczynamy od pierwszego dnia miesiąca
  currentDate.setDate(1)

  while (currentDate <= endDate) {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59)

    const whereClause: any = {
      userId: userId,
      type: 'expense',
      date: { gte: monthStart, lte: monthEnd },
      NOT: [
        { description: { contains: SYSTEM_DESCRIPTIONS.MONTH_CLOSE } },
        { description: { contains: SYSTEM_DESCRIPTIONS.BALANCE_TRANSFER } }
      ]
    }

    if (envelopeId) {
      whereClause.envelopeId = envelopeId
    }

    const monthTransactions = await prisma.transaction.findMany({
      where: whereClause
    })

    const totalExpenses = monthTransactions
      .filter(t => (t as { includeInStats?: boolean }).includeInStats !== false)
      .reduce((sum, t) => sum + t.amount, 0)

    trends.push({
      period: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
      value: totalExpenses
    })

    // Przejdź do następnego miesiąca
    currentDate.setMonth(currentDate.getMonth() + 1)
  }

  return trends
}

async function buildSpendingTree(
  userId: string,
  startDate: Date,
  endDate: Date,
  compare: boolean,
  categories: any[],
  monthMultiplier: number = 1,
  previousStart?: Date,
  previousEnd?: Date
): Promise<SpendingTreeNode[]> {
  // Pobierz wszystkie transakcje dla okresu
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: userId,
      type: 'expense',
      date: { gte: startDate, lte: endDate },
      NOT: [
        { description: { contains: SYSTEM_DESCRIPTIONS.MONTH_CLOSE } },
        { description: { contains: SYSTEM_DESCRIPTIONS.BALANCE_TRANSFER } }
      ]
    },
    include: { envelope: true },
    orderBy: { date: 'desc' }
  })

  // Pobierz informacje o budżetach kopert
  const envelopes = await prisma.envelope.findMany({
    where: { userId: userId },
    select: { id: true, name: true, plannedAmount: true, icon: true }

  })

  const envelopeBudgets = new Map<string, number>()
  for (const envelope of envelopes) {
    envelopeBudgets.set(envelope.name, envelope.plannedAmount)
  }

  // Helper map for categories
  const categoryMap = new Map(categories.map(c => [c.id, c]))
  const getCatName = (id: string) => categoryMap.get(id)?.name || 'Inne'

  // Pobierz dane porównawcze jeśli włączony tryb porównawczy
  let previousTransactions: any[] = []
  if (compare) {
    // Use provided previous period dates for comparison
    if (!previousStart || !previousEnd) {
      // Fallback just in case
      const prev = getPreviousPeriod(startDate, endDate, null)
      previousStart = prev.start
      previousEnd = prev.end
    }

    previousTransactions = await prisma.transaction.findMany({
      where: {
        userId: userId,
        type: 'expense',
        date: { gte: previousStart, lte: previousEnd },
        NOT: [
          { description: { contains: 'Zamknięcie miesiąca' } },
          { description: { contains: 'przeniesienie bilansu' } }
        ]
      },
      include: { envelope: true },
      orderBy: { date: 'desc' }
    })
  }

  // Grupuj transakcje według struktury hierarchicznej
  const groupMap = new Map<string, any>()

  for (const transaction of transactions.filter(t => (t as { includeInStats?: boolean }).includeInStats !== false)) {
    const envelope = transaction.envelope
    const groupName = envelope?.group || SYSTEM_GROUPS.OTHER.name
    const envelopeName = envelope?.name || SYSTEM_GROUPS.OTHER.name

    // Infer category from envelope if not set on transaction
    let category = transaction.category
    if (!category && envelopeName && envelopeName !== 'Inne') {
      // Find categories that belong to this envelope
      const envelopeCategories = categories.filter(c => c.defaultEnvelope === envelopeName)
      if (envelopeCategories.length > 0) {
        category = envelopeCategories[0].id // Use first matching category
      }
    }
    category = category || 'other'

    // Grupa
    if (!groupMap.has(groupName)) {
      groupMap.set(groupName, {
        type: 'GROUP',
        id: `group_${groupName}`,
        name: groupName,
        total: 0,
        children: new Map()
      })
    }

    const group = groupMap.get(groupName)
    group.total += transaction.amount

    // Koperta
    if (!group.children.has(envelopeName)) {
      group.children.set(envelopeName, {
        type: 'ENVELOPE',
        id: `env_${envelopeName}`,
        name: envelopeName,
        total: 0,
        children: new Map(),
        icon: transaction.envelope?.icon || null
      })
    }

    const envelopeNode = group.children.get(envelopeName)
    envelopeNode.total += transaction.amount

    // Kategoria
    if (!envelopeNode.children.has(category)) {
      envelopeNode.children.set(category, {
        type: 'CATEGORY',
        id: `cat_${category}`,
        name: getCatName(category),
        total: 0,
        children: [],
        icon: categoryMap.get(category)?.icon || '📦'
      })
    }

    const categoryNode = envelopeNode.children.get(category)
    categoryNode.total += transaction.amount

    // Transakcja
    categoryNode.children.push({
      type: 'TRANSACTION',
      id: `trx_${transaction.id}`,
      name: transaction.description || 'Brak opisu',
      total: transaction.amount,
      date: transaction.date.toISOString().split('T')[0],
      description: transaction.description || 'Brak opisu',
      amount: transaction.amount
    })
  }

  // Konwertuj Map na Array i dodaj dane porównawcze
  const spendingTree: SpendingTreeNode[] = []

  for (const [groupName, group] of Array.from(groupMap.entries())) {
    // Oblicz budżet grupy (suma budżetów wszystkich kopert w grupie, przeskalowana o multiplier)
    let groupBudget = 0
    for (const [envelopeName, envelope] of Array.from((group.children as Map<string, any>).entries())) {
      const envelopeBudget = (envelopeBudgets.get(envelopeName) || 0) * monthMultiplier
      groupBudget += envelopeBudget
    }
    const groupBudgetPercentage = groupBudget > 0 ? (group.total / groupBudget) * 100 : 0

    const groupNode: SpendingTreeNode = {
      type: 'GROUP',
      id: group.id,
      name: getGroupDisplayName(group.name),
      total: group.total,
      children: [],
      budget: groupBudget,
      budgetPercentage: groupBudgetPercentage,
      icon: getGroupIcon(group.name)
    }

    // Dodaj dane porównawcze dla grupy
    if (compare) {
      const previousGroupTotal = previousTransactions
        .filter(t => (t as { includeInStats?: boolean }).includeInStats !== false)
        .filter(t => t.envelope?.group === groupName)
        .reduce((sum, t) => sum + t.amount, 0)

      if (previousGroupTotal > 0) {
        groupNode.comparison = {
          previousTotal: previousGroupTotal,
          change: group.total - previousGroupTotal,
          changePercent: ((group.total - previousGroupTotal) / previousGroupTotal) * 100
        }
      }
    }

    // Przetwórz koperty
    for (const [envelopeName, envelope] of Array.from((group.children as Map<string, any>).entries())) {
      // Pobierz budżet dla koperty (przeskalowany o multiplier)
      const budget = (envelopeBudgets.get(envelopeName) || 0) * monthMultiplier
      const budgetPercentage = budget > 0 ? (envelope.total / budget) * 100 : 0

      const envelopeNode: SpendingTreeNode = {
        type: 'ENVELOPE',
        id: envelope.id,
        name: envelope.name,
        total: envelope.total,
        children: [],
        budget: budget,
        budgetPercentage: budgetPercentage,
        icon: (envelope as any).icon // Casting because we added icon to select but types inference might need help or just works if envelope is typed correctly. Wait, envelope is from findMany outcome.

      }

      // Dodaj dane porównawcze dla koperty
      if (compare) {
        const previousEnvelopeTotal = previousTransactions
          .filter(t => (t as { includeInStats?: boolean }).includeInStats !== false)
          .filter(t => t.envelope?.name === envelopeName)
          .reduce((sum, t) => sum + t.amount, 0)

        if (previousEnvelopeTotal > 0) {
          envelopeNode.comparison = {
            previousTotal: previousEnvelopeTotal,
            change: envelope.total - previousEnvelopeTotal,
            changePercent: ((envelope.total - previousEnvelopeTotal) / previousEnvelopeTotal) * 100
          }
        }
      }

      // Przetwórz kategorie
      for (const [categoryName, category] of Array.from((envelope.children as Map<string, any>).entries())) {
        const categoryNode: SpendingTreeNode = {
          type: 'CATEGORY',
          id: category.id,
          name: category.name,
          total: category.total,
          children: category.children,
          categoryId: categoryName, // Przekazujemy categoryId dla kategorii
          icon: (category as any).icon
        }

        // Dodaj dane porównawcze dla kategorii
        if (compare) {
          const previousCategoryTotal = previousTransactions
            .filter(t => (t as { includeInStats?: boolean }).includeInStats !== false)
            .filter(t => t.envelope?.name === envelopeName && t.category === categoryName)
            .reduce((sum, t) => sum + t.amount, 0)

          if (previousCategoryTotal > 0) {
            categoryNode.comparison = {
              previousTotal: previousCategoryTotal,
              change: category.total - previousCategoryTotal,
              changePercent: ((category.total - previousCategoryTotal) / previousCategoryTotal) * 100
            }
          }
        }

        envelopeNode.children!.push(categoryNode)
      }

      groupNode.children!.push(envelopeNode)
    }

    spendingTree.push(groupNode)
  }

  return spendingTree.sort((a, b) => b.total - a.total)
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
    const compare = searchParams.get('compare') === 'true'

    let start: Date, end: Date
    if (startDate && endDate) {
      start = new Date(startDate)
      end = new Date(endDate)
      // Upewnij się, że koniec dnia obejmuje wszystkie transakcje z tego dnia
      end.setHours(23, 59, 59, 999)
    } else {
      const period = searchParams.get('period') || '3months'
      start = getStartDate(period)
      end = new Date()
    }

    // === POBIERZ KATEGORIE ===
    const categories = await prisma.category.findMany({
      where: { userId }
    })
    const categoryMap = new Map(categories.map((c: { id: string, name: string, icon: string }) => [c.id, c]))
    const getCatName = (id: string) => categoryMap.get(id)?.name || 'Inne'
    const getCatIcon = (id: string) => categoryMap.get(id)?.icon || '📦'

    // === GŁÓWNE METRYKI DLA BIEŻĄCEGO OKRESU ===
    const currentPeriodTransactions = await prisma.transaction.findMany({
      where: {
        userId: userId,
        type: { in: ['income', 'expense'] },
        date: { gte: start, lte: end },
        NOT: [
          { description: { contains: SYSTEM_DESCRIPTIONS.MONTH_CLOSE } },
          { description: { contains: SYSTEM_DESCRIPTIONS.BALANCE_TRANSFER } }
        ]
      },
      include: { envelope: true },
      orderBy: { date: 'desc' }
    })

    const currentIncome = currentPeriodTransactions
      .filter(t => t.type === 'income' && (t as { includeInStats?: boolean }).includeInStats !== false)
      .reduce((sum, t) => sum + t.amount, 0)

    const currentExpenses = currentPeriodTransactions
      .filter(t => t.type === 'expense' && (t as { includeInStats?: boolean }).includeInStats !== false)
      .reduce((sum, t) => sum + t.amount, 0)

    const currentBalance = currentIncome - currentExpenses
    const currentSavingsRate = currentIncome > 0 ? currentBalance / currentIncome : 0

    // === DANE PORÓWNAWCZE (jeśli włączony tryb porównawczy) ===
    let previousPeriodData: { income: number; expense: number; balance: number; savingsRate: number } | undefined = undefined
    let previousStart: Date | undefined
    let previousEnd: Date | undefined

    if (compare) {
      const periodParam = searchParams.get('period')
      const prev = getPreviousPeriod(start, end, periodParam)
      previousStart = prev.start
      previousEnd = prev.end

      const previousPeriodTransactions = await prisma.transaction.findMany({
        where: {
          userId: userId,
          type: { in: ['income', 'expense'] },
          date: { gte: previousStart, lte: previousEnd },
          NOT: [
            { description: { contains: SYSTEM_DESCRIPTIONS.MONTH_CLOSE } },
            { description: { contains: SYSTEM_DESCRIPTIONS.BALANCE_TRANSFER } }
          ]
        }
      })

      const previousIncome = previousPeriodTransactions
        .filter(t => t.type === 'income' && (t as { includeInStats?: boolean }).includeInStats !== false)
        .reduce((sum, t) => sum + t.amount, 0)

      const previousExpenses = previousPeriodTransactions
        .filter(t => t.type === 'expense' && (t as { includeInStats?: boolean }).includeInStats !== false)
        .reduce((sum, t) => sum + t.amount, 0)

      const previousBalance = previousIncome - previousExpenses
      const previousSavingsRate = previousIncome > 0 ? previousBalance / previousIncome : 0

      previousPeriodData = {
        income: previousIncome,
        expense: previousExpenses,
        balance: previousBalance,
        savingsRate: previousSavingsRate
      }
    }

    // === DRZEWO WYDATKÓW ===
    // Oblicz multiplier na podstawie liczby miesięcy w okresie (minimum 1)
    const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
    const monthMultiplier = Math.max(1, monthDiff)

    const spendingTree = await buildSpendingTree(userId, start, end, compare, categories, monthMultiplier, previousStart, previousEnd)

    // === TREND_DATA_UPDATE (OPTIMIZED) === 
    // Jeśli wybrano zakres dat, weź rok z daty początku. W przeciwnym razie default (obecny rok).
    const requestedYear = searchParams.get('year')
    let trendYear: number

    if (requestedYear) {
      trendYear = parseInt(requestedYear)
    } else if (startDate) {
      trendYear = new Date(startDate).getFullYear()
    } else {
      trendYear = new Date().getFullYear()
    }

    const yearStart = new Date(trendYear, 0, 1)
    const yearEnd = new Date(trendYear, 11, 31, 23, 59, 59)

    // Pobierz WSZYSTKIE wydatki z roku za jednym razem
    const yearTransactions = await prisma.transaction.findMany({
      where: {
        userId: userId,
        type: 'expense',
        date: { gte: yearStart, lte: yearEnd },
        NOT: [
          { description: { contains: SYSTEM_DESCRIPTIONS.MONTH_CLOSE } },
          { description: { contains: SYSTEM_DESCRIPTIONS.BALANCE_TRANSFER } }
        ]
      },
      include: { envelope: true }
    })

    // Mapowanie dla szybkiego dostępu do kategorii
    const catMap = new Map(categories.map(c => [c.id, c.name]))

    const tempTrends: {
      total: Record<string, number>,
      envelopes: Record<string, Record<string, number>>,
      categories: Record<string, Record<string, number>>
    } = { total: {}, envelopes: {}, categories: {} }

    // Zainicjalizuj wszystkie 12 miesięcy dla trendu ogólnego (żeby nie było dziur)
    for (let m = 1; m <= 12; m++) {
      const period = `${trendYear}-${String(m).padStart(2, '0')}`
      tempTrends.total[period] = 0
    }

    yearTransactions.forEach(t => {
      if ((t as { includeInStats?: boolean }).includeInStats === false) return

      const month = t.date.getMonth() + 1
      const period = `${t.date.getFullYear()}-${String(month).padStart(2, '0')}`
      const amount = t.amount

      // Ogólne
      tempTrends.total[period] = (tempTrends.total[period] || 0) + amount

      // Koperty
      const envName = t.envelope?.name || 'Inne'
      if (!tempTrends.envelopes[envName]) tempTrends.envelopes[envName] = {}
      tempTrends.envelopes[envName][period] = (tempTrends.envelopes[envName][period] || 0) + amount

      // Kategorie
      const catId = t.category || 'other'
      const catName = catMap.get(catId) || 'Inne'
      if (!tempTrends.categories[catName]) tempTrends.categories[catName] = {}
      tempTrends.categories[catName][period] = (tempTrends.categories[catName][period] || 0) + amount
    })

    const formatTrendArray = (record: Record<string, number>) => {
      const result = []
      for (let m = 1; m <= 12; m++) {
        const period = `${trendYear}-${String(m).padStart(2, '0')}`
        result.push({ period, value: record[period] || 0 })
      }
      return result
    }

    const trends: TrendsData = {
      totalExpenses: formatTrendArray(tempTrends.total),
      byEnvelope: {}, // legacy structure, can be empty if not used
      byEnvelopeName: Object.fromEntries(Object.entries(tempTrends.envelopes).map(([name, data]) => [name, formatTrendArray(data)])),
      byCategoryName: Object.fromEntries(Object.entries(tempTrends.categories).map(([name, data]) => [name, formatTrendArray(data)]))
    }

    // === ANALIZA KATEGORII ===
    // Filtruj tylko wydatki (używamy tych samych transakcji co wcześniej)
    const expenseTransactions = currentPeriodTransactions
      .filter(t => t.type === 'expense' && (t as { includeInStats?: boolean }).includeInStats !== false)

    // Grupuj transakcje według kategorii
    const categoryData: {
      [key: string]: {
        transactions: any[]
        totalAmount: number
        envelopeBreakdown: { [key: string]: number }
        monthlyData: { [key: string]: number }
      }
    } = {}

    expenseTransactions.forEach(transaction => {
      const categoryId = transaction.category || 'other'
      const categoryName = getCatName(categoryId)
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
    const totalExpensesForCategories = Object.values(categoryData).reduce((sum, data) => sum + data.totalAmount, 0)

    // Stwórz analizę kategorii
    const categoryAnalysis: CategoryAnalysis[] = Object.entries(categoryData).map(([categoryId, data]) => {
      const categoryName = getCatName(categoryId)
      const categoryIcon = getCatIcon(categoryId)

      // Przygotuj dane o kopertach
      const envelopeBreakdown = Object.entries(data.envelopeBreakdown).map(([envelopeName, amount]) => {
        // Envelopes are not needed here if we only want name/amount/percentage
        return {
          envelopeName,
          envelopeIcon: '📦', // Default icon since we removed envelopes fetch from here
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

      // Przygotuj szczegóły transakcji
      const transactions: TransactionDetail[] = data.transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Najnowsze na górze
        .map(transaction => {
          return {
            id: transaction.id,
            amount: transaction.amount,
            description: transaction.description || 'Brak opisu',
            date: transaction.date.toISOString().split('T')[0], // YYYY-MM-DD format
            envelopeName: transaction.envelope?.name || 'Inne',
            envelopeIcon: transaction.envelope?.icon || '📦'
          }
        })

      return {
        categoryId,
        categoryName,
        categoryIcon,
        totalAmount: data.totalAmount,
        transactionCount: data.transactions.length,
        avgTransactionAmount: Math.round(data.totalAmount / data.transactions.length),
        percentage: totalExpensesForCategories > 0 ? Math.round((data.totalAmount / totalExpensesForCategories) * 100) : 0,
        envelopeBreakdown,
        monthlyTrend,
        transactions
      }
    }).sort((a, b) => b.totalAmount - a.totalAmount)

    // Dodaj kategorie bez wydatków (dla kompletności)
    const usedCategories = new Set(categoryAnalysis.map(c => c.categoryId))
    const unusedCategories = categories
      .filter(c => !usedCategories.has(c.id) && c.defaultEnvelope !== null)
      .map(category => ({
        categoryId: category.id,
        categoryName: category.name,
        categoryIcon: category.icon,
        totalAmount: 0,
        transactionCount: 0,
        avgTransactionAmount: 0,
        percentage: 0,
        envelopeBreakdown: [],
        monthlyTrend: [],
        transactions: []
      }))

    const response: AnalyticsResponse = {
      mainMetrics: {
        currentPeriod: {
          income: currentIncome,
          expense: currentExpenses,
          balance: currentBalance,
          savingsRate: currentSavingsRate
        },
        previousPeriod: previousPeriodData
      },
      spendingTree,
      trends,
      categoryAnalysis: [...categoryAnalysis, ...unusedCategories],
      totalExpenses: totalExpensesForCategories,
      period: searchParams.get('period') || '3months',
      summary: {
        totalCategories: categoryAnalysis.length,
        totalTransactions: expenseTransactions.length,
        avgTransactionAmount: expenseTransactions.length > 0
          ? Math.round(totalExpensesForCategories / expenseTransactions.length)
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
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Błąd pobierania analiz' },
      { status: 500 }
    )
  }
}
