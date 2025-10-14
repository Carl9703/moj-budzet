-- 🔍 SPRAWDZENIE BAZY DANYCH - PROBLEM Z DEMO USER
-- Uruchom te zapytania w swojej bazie PostgreSQL

-- 1. Sprawdź wszystkich użytkowników
SELECT 
    id,
    email,
    name,
    "createdAt",
    "isActive"
FROM "User"
ORDER BY "createdAt" DESC;

-- 2. Sprawdź transakcje demo user
SELECT 
    t.id,
    t.type,
    t.amount,
    t.description,
    t.date,
    u.email as user_email,
    e.name as envelope_name
FROM "Transaction" t
JOIN "User" u ON t."userId" = u.id
LEFT JOIN "Envelope" e ON t."envelopeId" = e.id
WHERE u.email = 'demo@example.com'
ORDER BY t.date DESC
LIMIT 20;

-- 3. Sprawdź koperty demo user
SELECT 
    e.name,
    e.type,
    e."plannedAmount",
    e."currentAmount",
    e.group,
    u.email as user_email
FROM "Envelope" e
JOIN "User" u ON e."userId" = u.id
WHERE u.email = 'demo@example.com'
ORDER BY e.name;

-- 4. Sprawdź czy demo user ma dostęp do transakcji innych użytkowników
-- (To nie powinno się zdarzyć, ale sprawdźmy)
SELECT 
    t.id,
    t.type,
    t.amount,
    t.description,
    u.email as user_email,
    t."createdAt"
FROM "Transaction" t
JOIN "User" u ON t."userId" = u.id
WHERE u.email != 'demo@example.com'
ORDER BY t."createdAt" DESC
LIMIT 10;

-- 5. Sprawdź wszystkie transakcje w systemie (ostatnie 20)
SELECT 
    t.id,
    t.type,
    t.amount,
    t.description,
    u.email as user_email,
    e.name as envelope_name,
    t.date
FROM "Transaction" t
JOIN "User" u ON t."userId" = u.id
LEFT JOIN "Envelope" e ON t."envelopeId" = e.id
ORDER BY t.date DESC
LIMIT 20;

-- 6. Sprawdź konfigurację demo user
SELECT 
    uc."defaultSalary",
    uc."defaultToJoint",
    uc."defaultToSavings",
    uc."defaultToVacation",
    uc."defaultToWedding",
    uc."defaultToGroceries",
    uc."defaultToInvestment",
    u.email
FROM "UserConfig" uc
JOIN "User" u ON uc."userId" = u.id
WHERE u.email = 'demo@example.com';

-- 7. Sprawdź czy są duplikaty użytkowników
SELECT 
    email,
    COUNT(*) as count
FROM "User"
GROUP BY email
HAVING COUNT(*) > 1;

-- 8. Sprawdź czy demo user ma transakcje z Twoimi kopertami
-- (To byłoby problemem bezpieczeństwa)
SELECT 
    t.id,
    t.type,
    t.amount,
    t.description,
    u.email as transaction_user,
    e.name as envelope_name,
    eu.email as envelope_owner
FROM "Transaction" t
JOIN "User" u ON t."userId" = u.id
JOIN "Envelope" e ON t."envelopeId" = e.id
JOIN "User" eu ON e."userId" = eu.id
WHERE u.email = 'demo@example.com'
AND eu.email != 'demo@example.com';

-- 9. Sprawdź czy demo user ma koperty innych użytkowników
-- (To byłoby poważnym problemem bezpieczeństwa)
SELECT 
    e.name,
    e.type,
    e."plannedAmount",
    e."currentAmount",
    eu.email as envelope_owner,
    u.email as access_user
FROM "Envelope" e
JOIN "User" eu ON e."userId" = eu.id
JOIN "User" u ON u.id = e."userId"
WHERE u.email = 'demo@example.com'
AND eu.email != 'demo@example.com';

-- 10. Sprawdź czy są problemy z indeksami userId
-- (To może powodować problemy z filtrowaniem)
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('Transaction', 'Envelope', 'User')
AND indexdef LIKE '%userId%';
