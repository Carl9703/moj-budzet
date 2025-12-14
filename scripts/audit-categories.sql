-- Skrypt do audytu kategorii transakcji
-- Cel: Znalezienie transakcji, które mają kategorię spoza zdefiniowanej listy (np. stare nazwy zamiast ID)

WITH ValidCategories AS (
    SELECT unnest(ARRAY[
        'housing-bills', 'housing-equipment', 'housing-repairs',
        'shared-groceries', 'personal-groceries',
        'fuel', 'public-transport', 'parking',
        'healthcare', 'drugstore',
        'phone', 'subscriptions',
        'hobby', 'entertainment', 'books', 'sport', 'beauty',
        'restaurants', 'work-lunch',
        'clothes', 'shoes', 'accessories',
        'ike', 'crypto',
        'car-insurance', 'car-repairs',
        'vacation', 'weekend-trips',
        'wedding', 'gifts', 'emergency',
        'salary', 'bonus', 'other-income', 'investments', 'other'
    ]) AS category_id
)
SELECT 
    t."category",
    COUNT(*) as transaction_count,
    MIN(t."date") as first_seen,
    MAX(t."date") as last_seen,
    string_agg(DISTINCT t."description", ', ') FILTER (WHERE t."description" IS NOT NULL) as sample_descriptions
FROM "Transaction" t
LEFT JOIN ValidCategories vc ON t."category" = vc.category_id
WHERE vc.category_id IS NULL
  AND t."category" IS NOT NULL -- Ignorujemy nulle jeśli to dozwolone, lub usuń tę linię jeśli chcesz też znaleźć nulle
GROUP BY t."category"
ORDER BY last_seen DESC;
