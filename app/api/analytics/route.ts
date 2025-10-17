import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getCategoryName, getCategoryIcon } from '@/lib/constants/categories'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'

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
}

interface TrendData {
  period: string
  value: number
}

interface TrendsData {
  totalExpenses: TrendData[]
  byEnvelope: { [envelopeId: string]: TrendData[] }
}

interface AnalyticsResponse {
  mainMetrics: MainMetrics
  spendingTree: SpendingTreeNode[]
  trends: TrendsData
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

function getGroupIcon(groupName: string): string {
  const groupIcons: { [key: string]: string } = {
    'POTRZEBY': '🏠',
    'STYL ŻYCIA': '🎯',
    'CELE FINANSOWE': '💰',
    'Inne': '📦'
  }
  return groupIcons[groupName] || '📦'
}

async function getTrendsData(userId: string, startDate: Date, endDate: Date, envelopeId?: string) {
  const trends = []
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59)
    
    const whereClause: any = {
                userId: userId,
      type: 'expense',
      date: { gte: monthStart, lte: monthEnd },
                NOT: [
                    { description: { contains: 'Zamknięcie miesiąca' } },
                    { description: { contains: 'przeniesienie bilansu' } }
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
    
    currentDate.setMonth(currentDate.getMonth() + 1)
  }
  
  return trends
}

async function buildSpendingTree(userId: string, startDate: Date, endDate: Date, compare: boolean): Promise<SpendingTreeNode[]> {
  // Pobierz wszystkie transakcje dla okresu
  const transactions = await prisma.transaction.findMany({
                where: {
                    userId: userId,
                    type: 'expense',
      date: { gte: startDate, lte: endDate },
      NOT: [
        { description: { contains: 'Zamknięcie miesiąca' } },
        { description: { contains: 'przeniesienie bilansu' } }
      ]
    },
    include: { envelope: true }
  })

  // Pobierz dane porównawcze jeśli włączony tryb porównawczy
  let previousTransactions: any[] = []
  if (compare) {
    const periodLength = endDate.getTime() - startDate.getTime()
    const previousStart = new Date(startDate.getTime() - periodLength)
    const previousEnd = new Date(startDate.getTime() - 1)

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
      include: { envelope: true }
    })
  }

  // Grupuj transakcje według struktury hierarchicznej
  const groupMap = new Map<string, any>()
  
  for (const transaction of transactions.filter(t => (t as { includeInStats?: boolean }).includeInStats !== false)) {
    const envelope = transaction.envelope
    const groupName = envelope?.group || 'Inne'
    const envelopeName = envelope?.name || 'Inne'
    const category = transaction.category || 'other'
    
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
        children: new Map()
      })
    }
    
    const envelopeNode = group.children.get(envelopeName)
    envelopeNode.total += transaction.amount
    
    // Kategoria
    if (!envelopeNode.children.has(category)) {
      envelopeNode.children.set(category, {
        type: 'CATEGORY',
        id: `cat_${category}`,
        name: getCategoryName(category),
        total: 0,
        children: []
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
    const groupNode: SpendingTreeNode = {
      type: 'GROUP',
      id: group.id,
      name: group.name,
      total: group.total,
      children: []
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
      const envelopeNode: SpendingTreeNode = {
        type: 'ENVELOPE',
        id: envelope.id,
        name: envelope.name,
        total: envelope.total,
        children: []
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
          children: category.children
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
    } else {
        const period = searchParams.get('period') || '3months'
      start = getStartDate(period)
      end = new Date()
    }

    // === GŁÓWNE METRYKI DLA BIEŻĄCEGO OKRESU ===
    const currentPeriodTransactions = await prisma.transaction.findMany({
      where: {
        userId: userId,
        type: { in: ['income', 'expense'] },
        date: { gte: start, lte: end },
        NOT: [
          { description: { contains: 'Zamknięcie miesiąca' } },
          { description: { contains: 'przeniesienie bilansu' } }
        ]
      }
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
    if (compare) {
      const periodLength = end.getTime() - start.getTime()
      const previousStart = new Date(start.getTime() - periodLength)
      const previousEnd = new Date(start.getTime() - 1)

      const previousPeriodTransactions = await prisma.transaction.findMany({
            where: {
                userId: userId,
                type: { in: ['income', 'expense'] },
          date: { gte: previousStart, lte: previousEnd },
                NOT: [
                    { description: { contains: 'Zamknięcie miesiąca' } },
                    { description: { contains: 'przeniesienie bilansu' } }
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
    const spendingTree = await buildSpendingTree(userId, start, end, compare)

    // === TRENDY CZASOWE ===
    const totalExpensesTrend = await getTrendsData(userId, start, end)
    
    // Pobierz trendy dla każdej koperty
    const byEnvelope: { [envelopeId: string]: any[] } = {}
    const envelopes = await prisma.envelope.findMany({
      where: { userId: userId }
    })
    
    for (const envelope of envelopes) {
      const envelopeTrend = await getTrendsData(userId, start, end, envelope.id)
      byEnvelope[envelope.id] = envelopeTrend
    }

    const trends: TrendsData = {
      totalExpenses: totalExpensesTrend,
      byEnvelope: byEnvelope
    }

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
      trends
    }

    return NextResponse.json(response)

    } catch (error) {
        console.error('Analytics API error:', error)
        return NextResponse.json(
            { error: 'Błąd pobierania analiz' },
            { status: 500 }
        )
    }
}