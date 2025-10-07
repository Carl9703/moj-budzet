export interface Category {
    id: string
    name: string
    icon: string
    defaultEnvelope: string
    type: 'monthly' | 'yearly'
}

export const EXPENSE_CATEGORIES: Category[] = [
    { id: 'groceries', name: 'Zakupy spożywcze', icon: '🛒', defaultEnvelope: 'Jedzenie', type: 'monthly' },
    { id: 'restaurants', name: 'Restauracje', icon: '🍕', defaultEnvelope: 'Jedzenie', type: 'monthly' },
    { id: 'fuel', name: 'Paliwo', icon: '⛽', defaultEnvelope: 'Transport', type: 'monthly' },
    { id: 'car-service', name: 'Serwis auta', icon: '🔧', defaultEnvelope: 'Transport', type: 'monthly' },
    { id: 'public-transport', name: 'Komunikacja miejska', icon: '🚌', defaultEnvelope: 'Transport', type: 'monthly' },
    { id: 'parking', name: 'Parking', icon: '🅿️', defaultEnvelope: 'Transport', type: 'monthly' },
    { id: 'phone', name: 'Telefon', icon: '📱', defaultEnvelope: 'Telekom/Subskrypcje', type: 'monthly' },
    { id: 'subscriptions', name: 'Subskrypcje', icon: '📺', defaultEnvelope: 'Telekom/Subskrypcje', type: 'monthly' },
    { id: 'pharmacy', name: 'Apteka', icon: '💊', defaultEnvelope: 'Higiena/Zdrowie', type: 'monthly' },
    { id: 'doctor', name: 'Lekarz', icon: '👨‍⚕️', defaultEnvelope: 'Higiena/Zdrowie', type: 'monthly' },
    { id: 'drugstore', name: 'Drogeria', icon: '🧴', defaultEnvelope: 'Higiena/Zdrowie', type: 'monthly' },
    { id: 'hairdresser', name: 'Fryzjer', icon: '💇', defaultEnvelope: 'Higiena/Zdrowie', type: 'monthly' },
    { id: 'cinema', name: 'Kino', icon: '🎬', defaultEnvelope: 'Rozrywka', type: 'monthly' },
    { id: 'hobby', name: 'Hobby', icon: '🎮', defaultEnvelope: 'Rozrywka', type: 'monthly' },
    { id: 'sport', name: 'Sport', icon: '⚽', defaultEnvelope: 'Rozrywka', type: 'monthly' },
    { id: 'books', name: 'Książki', icon: '📚', defaultEnvelope: 'Rozrywka', type: 'monthly' },
    { id: 'clothes', name: 'Odzież', icon: '👕', defaultEnvelope: 'Ubrania', type: 'monthly' },
    { id: 'shoes', name: 'Obuwie', icon: '👟', defaultEnvelope: 'Ubrania', type: 'monthly' },
    { id: 'home-equipment', name: 'Wyposażenie', icon: '🏠', defaultEnvelope: 'Dom', type: 'monthly' },
    { id: 'repairs', name: 'Naprawy', icon: '🔨', defaultEnvelope: 'Dom', type: 'monthly' },
    { id: 'appliances', name: 'AGD', icon: '🔌', defaultEnvelope: 'Dom', type: 'monthly' },
    { id: 'emergency', name: 'Nagłe wydatki', icon: '⚠️', defaultEnvelope: 'Nieprzewidziane', type: 'monthly' },
    { id: 'other', name: 'Inne', icon: '❓', defaultEnvelope: 'Nieprzewidziane', type: 'monthly' },
    { id: 'flights', name: 'Loty', icon: '✈️', defaultEnvelope: 'Wakacje', type: 'yearly' },
    { id: 'hotel', name: 'Hotel', icon: '🏨', defaultEnvelope: 'Wakacje', type: 'yearly' },
    { id: 'vacation-expenses', name: 'Wydatki wakacyjne', icon: '🏖️', defaultEnvelope: 'Wakacje', type: 'yearly' },
    { id: 'gifts', name: 'Prezenty', icon: '🎁', defaultEnvelope: 'Prezenty', type: 'yearly' },
    { id: 'insurance', name: 'Ubezpieczenie OC', icon: '📋', defaultEnvelope: 'OC', type: 'yearly' },
    { id: 'christmas-expenses', name: 'Wydatki świąteczne', icon: '🎅', defaultEnvelope: 'Święta', type: 'yearly' },
    { id: 'salary', name: 'Wypłata', icon: '💼', defaultEnvelope: '', type: 'monthly' },
    { id: 'bonus', name: 'Premia', icon: '🎁', defaultEnvelope: '', type: 'yearly' },
    { id: 'other-income', name: 'Inne przychody', icon: '💵', defaultEnvelope: '', type: 'monthly' },
    { id: 'investments', name: 'Inwestycje', icon: '📈', defaultEnvelope: 'Inwestycje', type: 'monthly' },
    { id: 'wedding-expenses', name: 'Wydatki weselne', icon: '💍', defaultEnvelope: 'Wesele', type: 'yearly' },
]

