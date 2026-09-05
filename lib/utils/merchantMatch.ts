/**
 * Normalizacja i dopasowywanie nazw sprzedawców z powiadomień bankowych (BudgetSync).
 *
 * Powiadomienia przychodzą w bardzo różnych formatach ("BLIK: Platnosc 25,00 PLN ZABKA
 * NANO WARSZAWA", "ROSSMANN 123 GDYNIA"), a historyczne opisy użytkownika są krótkie
 * i niespójne ("żabka", "Rossman", "lidl"). Dlatego przed porównaniem sprowadzamy oba
 * teksty do tokenów: bez diakrytyków, bez szumu bankowego i bez nazwy miasta.
 */

/** Minimalny wynik dopasowania, przy którym wolno wystawić sugestię. */
export const MIN_SUGGESTION_SCORE = 10

/** Waga trafienia w token wiodący - z reguły jest to nazwa sprzedawcy. */
const PRIMARY_TOKEN_WEIGHT = 10

/**
 * Ile pierwszych tokenów traktujemy jako nazwę sprzedawcy. Dwa, bo terminale
 * przedstawiają sieci przez spółkę: "JMP S.A. BIEDRONKA 146", "AUCHAN POLSKA SP. Z O.O".
 */
const PRIMARY_TOKEN_COUNT = 2

/** Minimalna długość tokenu, przy której dopuszczamy dopasowanie po prefiksie. */
const MIN_PREFIX_LENGTH = 4

/** Maksymalna liczba tokenów tworzących klucz reguły. */
const MAX_KEY_TOKENS = 3

/** Frazy bankowe usuwane w całości - w kawałkach byłyby mylące (np. "telefon"). */
const NOISE_PHRASES = [
    'przelew na telefon',
    'platnosc mobilna',
    'platnosc zblizeniowa',
    'zakup przy uzyciu karty',
    'platnosc kartą'
]

/** Pojedyncze słowa bez wartości rozpoznawczej. */
const NOISE_TOKENS = new Set([
    'blik', 'platnosc', 'platnosci', 'zaplacono', 'zaplata', 'oplata', 'oplaty',
    'transakcja', 'transakcji', 'karta', 'karty', 'kartowa', 'autoryzacja',
    'obciazenie', 'obciazenia', 'srodki', 'srodkow', 'przelew', 'przelewu', 'przelewem',
    'odbiorca', 'odbiorcy', 'nadawca', 'tytulem', 'tytul',
    'pln', 'eur', 'usd', 'gbp', 'chf', 'zlotych', 'kwota', 'kwocie',
    'dnia', 'godz', 'godzina', 'ref', 'terminal', 'terminala',
    'mobilna', 'mobilnej', 'internetowa', 'internetowej', 'internecie',
    // Etykiety banku i konta - powiadomienia ING składają się niemal wyłącznie z nich
    'ing', 'mobi', 'mbank', 'pko', 'pekao', 'santander', 'millennium', 'alior', 'revolut',
    'konto', 'konta', 'koncie', 'rachunek', 'rachunku', 'osobiste', 'osobistego',
    'mastercard', 'visa', 'debit', 'credit', 'debetowa', 'pomoca',
    // Końcówki domen ze sklepów internetowych
    'com', 'org', 'net'
])

/** Miasta usuwane tylko wtedy, gdy po ich usunięciu zostaje jakikolwiek inny token. */
const CITY_TOKENS = new Set([
    'warszawa', 'warszawie', 'krakow', 'krakowie', 'wroclaw', 'wroclawiu',
    'poznan', 'poznaniu', 'gdansk', 'gdansku', 'gdynia', 'gdyni', 'sopot', 'sopocie',
    'lodz', 'lodzi', 'szczecin', 'szczecinie', 'bydgoszcz', 'bydgoszczy',
    'lublin', 'lublinie', 'katowice', 'katowicach', 'bialystok', 'bialymstoku',
    'torun', 'toruniu', 'rzeszow', 'rzeszowie', 'kielce', 'kielcach',
    'olsztyn', 'olsztynie', 'gliwice', 'opole', 'radom', 'sosnowiec', 'czestochowa'
])

