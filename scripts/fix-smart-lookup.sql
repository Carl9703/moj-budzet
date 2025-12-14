-- Skrypt ID-MATCH (Smart Lookup)
-- Ten skrypt szuka pasujących nazw w tabeli Category i aktualizuje transakcje używając ich ID.
-- Rozwiązuje problem mapowania "Kosmetyki" -> ID Twojej kategorii "Kosmetyki" (zamiast systemowej).

UPDATE "Transaction" t
SET "category" = c.id
FROM "Category" c
WHERE t."userId" = c."userId"        -- Musi należeć do tego samego użytkownika
  AND TRIM(t."category") = c.name    -- Nazwa w transakcji odpowiada nazwie kategorii
  AND t."category" != c.id;          -- Unikamy aktualizacji jeśli już jest ID
