export interface Category {
    id: string
    name: string
    icon: string
    defaultEnvelope: string
    type: 'monthly' | 'yearly'
}

export const EXPENSE_CATEGORIES: Category[] = [
    // GRUPA 1: POTRZEBY - Mieszkanie
    { id: 'housing-bills', name: 'Wspólne opłaty', icon: '🏠', defaultEnvelope: 'Mieszkanie', type: 'monthly' },
    { id: 'housing-equipment', name: 'Wyposażenie', icon: '🛋️', defaultEnvelope: 'Mieszkanie', type: 'monthly' },
    { id: 'housing-repairs', name: 'Naprawy domowe', icon: '🔨', defaultEnvelope: 'Mieszkanie', type: 'monthly' },

    // GRUPA 1: POTRZEBY - Żywność
    { id: 'shared-groceries', name: 'Wspólne zakupy', icon: '🛒', defaultEnvelope: 'Żywność', type: 'monthly' },
    { id: 'personal-groceries', name: 'Moje zakupy', icon: '🛍️', defaultEnvelope: 'Żywność', type: 'monthly' },

    // GRUPA 1: POTRZEBY - Transport
    { id: 'fuel', name: 'Paliwo', icon: '⛽', defaultEnvelope: 'Transport', type: 'monthly' },
    { id: 'public-transport', name: 'Komunikacja miejska', icon: '🚌', defaultEnvelope: 'Transport', type: 'monthly' },
    { id: 'parking', name: 'Parkingi', icon: '🅿️', defaultEnvelope: 'Transport', type: 'monthly' },

    // GRUPA 1: POTRZEBY - Zdrowie i Higiena
    { id: 'healthcare', name: 'Lekarz i Leki', icon: '👨‍⚕️', defaultEnvelope: 'Zdrowie i Higiena', type: 'monthly' },
    { id: 'drugstore', name: 'Drogeria', icon: '🧴', defaultEnvelope: 'Zdrowie i Higiena', type: 'monthly' },

    // GRUPA 1: POTRZEBY - Rachunki i Subskrypcje
    { id: 'phone', name: 'Telefon(y)', icon: '📱', defaultEnvelope: 'Rachunki i Subskrypcje', type: 'monthly' },
    { id: 'subscriptions', name: 'Subskrypcje', icon: '📺', defaultEnvelope: 'Rachunki i Subskrypcje', type: 'monthly' },

    // GRUPA 2: STYL ŻYCIA - Wydatki Osobiste
    { id: 'hobby', name: 'Hobby', icon: '🎮', defaultEnvelope: 'Wydatki Osobiste', type: 'monthly' },
    { id: 'entertainment', name: 'Wyjścia', icon: '🎬', defaultEnvelope: 'Wydatki Osobiste', type: 'monthly' },
    { id: 'books', name: 'Książki', icon: '📚', defaultEnvelope: 'Wydatki Osobiste', type: 'monthly' },
    { id: 'sport', name: 'Sport', icon: '⚽', defaultEnvelope: 'Wydatki Osobiste', type: 'monthly' },
    { id: 'beauty', name: 'Fryzjer/Uroda', icon: '💇', defaultEnvelope: 'Wydatki Osobiste', type: 'monthly' },

    // GRUPA 2: STYL ŻYCIA - Gastronomia
    { id: 'restaurants', name: 'Restauracje', icon: '🍕', defaultEnvelope: 'Gastronomia', type: 'monthly' },
    { id: 'work-lunch', name: 'Lunch w pracy', icon: '🍽️', defaultEnvelope: 'Gastronomia', type: 'monthly' },

    // GRUPA 2: STYL ŻYCIA - Ubrania i Akcesoria
    { id: 'clothes', name: 'Odzież', icon: '👕', defaultEnvelope: 'Ubrania i Akcesoria', type: 'monthly' },
    { id: 'shoes', name: 'Obuwie', icon: '👟', defaultEnvelope: 'Ubrania i Akcesoria', type: 'monthly' },
    { id: 'accessories', name: 'Dodatki', icon: '👜', defaultEnvelope: 'Ubrania i Akcesoria', type: 'monthly' },

    // GRUPA 3: CELE FINANSOWE - Budowanie Przyszłości
    { id: 'ike', name: 'IKE', icon: '📈', defaultEnvelope: 'Budowanie Przyszłości', type: 'yearly' },
    { id: 'crypto', name: 'Kryptowaluty', icon: '₿', defaultEnvelope: 'Budowanie Przyszłości', type: 'yearly' },

    // FUNDUSZE CELOWE - Auto: Serwis i Ubezpieczenie
    { id: 'car-insurance', name: 'Ubezpieczenie', icon: '📋', defaultEnvelope: 'Auto: Serwis i Ubezpieczenie', type: 'yearly' },
    { id: 'car-repairs', name: 'Naprawy auta', icon: '🔧', defaultEnvelope: 'Auto: Serwis i Ubezpieczenie', type: 'yearly' },

    // FUNDUSZE CELOWE - Podróże
    { id: 'vacation', name: 'Wakacje', icon: '✈️', defaultEnvelope: 'Podróże', type: 'yearly' },
    { id: 'weekend-trips', name: 'Wyjazdy Weekendowe', icon: '🏖️', defaultEnvelope: 'Podróże', type: 'yearly' },

    // FUNDUSZE CELOWE - Wesele
    { id: 'wedding', name: 'Wesele', icon: '💍', defaultEnvelope: 'Wesele', type: 'yearly' },

    // FUNDUSZE CELOWE - Prezenty i Okazje
    { id: 'gifts', name: 'Prezenty', icon: '🎁', defaultEnvelope: 'Prezenty i Okazje', type: 'yearly' },

    // FUNDUSZE CELOWE - Fundusz Awaryjny
    { id: 'emergency', name: 'Fundusz Awaryjny', icon: '🚨', defaultEnvelope: 'Fundusz Awaryjny', type: 'monthly' },

    // PRZYCHODY (bez zmian)
    { id: 'salary', name: 'Wypłata', icon: '💼', defaultEnvelope: '', type: 'monthly' },
    { id: 'bonus', name: 'Premia', icon: '🎁', defaultEnvelope: '', type: 'yearly' },
    { id: 'other-income', name: 'Inne przychody', icon: '💵', defaultEnvelope: '', type: 'monthly' },
    { id: 'investments', name: 'Inwestycje', icon: '📈', defaultEnvelope: '', type: 'monthly' },

    // FALLBACK - dla nieprzypisanych kategorii
    { id: 'other', name: 'Inne wydatki', icon: '📦', defaultEnvelope: '', type: 'monthly' },
]

