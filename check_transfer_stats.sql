-- Sprawdź czy transfer ma includeInStats: false
SELECT 
    t.id,
    t.type,
    t.amount,
    t.description,
    t."includeInStats",
    t."transferPairId",
    e.name as envelope_name
FROM "Transaction" t
LEFT JOIN "Envelope" e ON t."envelopeId" = e.id
WHERE t."userId" = 'YOUR_USER_ID_HERE'
  AND t."transferPairId" IS NOT NULL
ORDER BY t.date DESC;
