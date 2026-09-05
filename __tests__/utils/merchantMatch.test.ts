import { describe, it, expect } from 'vitest'
import {
    findBestMatch,
    merchantKey,
    normalizeText,
    scoreMatch,
    stripDiacritics,
    tokenize
} from '@/lib/utils/merchantMatch'

describe('stripDiacritics', () => {
    it('usuwa polskie znaki, łącznie z "ł" które nie rozkłada się w NFD', () => {
        expect(stripDiacritics('Żabka')).toBe('Zabka')
        expect(stripDiacritics('Łódź')).toBe('Lodz')
        expect(stripDiacritics('gęślą jaźń')).toBe('gesla jazn')
    })
})

describe('normalizeText', () => {
    it('sprowadza do małych liter i usuwa interpunkcję', () => {
        expect(normalizeText('BLIK: Płatność 25,00 PLN')).toBe('blik platnosc 25 00 pln')
    })
})

describe('tokenize', () => {
    it('usuwa szum bankowy i kwoty', () => {
        expect(tokenize('BLIK: Platnosc 25,00 PLN ZABKA NANO')).toEqual(['zabka', 'nano'])
    })

    it('usuwa nazwę miasta, gdy zostaje inna treść', () => {
        expect(tokenize('ROSSMANN 123 GDYNIA')).toEqual(['rossmann'])
    })

    it('zachowuje miasto, gdy jest jedyną treścią opisu', () => {
        expect(tokenize('WARSZAWA')).toEqual(['warszawa'])
    })

    it('traktuje "przelew na telefon" jako całą frazę, nie zjadając słowa "telefon" osobno', () => {
        expect(tokenize('Przelew na telefon do Karoliny')).toEqual(['karoliny'])
        expect(tokenize('Telefon')).toEqual(['telefon'])
    })

    it('zwraca pustą listę dla opisu bez treści rozpoznawczej', () => {
        expect(tokenize('BLIK 25,00 PLN')).toEqual([])
    })
})

describe('merchantKey', () => {
    it('daje ten sam klucz dla wariantów zapisu tego samego sklepu', () => {
        expect(merchantKey('ZABKA NANO WARSZAWA')).toBe(merchantKey('Żabka Nano'))
    })

    it('zwraca null, gdy nie ma czego zapamiętać', () => {
        expect(merchantKey('BLIK 25,00 PLN')).toBeNull()
    })

    it('ogranicza klucz do trzech tokenów', () => {
        expect(merchantKey('SKLEP SPOZYWCZY POD DEBEM FILIA')?.split(' ')).toHaveLength(3)
    })
})

describe('scoreMatch', () => {
    it('dopasowuje mimo różnicy w diakrytykach', () => {
        expect(scoreMatch(tokenize('ZABKA NANO'), 'żabka')).toEqual({ score: 10, primaryMatched: true })
    })

    it('dopasowuje obustronnie po prefiksie (Rossmann / Rossman)', () => {
        expect(scoreMatch(tokenize('ROSSMANN GDYNIA'), 'Rossman').primaryMatched).toBe(true)
        expect(scoreMatch(tokenize('ROSSMAN'), 'Rossmann ').primaryMatched).toBe(true)
    })

    it('nie dopasowuje po prefiksie krótkich tokenów', () => {
        expect(scoreMatch(tokenize('ABC sklep'), 'abcd').primaryMatched).toBe(false)
    })
})

describe('findBestMatch', () => {
    const history = [
        { description: 'Przeglądy i naprawy auta', category: 'car' },
        { description: 'żabka', category: 'food' },
        { description: 'Biedronka — zakupy tygodniowe', category: 'groceries' }
    ]

    it('trafia w sklep mimo innego zapisu', () => {
        expect(findBestMatch('ZABKA NANO WARSZAWA', history)?.match.category).toBe('food')
    })

    it('nie sugeruje niczego dla samego BLIK-a', () => {
        expect(findBestMatch('BLIK 25,00 PLN', history)).toBeNull()
    })

    it('nie sugeruje niczego na podstawie samej nazwy miasta', () => {
        const withCity = [{ description: 'Hotel Warszawa', category: 'travel' }]
        expect(findBestMatch('KFC WARSZAWA', withCity)).toBeNull()
    })

    it('nie sugeruje niczego, gdy trafiony jest tylko token z dalszej pozycji', () => {
        const candidates = [{ description: 'Prezenty', category: 'gifts' }]
        expect(findBestMatch('SKLEP ODZIEZOWY PREZENTY', candidates)).toBeNull()
    })

    it('uznaje trafienie w drugi token, bo terminale poprzedzają sieć nazwą spółki', () => {
        expect(findBestMatch('MYJNIA auta', history)?.match.category).toBe('car')
    })

    it('wybiera dopasowanie o wyższym wyniku', () => {
        const candidates = [
            { description: 'Biedronka', category: 'a' },
            { description: 'Biedronka Gdynia Morska', category: 'b' }
        ]
        expect(findBestMatch('BIEDRONKA GDYNIA MORSKA 12', candidates)?.match.category).toBe('b')
    })
})