/**
 * Usuwa polskie znaki diakrytyczne. Uwaga: "ł" nie rozkłada się w NFD,
 * dlatego wymaga osobnego podmienienia.
 */
export function stripDiacritics(text: string): string {
    return text
        .replace(/ł/g, 'l')
        .replace(/Ł/g, 'L')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
}

/** Sprowadza tekst do postaci porównywalnej: małe litery, bez diakrytyków, bez interpunkcji. */
export function normalizeText(text: string): string {
    return stripDiacritics(text.toLowerCase())
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
}

/**
 * Rozbija opis na tokeny znaczące - bez szumu bankowego, samych liczb,
 * tokenów krótszych niż 3 znaki i (warunkowo) nazwy miasta.
 */
export function tokenize(text: string): string[] {
    let normalized = normalizeText(text)

    for (const phrase of NOISE_PHRASES) {
        normalized = normalized.replace(normalizeText(phrase), ' ')
    }

    const tokens = normalized
        .split(/\s+/)
        .filter(t => t.length > 2 && !/\d/.test(t) && !NOISE_TOKENS.has(t))

    const withoutCities = tokens.filter(t => !CITY_TOKENS.has(t))

    // Miasto usuwamy tylko, gdy nie jest jedyną treścią opisu
    return withoutCities.length > 0 ? withoutCities : tokens
}

/**
 * Klucz reguły sprzedawcy - stabilny identyfikator wyliczany z surowego opisu.
 * Zwraca null, gdy w opisie nie ma nic rozpoznawczego (np. samo "BLIK 25,00 PLN").
 */
export function merchantKey(text: string): string | null {
    const tokens = tokenize(text).slice(0, MAX_KEY_TOKENS)
    return tokens.length > 0 ? tokens.join(' ') : null
}

/** Dwa tokeny uznajemy za zgodne, gdy są równe albo jeden jest prefiksem drugiego. */
function tokensMatch(a: string, b: string): boolean {
    if (a === b) return true
    if (a.length < MIN_PREFIX_LENGTH || b.length < MIN_PREFIX_LENGTH) return false
    return a.startsWith(b) || b.startsWith(a)
}

/**
 * Wynik dopasowania tokenów przychodzącego opisu do opisu historycznego.
 * Tokeny wiodące ważą 10, pozostałe (miasto, ulica, dopisek terminala) po 1.
 */
export function scoreMatch(queryTokens: string[], candidateText: string): { score: number; primaryMatched: boolean } {
    if (queryTokens.length === 0) return { score: 0, primaryMatched: false }

    const candidateTokens = tokenize(candidateText)
    if (candidateTokens.length === 0) return { score: 0, primaryMatched: false }

    let score = 0
    let primaryMatched = false

    queryTokens.forEach((token, index) => {
        const hit = candidateTokens.some(c => tokensMatch(token, c))
        if (!hit) return

        if (index < PRIMARY_TOKEN_COUNT && !primaryMatched) {
            primaryMatched = true
            score += PRIMARY_TOKEN_WEIGHT
        } else {
            score += 1
        }
    })

    return { score, primaryMatched }
}

export interface MatchCandidate {
    description: string | null
}

/**
 * Wybiera najlepszego kandydata dla opisu z synchronizatora.
 *
 * Zwraca wynik tylko wtedy, gdy trafiliśmy w token wiodący (nazwę sprzedawcy)
 * i przekroczyliśmy próg - inaczej wolimy brak sugestii niż sugestię wylosowaną
 * z przypadkowego słowa typu nazwa miasta.
 */
export function findBestMatch<T extends MatchCandidate>(
    description: string,
    candidates: T[]
): { match: T; score: number } | null {
    const queryTokens = tokenize(description)
    if (queryTokens.length === 0) return null

    let best: T | null = null
    let bestScore = 0

    for (const candidate of candidates) {
        if (!candidate.description) continue

        const { score, primaryMatched } = scoreMatch(queryTokens, candidate.description)
        if (!primaryMatched || score < MIN_SUGGESTION_SCORE) continue

        if (score > bestScore) {
            bestScore = score
            best = candidate
        }
    }

    return best ? { match: best, score: bestScore } : null
}
