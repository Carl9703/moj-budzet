import { Prisma, PrismaClient } from '@prisma/client'
import { findBestMatch, merchantKey } from '@/lib/utils/merchantMatch'

/** Klient Prismy albo transakcja - serwis działa w obu kontekstach. */
type Db = PrismaClient | Prisma.TransactionClient

/** Ile ostatnich transakcji przeglądamy, gdy nie ma jeszcze nauczonej reguły. */
const HISTORY_SAMPLE_SIZE = 200

export interface MerchantSuggestion {
    suggestedCat: string | null
    suggestedEnv: string | null
    suggestedDesc: string | null
}

const EMPTY_SUGGESTION: MerchantSuggestion = {
    suggestedCat: null,
    suggestedEnv: null,
    suggestedDesc: null
}

/** Koperta z reguły mogła zostać w międzyczasie usunięta - nie sugerujemy martwego ID. */
async function resolveEnvelope(db: Db, userId: string, envelopeId: string | null): Promise<string | null> {
    if (!envelopeId) return null
    const envelope = await db.envelope.findFirst({
        where: { id: envelopeId, userId },
        select: { id: true }
    })
    return envelope?.id ?? null
}

/** Opis proponujemy tylko wtedy, gdy realnie różni się od tego z synchronizatora. */
function pickSuggestedDesc(learned: string | null, raw: string): string | null {
    if (!learned) return null
    const cleaned = learned.trim()
    if (!cleaned) return null
    return cleaned.toLowerCase() === raw.trim().toLowerCase() ? null : cleaned
}

/**
 * Buduje sugestie kategorii/koperty/opisu dla transakcji z BudgetSync.
 *
 * Kolejność źródeł: nauczona reguła (dokładny klucz) → nauczona reguła (dopasowanie
 * rozmyte) → historia ostatnich transakcji. Każde źródło musi przekroczyć próg
 * pewności z merchantMatch - brak sugestii jest lepszy niż sugestia z przypadkowego
 * słowa, bo interfejs odblokowuje "Szybki akcept" właśnie na jej podstawie.
 */
export async function buildMerchantSuggestion(
    db: Db,
    userId: string,
    description: string
): Promise<MerchantSuggestion> {
    const key = merchantKey(description)
    if (!key) return EMPTY_SUGGESTION

    const exactRule = await db.merchantRule.findUnique({
        where: { userId_key: { userId, key } }
    })

    if (exactRule) {
        return {
            suggestedCat: exactRule.category,
            suggestedEnv: await resolveEnvelope(db, userId, exactRule.envelopeId),
            suggestedDesc: pickSuggestedDesc(exactRule.displayName, description)
        }
    }

    // Klucz nie trafił dokładnie (np. inny oddział sklepu) - próbujemy rozmyto po regułach
    const rules = await db.merchantRule.findMany({
        where: { userId },
        orderBy: [{ hitCount: 'desc' }, { lastUsedAt: 'desc' }]
    })

    const ruleMatch = findBestMatch(
        description,
        rules.map(rule => ({ ...rule, description: rule.key }))
    )

    if (ruleMatch) {
        return {
            suggestedCat: ruleMatch.match.category,
            suggestedEnv: await resolveEnvelope(db, userId, ruleMatch.match.envelopeId),
            suggestedDesc: pickSuggestedDesc(ruleMatch.match.displayName, description)
        }
    }

    // Brak reguł - fallback na historię, żeby aplikacja działała od pierwszego importu
    const recentTransactions = await db.transaction.findMany({
        where: { userId, type: 'expense' },
        select: { description: true, category: true, envelopeId: true },
        orderBy: { date: 'desc' },
        take: HISTORY_SAMPLE_SIZE
    })

    const historyMatch = findBestMatch(description, recentTransactions)
    if (!historyMatch) return EMPTY_SUGGESTION

    return {
        suggestedCat: historyMatch.match.category,
        suggestedEnv: await resolveEnvelope(db, userId, historyMatch.match.envelopeId),
        suggestedDesc: pickSuggestedDesc(historyMatch.match.description, description)
    }
}

/**
 * Zapisuje to, co użytkownik zatwierdził, jako regułę dla danego sprzedawcy.
 *
 * Uczymy się z surowego opisu z synchronizatora (bo taki przyjdzie następnym razem),
 * a zapamiętujemy poprawioną kategorię, kopertę i nazwę.
 */
export async function learnMerchantRule(
    db: Db,
    userId: string,
    rawDescription: string,
    approved: { description: string; category: string | null; envelopeId: string | null }
): Promise<void> {
    const key = merchantKey(rawDescription)
    if (!key) return

    // Reguła bez kategorii i koperty nie niesie żadnej informacji
    if (!approved.category && !approved.envelopeId) return

    const displayName = approved.description.trim()
    if (!displayName) return

    await db.merchantRule.upsert({
        where: { userId_key: { userId, key } },
        create: {
            userId,
            key,
            displayName,
            category: approved.category,
            envelopeId: approved.envelopeId
        },
        update: {
            displayName,
            category: approved.category,
            envelopeId: approved.envelopeId,
            hitCount: { increment: 1 },
            lastUsedAt: new Date()
        }
    })
}