// Funkcja do pobrania mapy kategorii do kopert (dynamicznie z localStorage)
export function getCategoryToEnvelopeMap(): Record<string, string> {
    const allCategories = getAllCategories()
    return allCategories.reduce(
        (acc, category) => {
            acc[category.id] = category.defaultEnvelope
            return acc
        },
        {} as Record<string, string>
    )
}

// Dla kompatybilności wstecznej - używa domyślnych kategorii
export const CATEGORY_TO_ENVELOPE_MAP: Record<string, string> = EXPENSE_CATEGORIES.reduce(
    (acc, category) => {
        acc[category.id] = category.defaultEnvelope
        return acc
    },
    {} as Record<string, string>
)


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
    const allCategories = getAllCategories()
    const category = allCategories.find(c => c.id === categoryId)
    if (!category) return null

    const envelope = envelopes.find(e => e.name === category.defaultEnvelope)
    return envelope?.id || null
}

export function getCategoryById(categoryId: string): Category | undefined {
    const allCategories = getAllCategories()
    return allCategories.find(c => c.id === categoryId)
}

export function getCategoryIcon(categoryId: string): string {
    const allCategories = getAllCategories()
    const category = allCategories.find(c => c.id === categoryId)
    return category?.icon || '📦'
}

export function getCategoryName(categoryId: string): string {
    const allCategories = getAllCategories()
    const category = allCategories.find(c => c.id === categoryId)
    return category?.name || 'Inne'
}

// Pobierz wszystkie kategorie (z localStorage jeśli dostępne, w przeciwnym razie domyślne)
export function getAllCategories(): Category[] {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('expenseCategories')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed
                }
            } catch {
                // Jeśli błąd parsowania, użyj domyślnych
            }
        }
    }
    return EXPENSE_CATEGORIES
}

// Filtruj kategorie wydatków (z przypisanymi kopertami)
export function getExpenseCategories(): Category[] {
    const allCategories = getAllCategories()
    return allCategories.filter(c => c.defaultEnvelope !== '')
}


// Filtruj kategorie dla konkretnej koperty
export function getCategoriesForEnvelope(envelopeName: string): Category[] {
    const allCategories = getAllCategories()
    return allCategories.filter(c => c.defaultEnvelope === envelopeName)
}