import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup/prisma'
import { buildMerchantSuggestion, learnMerchantRule } from '@/lib/services/merchantSuggestions'

const USER_ID = 'user-1'

function rule(overrides: Record<string, unknown> = {}) {
    return {
        id: 'rule-1',
        userId: USER_ID,
        key: 'zabka',
        displayName: 'Żabka',
        category: 'food',
        envelopeId: 'env-1',
        hitCount: 3,
        lastUsedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
    } as any
}

describe('buildMerchantSuggestion', () => {
    beforeEach(() => {
        prismaMock.envelope.findFirst.mockResolvedValue({ id: 'env-1' } as any)
        prismaMock.merchantRule.findUnique.mockResolvedValue(null)
        prismaMock.merchantRule.findMany.mockResolvedValue([])
        prismaMock.transaction.findMany.mockResolvedValue([])
    })

    it('używa nauczonej reguły i nie schodzi do historii', async () => {
        prismaMock.merchantRule.findUnique.mockResolvedValue(rule())

        const result = await buildMerchantSuggestion(prismaMock, USER_ID, 'BLIK: Platnosc ZABKA WARSZAWA')

        expect(result).toEqual({ suggestedCat: 'food', suggestedEnv: 'env-1', suggestedDesc: 'Żabka' })
        expect(prismaMock.transaction.findMany).not.toHaveBeenCalled()
    })

    it('nie odpytuje bazy, gdy w opisie nie ma nic rozpoznawczego', async () => {
        const result = await buildMerchantSuggestion(prismaMock, USER_ID, 'BLIK 25,00 PLN')

        expect(result).toEqual({ suggestedCat: null, suggestedEnv: null, suggestedDesc: null })
        expect(prismaMock.merchantRule.findUnique).not.toHaveBeenCalled()
    })

    it('pomija kopertę z reguły, gdy została usunięta', async () => {
        prismaMock.merchantRule.findUnique.mockResolvedValue(rule({ envelopeId: 'env-usunieta' }))
        prismaMock.envelope.findFirst.mockResolvedValue(null)

        const result = await buildMerchantSuggestion(prismaMock, USER_ID, 'ZABKA')

        expect(result.suggestedEnv).toBeNull()
        expect(result.suggestedCat).toBe('food')
    })

    it('dopasowuje regułę rozmyto, gdy klucz nie trafia dokładnie', async () => {
        prismaMock.merchantRule.findMany.mockResolvedValue([rule({ key: 'rossman', category: 'drogeria' })])

        const result = await buildMerchantSuggestion(prismaMock, USER_ID, 'ROSSMANN 123 GDYNIA')

        expect(result.suggestedCat).toBe('drogeria')
    })

    it('wraca do historii, gdy nie ma pasującej reguły', async () => {
        prismaMock.transaction.findMany.mockResolvedValue([
            { description: 'lidl', category: 'groceries', envelopeId: 'env-1' }
        ] as any)

        const result = await buildMerchantSuggestion(prismaMock, USER_ID, 'LIDL 456 SOPOT')

        expect(result).toEqual({ suggestedCat: 'groceries', suggestedEnv: 'env-1', suggestedDesc: 'lidl' })
    })

    it('nie sugeruje niczego dla BLIK-a z ING, bo powiadomienie nie zawiera sprzedawcy', async () => {
        prismaMock.transaction.findMany.mockResolvedValue([
            { description: 'Telefon', category: 'bills', envelopeId: 'env-1' }
        ] as any)

        const result = await buildMerchantSuggestion(
            prismaMock,
            USER_ID,
            'Płatność ING – konto Mobi 18-26 - przelew na telefon BLIK'
        )

        expect(result).toEqual({ suggestedCat: null, suggestedEnv: null, suggestedDesc: null })
        expect(prismaMock.merchantRule.findUnique).not.toHaveBeenCalled()
    })

    it('nie proponuje opisu identycznego z tym z synchronizatora', async () => {
        prismaMock.merchantRule.findUnique.mockResolvedValue(rule({ displayName: 'Żabka' }))

        const result = await buildMerchantSuggestion(prismaMock, USER_ID, '  żabka ')

        expect(result.suggestedDesc).toBeNull()
    })
})

describe('learnMerchantRule', () => {
    it('zapisuje decyzję użytkownika pod kluczem z surowego opisu', async () => {
        await learnMerchantRule(prismaMock, USER_ID, 'BLIK: Platnosc ZABKA NANO WARSZAWA', {
            description: 'Żabka',
            category: 'food',
            envelopeId: 'env-1'
        })

        expect(prismaMock.merchantRule.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { userId_key: { userId: USER_ID, key: 'zabka nano' } },
                create: expect.objectContaining({ displayName: 'Żabka', category: 'food', envelopeId: 'env-1' })
            })
        )
    })

    it('nie zapisuje reguły bez kategorii i koperty', async () => {
        await learnMerchantRule(prismaMock, USER_ID, 'ZABKA', {
            description: 'Żabka',
            category: null,
            envelopeId: null
        })

        expect(prismaMock.merchantRule.upsert).not.toHaveBeenCalled()
    })

    it('nie zapisuje reguły dla opisu bez treści rozpoznawczej', async () => {
        await learnMerchantRule(prismaMock, USER_ID, 'BLIK 25,00 PLN', {
            description: 'Kawa',
            category: 'food',
            envelopeId: 'env-1'
        })

        expect(prismaMock.merchantRule.upsert).not.toHaveBeenCalled()
    })
})
