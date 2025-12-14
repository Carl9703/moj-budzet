-- Skrypt ID-RECOVERY (Aktualizacja 2)
-- Dodałem: Drogeria, IKE, Wspólne zakupy

-- 1. Kosmetyki / Drogeria -> drugstore
UPDATE "Transaction" t
SET "category" = c.id
FROM "Category" c
WHERE t."userId" = c."userId"
  AND t."category" = 'drugstore'
  AND c.name IN ('Kosmetyki', 'Drogeria'); -- Dodałem 'Drogeria'

-- 2. Moje zakupy -> personal-groceries
UPDATE "Transaction" t
SET "category" = c.id
FROM "Category" c
WHERE t."userId" = c."userId"
  AND t."category" = 'personal-groceries'
  AND c.name = 'Moje zakupy';

-- 3. Zakupy dom / Wspólne zakupy -> shared-groceries
UPDATE "Transaction" t
SET "category" = c.id
FROM "Category" c
WHERE t."userId" = c."userId"
  AND t."category" = 'shared-groceries'
  AND c.name IN ('Zakupy dom', 'Wspólne zakupy'); -- Dodałem 'Wspólne zakupy'

-- 4. Paliwo / Paliwo do auta -> fuel
UPDATE "Transaction" t
SET "category" = c.id
FROM "Category" c
WHERE t."userId" = c."userId"
  AND t."category" = 'fuel'
  AND c.name IN ('Paliwo', 'Paliwo do auta');

-- 5. Czynsz / Opłaty / Wspólne opłaty -> housing-bills
UPDATE "Transaction" t
SET "category" = c.id
FROM "Category" c
WHERE t."userId" = c."userId"
  AND t."category" = 'housing-bills'
  AND c.name IN ('Czynsz', 'Opłaty', 'Wspólne opłaty');

-- 6. Wyposażenie / Sprzęt RTV -> housing-equipment
UPDATE "Transaction" t
SET "category" = c.id
FROM "Category" c
WHERE t."userId" = c."userId"
  AND t."category" = 'housing-equipment'
  AND c.name IN ('Wyposażenie', 'Sprzęt RTV');

-- 7. Lekarstwa / Fizjo -> healthcare
UPDATE "Transaction" t
SET "category" = c.id
FROM "Category" c
WHERE t."userId" = c."userId"
  AND t."category" = 'healthcare'
  AND c.name IN ('Lekarstwa', 'Fizjo');

-- 8. Telefon -> phone
UPDATE "Transaction" t
SET "category" = c.id
FROM "Category" c
WHERE t."userId" = c."userId"
  AND t."category" = 'phone'
  AND c.name = 'Telefon';

-- 9. Subskrypcje -> subscriptions
UPDATE "Transaction" t
SET "category" = c.id
FROM "Category" c
WHERE t."userId" = c."userId"
  AND t."category" = 'subscriptions'
  AND c.name = 'Subskrypcje';

-- 10. Hobby / Gry -> hobby
UPDATE "Transaction" t
SET "category" = c.id
FROM "Category" c
WHERE t."userId" = c."userId"
  AND t."category" = 'hobby'
  AND c.name IN ('Hobby', 'Gry');

-- 11. Prezenty -> gifts
UPDATE "Transaction" t
SET "category" = c.id
FROM "Category" c
WHERE t."userId" = c."userId"
  AND t."category" = 'gifts'
  AND c.name = 'Prezenty';

-- 12. Fryzjer -> beauty
UPDATE "Transaction" t
SET "category" = c.id
FROM "Category" c
WHERE t."userId" = c."userId"
  AND t."category" = 'beauty'
  AND c.name = 'Fryzjer';

-- 13. Jedzenie miasto -> restaurants
UPDATE "Transaction" t
SET "category" = c.id
FROM "Category" c
WHERE t."userId" = c."userId"
  AND t."category" = 'restaurants'
  AND c.name = 'Jedzenie miasto';

-- 14. Ubrania -> clothes
UPDATE "Transaction" t
SET "category" = c.id
FROM "Category" c
WHERE t."userId" = c."userId"
  AND t."category" = 'clothes'
  AND c.name = 'Ubrania';

-- 15. Przeglądy i naprawy auta -> car-repairs
UPDATE "Transaction" t
SET "category" = c.id
FROM "Category" c
WHERE t."userId" = c."userId"
  AND t."category" = 'car-repairs'
  AND c.name = 'Przeglądy i naprawy auta';

-- 16. Wyjazdy -> weekend-trips
UPDATE "Transaction" t
SET "category" = c.id
FROM "Category" c
WHERE t."userId" = c."userId"
  AND t."category" = 'weekend-trips'
  AND c.name = 'Wyjazdy';

-- 17. IKE -> ike
UPDATE "Transaction" t
SET "category" = c.id
FROM "Category" c
WHERE t."userId" = c."userId"
  AND t."category" = 'ike'
  AND c.name = 'IKE';
