-- AUDYT PEŁNY
-- Uruchom to najpierw, żeby zobaczyć co masz w bazie.

-- 1. Twoje zdefiniowane kategorie i ile transakcji do nich pasuje
SELECT 
    c.name AS "Twoja Kategoria", 
    c.id AS "ID Kategorii", 
    COUNT(t.id) AS "Liczba Transakcji"
FROM "Category" c
LEFT JOIN "Transaction" t ON t.category = c.id
GROUP BY c.id, c.name
ORDER BY c.name;

-- 2. Kategorie w transakcjach, które NIE są Twoimi kategoriami (czyli te ZEPSUTE/SYSTEMOWE)
SELECT 
    t.category AS "Błędne ID/Nazwa", 
    COUNT(*) AS "Liczba Transakcji",
    STRING_AGG(DISTINCT t.description, ', ') AS "Przykładowe Opisy"
FROM "Transaction" t
LEFT JOIN "Category" c ON t.category = c.id
WHERE c.id IS NULL -- nie pasuje do żadnej Twojej kategorii
GROUP BY t.category;
