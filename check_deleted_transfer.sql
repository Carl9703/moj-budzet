-- Sprawdź czy transakcja 30 zł została usunięta
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
  AND t.amount = 30
  AND (t.description LIKE '%Transfer:%' OR t."transferPairId" IS NOT NULL)
ORDER BY t.date DESC;

-- Sprawdź aktualne salda kopert
SELECT 
    name,
    type,
    "currentAmount",
    "plannedAmount"
FROM "Envelope" 
WHERE "userId" = 'YOUR_USER_ID_HERE'
  AND (name LIKE '%Budowanie%' OR name LIKE '%Wolne%')
ORDER BY name;
