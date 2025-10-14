-- 🚨 SZYBKIE SPRAWDZENIE PROBLEMU Z DEMO USER

-- 1. Sprawdź czy demo user istnieje
SELECT id, email, name FROM "User" WHERE email = 'demo@example.com';

-- 2. Sprawdź transakcje demo user (jeśli istnieje)
SELECT 
    COUNT(*) as total_transactions,
    SUM(amount) as total_amount,
    MIN(date) as first_transaction,
    MAX(date) as last_transaction
FROM "Transaction" t
JOIN "User" u ON t."userId" = u.id
WHERE u.email = 'demo@example.com';

-- 3. Sprawdź koperty demo user
SELECT 
    COUNT(*) as total_envelopes,
    SUM("plannedAmount") as total_planned,
    SUM("currentAmount") as total_current
FROM "Envelope" e
JOIN "User" u ON e."userId" = u.id
WHERE u.email = 'demo@example.com';

-- 4. Sprawdź czy demo user ma transakcje z innymi kopertami
SELECT 
    COUNT(*) as cross_user_transactions
FROM "Transaction" t
JOIN "User" u ON t."userId" = u.id
JOIN "Envelope" e ON t."envelopeId" = e.id
JOIN "User" eu ON e."userId" = eu.id
WHERE u.email = 'demo@example.com'
AND eu.email != 'demo@example.com';

-- 5. Sprawdź wszystkie emaile użytkowników
SELECT email, name, "createdAt" FROM "User" ORDER BY "createdAt" DESC;
