import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getCategoryIcon, getCategoryName } from '@/lib/constants/categories'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'

interface TransactionData {
    id: string
    type: string
    amount: number
    description: string
    date: string
    category: string
    isTransfer?: boolean
}

interface ArchiveCategory {
    name: string
    icon: string
    amount: number
    percentage: number
    transactions: TransactionData[]
}

interface ArchiveEnvelope {
    name: string
    icon: string
    totalSpent: number
    percentage: number
    categories: ArchiveCategory[]
}

interface MonthData {
    month: string
    year: number
    income: number
    expenses: number
    balance: number
    envelopes: ArchiveEnvelope[]
    transfers: ArchiveCategory[]
    transactions: TransactionData[]
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

        // Pobierz wszystkie transakcje
        const allTransactions = await prisma.transaction.findMany({
            where: {
                userId,
                type: { in: ['income', 'expense'] }
            },
            include: {
                envelope: true
            },
            orderBy: { date: 'desc' }
        })

        // Pobierz wszystkie koperty
        const allEnvelopes = await prisma.envelope.findMany({
            where: { userId }
        })

        // Grupuj transakcje po miesiącach
        const monthlyData: { [key: string]: MonthData } = {}

        for (const transaction of allTransactions) {
            const date = new Date(transaction.date)
            const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`
            const monthName = date.toLocaleDateString('pl-PL', { month: 'long' })
            const year = date.getFullYear()

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    month: monthName,
                    year: year,
                    income: 0,
                    expenses: 0,
                    balance: 0,
                    envelopes: [],
                    transfers: [],
                    transactions: []
                }
            }

            const monthData = monthlyData[monthKey]

            const includeInStats = transaction.includeInStats !== false

            // Kategoryzacja transakcji
            let categoryName = 'Inne'
            let isTransfer = false

            // Sprawdź czy to transfer do koperty rocznej (najpierw)
            if (transaction.envelope?.name && ['Wesele', 'Wakacje', 'Prezenty i Okazje', 'Auto: Serwis i Ubezpieczenie', 'Fundusz Awaryjny'].includes(transaction.envelope.name)) {
                categoryName = transaction.envelope.name
                isTransfer = true
            } else if (transaction.category) {
                categoryName = getCategoryName(transaction.category)
                // Sprawdź czy to transfer do koperty rocznej
                isTransfer = ['Wesele', 'Wakacje', 'Prezenty i Okazje', 'Auto: Serwis i Ubezpieczenie', 'Fundusz Awaryjny'].includes(categoryName)
            } else if (transaction.description) {
                const desc = transaction.description.toLowerCase()
                if (desc.includes('transfer: konto wspólne')) {
                    categoryName = 'Konto wspólne'
                    isTransfer = true
                } else if (desc.includes('transfer: inwestycje')) {
                    categoryName = 'Inwestycje'
                    isTransfer = true
                } else if (desc.includes('transfer: wesele')) {
                    categoryName = 'Wesele'
                    isTransfer = true
                } else if (desc.includes('transfer: wakacje')) {
                    categoryName = 'Wakacje'
                    isTransfer = true
                } else if (desc.includes('transfer:')) {
                    // Nie ustawiaj ogólnej kategorii Transfery - zostaw jako Inne
                    categoryName = 'Inne'
                    isTransfer = false
                } else if (desc.includes('zamknięcie miesiąca')) {
                    categoryName = 'Zamknięcie miesiąca'
                    isTransfer = true
                }
            }

            if (!transaction.category && !isTransfer && transaction.envelope?.name) {
                // Sprawdź czy to transfer do koperty rocznej
                const isYearlyEnvelopeTransfer = transaction.type === 'income' && 
                    ['Wesele', 'Wakacje', 'Budowanie Przyszłości', 'Wolne środki (roczne)'].includes(transaction.envelope.name)
                
                if (isYearlyEnvelopeTransfer) {
                    categoryName = transaction.envelope.name
                    isTransfer = true
                } else {
                    categoryName = transaction.envelope.name
                }
            }

            // Stwórz dane transakcji
            const transactionData: TransactionData = {
                id: transaction.id,
                type: transaction.type,
                amount: transaction.amount,
                description: transaction.description || 'Brak opisu',
                date: transaction.date.toISOString(),
                category: categoryName,
                isTransfer: isTransfer
            }

            // Dodaj do głównej listy transakcji (tylko jeśli to nie jest przychód bez koperty)
            if (!(transaction.type === 'income' && !transaction.envelopeId)) {
                monthData.transactions.push(transactionData)
            }

            if (includeInStats) {
                if (transaction.type === 'income') {
                    monthData.income += transaction.amount
                } else if (transaction.type === 'expense') {
                    monthData.expenses += transaction.amount
                }
            }
        }

        // Grupowanie po kopertach i kategoriach
        for (const monthKey in monthlyData) {
            const monthData = monthlyData[monthKey]

            // Mapa kopert
            const envelopeMap = new Map<string, ArchiveEnvelope>()

            // Mapa transferów
            const transferMap = new Map<string, ArchiveCategory>()

            // Tylko rzeczywiste wydatki (bez transferów)
            const expenseTransactions = monthData.transactions.filter(t => {
                const originalTransaction = allTransactions.find(at => at.id === t.id)
                const isTransfer = t.description?.toLowerCase().includes('transfer:') || false
                
                // WYKLUCZ transfery z wydatków - tylko rzeczywiste wydatki
                if (isTransfer) {
                    return false
                }
                
                // Dla zwykłych transakcji sprawdź includeInStats - TYLKO WYDATKI
                return (t.type === 'expense') && 
                       originalTransaction?.includeInStats !== false
            })

            // Osobna lista dla transferów
            const transferTransactions = monthData.transactions.filter(t => {
                const isTransfer = t.description?.toLowerCase().includes('transfer:') || false
                return isTransfer
            })

            for (const transaction of expenseTransactions) {
                const isTransfer = (transaction.isTransfer && !['Budowanie Przyszłości', 'Wolne środki (roczne)'].includes(transaction.category)) || ['Konto wspólne', 'Inwestycje', 'Wesele', 'Wakacje', 'Zamknięcie miesiąca'].includes(transaction.category)

                if (isTransfer) {
                    if (!transferMap.has(transaction.category)) {
                        transferMap.set(transaction.category, {
                            name: transaction.category,
                            icon: getTransferIcon(transaction.category),
                            amount: 0,
                            percentage: 0,
                            transactions: []
                        })
                    }

                    const transferCategory = transferMap.get(transaction.category)!
                    transferCategory.amount += transaction.amount
                    transferCategory.transactions.push(transaction)
                } else {
                    const originalTransaction = allTransactions.find(at => at.id === transaction.id)
                    let envelopeName = originalTransaction?.envelope?.name || 'Inne'
                    
                    // Mapuj nazwy kopert na nazwy transferów
                    if (envelopeName === 'Podróże') {
                        envelopeName = 'Wakacje'
                    }

                    if (!envelopeMap.has(envelopeName)) {
                        const envelope = allEnvelopes.find(e => e.name === envelopeName)
                        envelopeMap.set(envelopeName, {
                            name: envelopeName,
                            icon: envelope?.icon || '📦',
                            totalSpent: 0,
                            percentage: 0,
                            categories: []
                        })
                    }

                    const envelopeData = envelopeMap.get(envelopeName)!
                    envelopeData.totalSpent += transaction.amount

                    const realCategoryId = originalTransaction?.category
                    const realCategoryName = realCategoryId ? getCategoryName(realCategoryId) : transaction.category
                    const realCategoryIcon = realCategoryId ? getCategoryIcon(realCategoryId) : '📦'

                    let categoryInEnvelope = envelopeData.categories.find(c => c.name === realCategoryName)
                    if (!categoryInEnvelope) {
                        categoryInEnvelope = {
                            name: realCategoryName,
                            icon: realCategoryIcon,
                            amount: 0,
                            percentage: 0,
                            transactions: []
                        }
                        envelopeData.categories.push(categoryInEnvelope)
                    }

                    categoryInEnvelope.amount += transaction.amount
                    categoryInEnvelope.transactions.push(transaction)
                }
            }

            // Przetwórz transfery
            for (const transaction of transferTransactions) {
                const originalTransaction = allTransactions.find(at => at.id === transaction.id)
                let envelopeName = originalTransaction?.envelope?.name || 'Inne'
                
                // Mapuj nazwy kopert na nazwy transferów
                if (envelopeName === 'Podróże') {
                    envelopeName = 'Wakacje'
                }
                
                // Sprawdź czy to transfer do koperty rocznej
                const isYearlyEnvelopeTransfer = ['Wesele', 'Wakacje', 'Prezenty i Okazje', 'Auto: Serwis i Ubezpieczenie', 'Fundusz Awaryjny'].includes(envelopeName)
                
                if (isYearlyEnvelopeTransfer) {
                    if (!transferMap.has(envelopeName)) {
                        transferMap.set(envelopeName, {
                            name: envelopeName,
                            icon: getTransferIcon(envelopeName),
                            amount: 0,
                            percentage: 0,
                            transactions: []
                        })
                    }

                    const transferCategory = transferMap.get(envelopeName)!
                    transferCategory.amount += transaction.amount
                    transferCategory.transactions.push(transaction)
                }
            }

            // Oblicz procenty dla kopert
            const envelopeArray = Array.from(envelopeMap.values())
            const totalEnvelopeExpenses = envelopeArray.reduce((sum, env) => sum + env.totalSpent, 0)

            for (const envelope of envelopeArray) {
                envelope.percentage = totalEnvelopeExpenses > 0 ? Math.round((envelope.totalSpent / totalEnvelopeExpenses) * 100) : 0

                // Oblicz procenty dla kategorii w kopercie
                for (const category of envelope.categories) {
                    category.percentage = envelope.totalSpent > 0 ? Math.round((category.amount / envelope.totalSpent) * 100) : 0
                }
            }

            // Oblicz procenty dla transferów
            const transferArray = Array.from(transferMap.values())
            for (const transfer of transferArray) {
                transfer.percentage = monthData.expenses > 0 ? Math.round((transfer.amount / monthData.expenses) * 100) : 0
            }

            monthData.envelopes = envelopeArray.sort((a, b) => b.totalSpent - a.totalSpent)
            monthData.transfers = transferArray.sort((a, b) => b.amount - a.amount)

            // Oblicz bilans
            monthData.balance = monthData.income - monthData.expenses

            // Posortuj transakcje w kategoriach
            monthData.envelopes.forEach(envelope => {
                envelope.categories.forEach(category => {
                    category.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                })
            })

            monthData.transfers.forEach(transfer => {
                transfer.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            })
        }

        // Konwertuj do tablicy i posortuj
        const result = Object.values(monthlyData).sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year
            const months = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
                'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień']
            return months.indexOf(b.month) - months.indexOf(a.month)
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error('Archive API error:', error)
        return NextResponse.json(
            { error: 'Błąd pobierania archiwum' },
            { status: 500 }
        )
    }
}

function getTransferIcon(transferName: string): string {
    switch (transferName) {
        case 'Konto wspólne': return '👫'
        case 'Inwestycje': return '📈'
        case 'Wesele': return '💍'
        case 'Wakacje': return '✈️'
        case 'Prezenty i Okazje': return '🎁'
        case 'Auto: Serwis i Ubezpieczenie': return '🚗'
        case 'Fundusz Awaryjny': return '🚨'
        case 'Transfery': return '🔄'
        case 'Zamknięcie miesiąca': return '🔒'
        default: return '💸'
    }
}