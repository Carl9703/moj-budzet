-- Sprawdzenie obecnych użytkowników w bazie
SELECT 
    id, 
    email, 
    name,
    "createdAt",
    (SELECT COUNT(*) FROM "Transaction" WHERE "userId" = "User".id) as transaction_count,
    (SELECT COUNT(*) FROM "Envelope" WHERE "userId" = "User".id) as envelope_count
FROM "User"
ORDER BY "createdAt" ASC;

-- Sprawdzenie czy jest 'default-user' lub podobne
SELECT id, email FROM "User" WHERE email LIKE '%default%' OR id LIKE '%default%';

