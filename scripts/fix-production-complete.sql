-- KOMPLEKSOWA NAPRAWA PRODUKCJI
-- 
-- Ten skrypt:
-- 1. Naprawia typy kopert (envelopeType)
-- 2. Tworzy brakujące transakcje income

-- =====================================================================
-- KROK 1: NAPRAW TYPY KOPERT
-- =====================================================================

-- Budowanie Przyszłości -> savings
UPDATE "Envelope" 
SET "envelopeType" = 'savings' 
WHERE name = 'Budowanie Przyszłości';

-- Fundusz Awaryjny -> emergency
UPDATE "Envelope" 
SET "envelopeType" = 'emergency' 
WHERE name = 'Fundusz Awaryjny';

-- Wesele, Podróże, Wakacje -> goal  
UPDATE "Envelope" 
SET "envelopeType" = 'goal' 
WHERE name IN ('Wesele', 'Podróże', 'Wakacje');

-- Wolne środki -> savings (jeśli istnieje)
UPDATE "Envelope" 
SET "envelopeType" = 'savings' 
WHERE name ILIKE '%Wolne środki%';

-- =====================================================================
-- KROK 2: WERYFIKACJA TYPÓW
-- =====================================================================
SELECT id, name, type, "envelopeType", "group"
FROM "Envelope"
WHERE "envelopeType" IN ('savings', 'goal', 'emergency')
ORDER BY "envelopeType", name;

-- =====================================================================
-- KROK 3: SPRAWDŹ TRANSAKCJE DO NAPRAWY (SUCHA PRÓBA)
-- =====================================================================
SELECT 
    t.id as expense_id,
    t.description,
    t.amount,
    t.date,
    e.name as envelope_name,
    e."envelopeType"
FROM "Transaction" t
JOIN "Envelope" e ON t."envelopeId" = e.id
WHERE t.type = 'expense'
  AND t."includeInStats" = false
  AND (t."transferPairId" IS NULL OR t."transferPairId" = '')
  AND e."envelopeType" IN ('savings', 'goal', 'emergency')
  AND t.description NOT LIKE '%Zamknięcie miesiąca%'
ORDER BY t.date DESC;

-- =====================================================================
-- KROK 4: UTWÓRZ BRAKUJĄCE TRANSAKCJE INCOME
-- =====================================================================
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
    'fix_income_' || t.id,
    t."userId",
    'income',
    t.amount,
    CASE 
        WHEN t.description LIKE 'Transfer:%' THEN t.description
        ELSE 'Transfer: ' || t.description
    END,
    t.date,
    t."envelopeId",
    'fixed_' || t.id,
    false,
    NOW(),
    NOW()
FROM "Transaction" t
JOIN "Envelope" e ON t."envelopeId" = e.id
WHERE t.type = 'expense'
  AND t."includeInStats" = false
  AND (t."transferPairId" IS NULL OR t."transferPairId" = '')
  AND e."envelopeType" IN ('savings', 'goal', 'emergency')
  AND t.description NOT LIKE '%Zamknięcie miesiąca%';

-- =====================================================================
-- KROK 5: ZAKTUALIZUJ EXPENSE ABY MIAŁY TRANSFER_PAIR_ID
-- =====================================================================
UPDATE "Transaction" t
SET "transferPairId" = 'fixed_' || t.id
FROM "Envelope" e
WHERE t."envelopeId" = e.id
  AND t.type = 'expense'
  AND t."includeInStats" = false
  AND (t."transferPairId" IS NULL OR t."transferPairId" = '')
  AND e."envelopeType" IN ('savings', 'goal', 'emergency')
  AND t.description NOT LIKE '%Zamknięcie miesiąca%';

-- =====================================================================
-- KROK 6: WERYFIKACJA KOŃCOWA
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