// Poniższe przypadki to dosłowne opisy zebrane z aplikacji BudgetSync na telefonie
// (shared_prefs/budget_sync_transactions.xml), a nie wymyślone przykłady.
describe('realne opisy z BudgetSync', () => {
    it('sprowadza wszystkie oddziały tej samej sieci do jednego klucza', () => {
        const keys = [
            'ZABKA Z5359 K.1',
            'ZABKA Z9243 K.1',
            'ZABKA Z9243 K.2',
            'ZABKA Z9327 K.1',
            'ZABKA Z4998 K.1'
        ].map(merchantKey)

        expect(new Set(keys)).toEqual(new Set(['zabka']))
    })

    it('pomija numer sklepu i formę prawną spółki', () => {
        expect(merchantKey('LIDL 2066')).toBe('lidl')
        expect(merchantKey('JMP S.A. BIEDRONKA 146')).toBe('jmp biedronka')
        expect(merchantKey('AUCHAN POLSKA SP. Z  0')).toBe('auchan polska')
        expect(merchantKey('ALDI SP. Z O.O')).toBe('aldi')
        expect(merchantKey('EMPIK S.A.')).toBe('empik')
        expect(merchantKey('eLeclerc 01')).toBe('eleclerc')
        expect(merchantKey('CIRCLE K SOPOT, NI')).toBe('circle')
        expect(merchantKey('DOZ.PL')).toBe('doz')
    })

    it('rozpoznaje sieć mimo nazwy spółki na początku', () => {
        const history = [{ description: 'biedronka', category: 'groceries' }]
        expect(findBestMatch('JMP S.A. BIEDRONKA 146', history)?.match.category).toBe('groceries')
    })

    it('łączy oddziały Lidla i Żabki z ręcznymi opisami z historii', () => {
        const history = [
            { description: 'lidl', category: 'groceries' },
            { description: 'żabka', category: 'food' }
        ]
        expect(findBestMatch('LIDL NIEPODLEGLOSCI', history)?.match.category).toBe('groceries')
        expect(findBestMatch('ZABKA Z9243 K.1', history)?.match.category).toBe('food')
    })

    // Sedno problemu: powiadomienia ING nie zawierają odbiorcy ani sklepu, więc każdy
    // BLIK wyglądałby identycznie. Bez tego wszystkie trafiłyby pod jeden klucz i
    // dziedziczyły kategorię po przypadkowym pierwszym BLIK-u.
    it('nie tworzy klucza z powiadomień BLIK z ING, bo nie ma w nich sprzedawcy', () => {
        expect(merchantKey('Płatność ING – konto Mobi 18-26 - płatność BLIK')).toBeNull()
        expect(merchantKey('Płatność ING – konto Mobi 18-26 - przelew na telefon BLIK')).toBeNull()
        expect(merchantKey('Płatność ING – konto Mobi 18-26')).toBeNull()
    })

    it('nie tworzy klucza z nieudanego parsowania nazwy karty', () => {
        expect(merchantKey('za pomocą karty MASTERCARD DEBIT')).toBeNull()
    })

    it('nie sugeruje niczego dla BLIK-a, nawet gdy historia ma podobne słowa', () => {
        const history = [
            { description: 'Telefon', category: 'bills' },
            { description: 'Przelew na konto', category: 'transfer' }
        ]
        expect(findBestMatch('Płatność ING – konto Mobi 18-26 - przelew na telefon BLIK', history)).toBeNull()
    })
})
