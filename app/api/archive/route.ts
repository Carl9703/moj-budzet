// app/api/archive/route.ts - POPRAWIONA WERSJA z kategoriami
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getCategoryIcon, getCategoryName } from '@/lib/constants/categories'

const USER_ID = 'default-user'


interface TransactionData {
    id: string
    type: string
    amount: number
    description: string
    date: string
    category: string
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
        const userId = USER_ID

        // Pobierz wszystkie transakcje WŁĄCZAJĄC POLE includeInStats
        const allTransactions = await prisma.transaction.findMany({
            where: {
                userId: userId,
                type: { in: ['income', 'expense'] }
            },
            include: {
                envelope: true
            },
            orderBy: { date: 'desc' }
        })

        // Pobierz wszystkie koperty
        const allEnvelopes = await prisma.envelope.findMany({
            where: { userId: userId }
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

            // POPRAWKA: Sprawdź includeInStats dla statystyk
            const includeInStats = transaction.includeInStats !== false

            // KATEGORYZACJA TRANSAKCJI - POPRAWIONA KOLEJNOŚĆ
            let categoryName = 'Inne'
            let isTransfer = false

            // NAJPIERW sprawdź opis (transfery mają priorytet)
            if (transaction.description) {
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
                    categoryName = 'Transfery'
                    isTransfer = true
                } else if (desc.includes('zamknięcie miesiąca')) {
                    categoryName = 'Zamknięcie miesiąca'
                    isTransfer = true
                }
            }

            // DOPIERO POTEM sprawdź zapisaną kategorię lub kopertę (jeśli to nie transfer)
            if (!isTransfer) {
                if (transaction.category) {
                    categoryName = getCategoryName(transaction.category)
                } else if (transaction.envelope?.name) {
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
                category: categoryName
            }

            // Dodaj do głównej listy transakcji
            monthData.transactions.push(transactionData)

            // POPRAWKA: Aktualizuj sumy TYLKO dla transakcji includeInStats
            if (includeInStats) {
                if (transaction.type === 'income') {
                    monthData.income += transaction.amount
                } else if (transaction.type === 'expense') {
                    // WSZYSTKIE wydatki (włącznie z transferami) są wliczane do expenses
                    monthData.expenses += transaction.amount
                }
            }
        }

        // GRUPOWANIE PO KOPERTACH I KATEGORIACH
        for (const monthKey in monthlyData) {
            const monthData = monthlyData[monthKey]

            // Mapa kopert
            const envelopeMap = new Map<string, ArchiveEnvelope>()

            // Mapa transferów
            const transferMap = new Map<string, ArchiveCategory>()

            // Przetwórz transakcje wydatkowe TYLKO te ze statystykami
            const expenseTransactions = monthData.transactions.filter(t =>
                t.type === 'expense' &&
                allTransactions.find(at => at.id === t.id)?.includeInStats !== false
            )

            for (const transaction of expenseTransactions) {
                const isTransfer = ['Konto wspólne', 'Inwestycje', 'Wesele', 'Wakacje', 'Transfery', 'Zamknięcie miesiąca'].includes(transaction.category)

                if (isTransfer) {
                    // OBSŁUGA TRANSFERÓW
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
                    // OBSŁUGA KOPERT - znajdź kopertę dla tej transakcji
                    const originalTransaction = allTransactions.find(at => at.id === transaction.id)
                    const envelopeName = originalTransaction?.envelope?.name || 'Inne'

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

                    // POPRAWKA: Znajdź kategorię w kopercie według RZECZYWISTEJ kategorii
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

            // Oblicz procenty dla kopert - względem wydatków z kopert (BEZ transferów)
            const envelopeArray = Array.from(envelopeMap.values())
            const totalEnvelopeExpenses = envelopeArray.reduce((sum, env) => sum + env.totalSpent, 0)

            for (const envelope of envelopeArray) {
                envelope.percentage = totalEnvelopeExpenses > 0 ? Math.round((envelope.totalSpent / totalEnvelopeExpenses) * 100) : 0

                // Oblicz procenty dla kategorii w kopercie
                for (const category of envelope.categories) {
                    category.percentage = envelope.totalSpent > 0 ? Math.round((category.amount / envelope.totalSpent) * 100) : 0
                }
            }

            // Oblicz procenty dla transferów - względem WSZYSTKICH wydatków
            const transferArray = Array.from(transferMap.values())
            for (const transfer of transferArray) {
                transfer.percentage = monthData.expenses > 0 ? Math.round((transfer.amount / monthData.expenses) * 100) : 0
            }

            // Konwertuj mapy na tablice i posortuj
            monthData.envelopes = envelopeArray
                .sort((a, b) => b.totalSpent - a.totalSpent) // Od największych wydatków

            monthData.transfers = transferArray
                .sort((a, b) => b.amount - a.amount) // Od największych transferów

            // Oblicz bilans
            monthData.balance = monthData.income - monthData.expenses

            // Posortuj transakcje w kategoriach (najnowsze pierwsze)
            monthData.envelopes.forEach(envelope => {
                envelope.categories.forEach(category => {
                    category.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                })
            })

            monthData.transfers.forEach(transfer => {
                transfer.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            })
        }

        // Konwertuj do tablicy i posortuj (najnowsze miesiące pierwsze)
        const result = Object.values(monthlyData).sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year
            const months = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
                'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień']
            return months.indexOf(b.month) - months.indexOf(a.month)
        })

        console.log('Hierarchical archive data with categories:', result[0]?.envelopes[0]?.categories) // Debug

        return NextResponse.json(result)

    } catch (error) {
        console.error('Archive API error:', error)
        return NextResponse.json(
            { error: 'Błąd pobierania archiwum' },
            { status: 500 }
        )
    }
}

// Pomocnicza funkcja dla ikon transferów
function getTransferIcon(transferName: string): string {
    switch (transferName) {
        case 'Konto wspólne': return '👫'
        case 'Inwestycje': return '📈'
        case 'Wesele': return '💍'
        case 'Wakacje': return '✈️'
        case 'Transfery': return '🔄'
        case 'Zamknięcie miesiąca': return '🔒'
        default: return '💸'
    }
}