export const CATEGORY_TO_ENVELOPE_MAP: Record<string, string> = EXPENSE_CATEGORIES.reduce(
    (acc, category) => {
        acc[category.id] = category.defaultEnvelope
        return acc
    },
    {} as Record<string, string>
)

export function getPopularCategories(limit: number = 9): Category[] {
    if (typeof window !== 'undefined') {
        const usage = JSON.parse(localStorage.getItem('categoryUsage') || '{}')

        const sorted = [...EXPENSE_CATEGORIES].sort((a, b) => {
            const usageA = usage[a.id] || 0
            const usageB = usage[b.id] || 0
            return usageB - usageA
        })

        return sorted.slice(0, limit)
    }

    return EXPENSE_CATEGORIES.slice(0, limit)
}

// Pobierz popularne kategorie wydatków
export function getPopularExpenseCategories(limit: number = 9): Category[] {
    const expenseCategories = getExpenseCategories()
    
    if (typeof window !== 'undefined') {
        const usage = JSON.parse(localStorage.getItem('categoryUsage') || '{}')

        const sorted = [...expenseCategories].sort((a, b) => {
            const usageA = usage[a.id] || 0
            const usageB = usage[b.id] || 0
            return usageB - usageA
        })

        return sorted.slice(0, limit)
    }

    return expenseCategories.slice(0, limit)
}

export function trackCategoryUsage(categoryId: string): void {
    if (typeof window !== 'undefined') {
        const usage = JSON.parse(localStorage.getItem('categoryUsage') || '{}')
        usage[categoryId] = (usage[categoryId] || 0) + 1
        localStorage.setItem('categoryUsage', JSON.stringify(usage))
    }
}

// Śledź użycie kopert
export function trackEnvelopeUsage(envelopeId: string): void {
    if (typeof window !== 'undefined') {
        const usage = JSON.parse(localStorage.getItem('envelopeUsage') || '{}')
        usage[envelopeId] = (usage[envelopeId] || 0) + 1
        localStorage.setItem('envelopeUsage', JSON.stringify(usage))
    }
}

// Pobierz popularne koperty
export function getPopularEnvelopes(envelopes: { id: string; name: string; icon: string; type: string }[], limit: number = 8): { id: string; name: string; icon: string; type: string }[] {
    if (typeof window !== 'undefined') {
        const usage = JSON.parse(localStorage.getItem('envelopeUsage') || '{}')

        const sorted = [...envelopes].sort((a, b) => {
            const usageA = usage[a.id] || 0
            const usageB = usage[b.id] || 0
            return usageB - usageA
        })

        return sorted.slice(0, limit)
    }

    return envelopes.slice(0, limit)
}

export function findEnvelopeForCategory(
    categoryId: string,
    envelopes: { id: string; name: string }[]
): string | null {
    const category = EXPENSE_CATEGORIES.find(c => c.id === categoryId)
    if (!category) return null

    const envelope = envelopes.find(e => e.name === category.defaultEnvelope)
    return envelope?.id || null
}

export function getCategoryById(categoryId: string): Category | undefined {
    return EXPENSE_CATEGORIES.find(c => c.id === categoryId)
}

export function getCategoryIcon(categoryId: string): string {
    const category = EXPENSE_CATEGORIES.find(c => c.id === categoryId)
    return category?.icon || '📦'
}

export function getCategoryName(categoryId: string): string {
    const category = EXPENSE_CATEGORIES.find(c => c.id === categoryId)
    return category?.name || 'Inne'
}

// Filtruj kategorie wydatków (z przypisanymi kopertami)
export function getExpenseCategories(): Category[] {
    return EXPENSE_CATEGORIES.filter(c => c.defaultEnvelope !== '')
}

// Filtruj kategorie przychodów (bez przypisanych kopert)
export function getIncomeCategories(): Category[] {
    return EXPENSE_CATEGORIES.filter(c => c.defaultEnvelope === '')
}

// Filtruj kategorie dla konkretnej koperty
export function getCategoriesForEnvelope(envelopeName: string): Category[] {
    return EXPENSE_CATEGORIES.filter(c => c.defaultEnvelope === envelopeName)
}