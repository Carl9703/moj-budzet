-- Sprawdź koperty użytkownika
SELECT 
    id,
    name,
    type,
    "currentAmount",
    "plannedAmount",
    icon,
    "group"
FROM "Envelope" 
WHERE "userId" = 'YOUR_USER_ID_HERE'
ORDER BY type, name;

-- Sprawdź transakcje transferów
SELECT 
    t.id,
    t.type,
    t.amount,
    t.description,
    t.date,
    t."transferPairId",
    t."includeInStats",
    e.name as envelope_name
FROM "Transaction" t
LEFT JOIN "Envelope" e ON t."envelopeId" = e.id
WHERE t."userId" = 'YOUR_USER_ID_HERE'
  AND (t.description LIKE '%Transfer:%' OR t."transferPairId" IS NOT NULL)
ORDER BY t.date DESC;

-- Sprawdź ostatnie transakcje (ostatnie 10)
SELECT 
    t.id,
    t.type,
    t.amount,
    t.description,
    t.date,
    t."transferPairId",
    e.name as envelope_name
FROM "Transaction" t
LEFT JOIN "Envelope" e ON t."envelopeId" = e.id
WHERE t."userId" = 'YOUR_USER_ID_HERE'
ORDER BY t.date DESC
LIMIT 10;

-- Sprawdź konkretną kopertę (np. Budowanie Przyszłości)
SELECT 
    e.id,
    e.name,
    e.type,
    e."currentAmount",
    e."plannedAmount",
    e.icon,
    e."group"
FROM "Envelope" e
WHERE e."userId" = 'YOUR_USER_ID_HERE'
  AND (e.name LIKE '%Budowanie%' OR e.name LIKE '%Przyszłości%');

-- Sprawdź transakcje dla konkretnej koperty
SELECT 
    t.id,
    t.type,
    t.amount,
    t.description,
    t.date,
    t."transferPairId"
FROM "Transaction" t
JOIN "Envelope" e ON t."envelopeId" = e.id
WHERE e."userId" = 'YOUR_USER_ID_HERE'
  AND e.name LIKE '%Budowanie%'
ORDER BY t.date DESC;
