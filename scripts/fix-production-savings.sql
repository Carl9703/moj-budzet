-- NAPRAWA PRODUKCJI: Utwórz brakujące transakcje INCOME dla historycznych transferów oszczędnościowych
-- Te transakcje były zapisane tylko jako expense, bez drugiej strony (income) na kopertę docelową.

-- =====================================================================
-- KROK 1: Sprawdź co będziemy naprawiać (SUCHA PRÓBA)
-- =====================================================================
SELECT 
    t.id as expense_id,
    t.description,
    t.amount,
    t.date,
    e.id as envelope_id,
    e.name as envelope_name,
    e."envelopeType"
FROM "Transaction" t
JOIN "Envelope" e ON t."envelopeId" = e.id
WHERE t.type = 'expense'
  AND t."includeInStats" = false
  AND (t."transferPairId" IS NULL OR t."transferPairId" = '')
  AND e."envelopeType" IN ('savings', 'goal', 'emergency')
ORDER BY t.date DESC;

-- =====================================================================
-- KROK 2: Utwórz brakujące transakcje INCOME (URUCHOM RĘCZNIE!)
-- =====================================================================
-- To utworzy transakcję income dla każdego expense do koperty oszczędnościowej

INSERT INTO "Transaction" (
    id,
    "userId",
    type,
    amount,
    description,
    date,
    "envelopeId",
    "transferPairId",
    "includeInStats",
    "createdAt",
    "updatedAt"
)
SELECT 
    'fix_income_' || t.id,  -- Unikalne ID z prefixem
    t."userId",
    'income',               -- Zmień na income
    t.amount,
    CASE 
        WHEN t.description LIKE 'Transfer:%' THEN t.description
        ELSE 'Transfer: ' || t.description
    END,
    t.date,
    t."envelopeId",         -- Ta sama koperta docelowa
    'fixed_' || t.id,       -- Utwórz transferPairId
    false,                  -- includeInStats = false
    NOW(),
    NOW()
FROM "Transaction" t
JOIN "Envelope" e ON t."envelopeId" = e.id
WHERE t.type = 'expense'
  AND t."includeInStats" = false
  AND (t."transferPairId" IS NULL OR t."transferPairId" = '')
  AND e."envelopeType" IN ('savings', 'goal', 'emergency');

-- =====================================================================
-- KROK 3: Opcjonalnie zaktualizuj oryginalne expense aby miały transferPairId
-- =====================================================================
UPDATE "Transaction" t
SET "transferPairId" = 'fixed_' || t.id
FROM "Envelope" e
WHERE t."envelopeId" = e.id
  AND t.type = 'expense'
  AND t."includeInStats" = false
  AND (t."transferPairId" IS NULL OR t."transferPairId" = '')
  AND e."envelopeType" IN ('savings', 'goal', 'emergency');

-- =====================================================================
-- KROK 4: Weryfikacja - powinny być pary transakcji
-- =====================================================================
SELECT 
    t.description,
    t.amount,
    t.type,
    t."transferPairId",
    e.name as envelope_name
FROM "Transaction" t
JOIN "Envelope" e ON t."envelopeId" = e.id
WHERE t."transferPairId" LIKE 'fixed_%'
ORDER BY t."transferPairId", t.type;
