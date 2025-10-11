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
