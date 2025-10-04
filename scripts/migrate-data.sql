-- ⚠️ WAŻNE: PRZED URUCHOMIENIEM:
-- 1. Zrób backup bazy: pg_dump DATABASE_URL > backup_before_migration.sql
-- 2. Zamień <OLD_USER_ID> i <NEW_USER_ID> na prawdziwe wartości
-- 3. Wykonaj to w TRANSACTION żeby móc rollback w razie błędu

BEGIN;

-- Krok 1: Sprawdź liczby (dla weryfikacji)
SELECT 
    'OLD_USER' as user_type,
    COUNT(*) as transaction_count 
FROM "Transaction" 
WHERE "userId" = '<OLD_USER_ID>';

SELECT 
    'NEW_USER' as user_type,
    COUNT(*) as transaction_count 
FROM "Transaction" 
WHERE "userId" = '<NEW_USER_ID>';

-- Krok 2: Przenieś wszystkie transakcje
UPDATE "Transaction" 
SET "userId" = '<NEW_USER_ID>' 
WHERE "userId" = '<OLD_USER_ID>';

-- Krok 3: Przenieś wszystkie koperty
UPDATE "Envelope" 
SET "userId" = '<NEW_USER_ID>' 
WHERE "userId" = '<OLD_USER_ID>';

-- Krok 4: Przenieś konfigurację (jeśli istnieje)
UPDATE "UserConfig" 
SET "userId" = '<NEW_USER_ID>' 
WHERE "userId" = '<OLD_USER_ID>';

-- Krok 5: Usuń stary account (OPCJONALNIE - możesz zostawić)
-- DELETE FROM "User" WHERE id = '<OLD_USER_ID>';

-- Krok 6: Sprawdź wyniki
SELECT 
    'AFTER_MIGRATION' as status,
    COUNT(*) as transaction_count,
    (SELECT COUNT(*) FROM "Envelope" WHERE "userId" = '<NEW_USER_ID>') as envelope_count,
    (SELECT COUNT(*) FROM "UserConfig" WHERE "userId" = '<NEW_USER_ID>') as config_count
FROM "Transaction" 
WHERE "userId" = '<NEW_USER_ID>';

-- ⚠️ JEŚLI WSZYSTKO OK - COMMITNIJ:
COMMIT;

-- ⚠️ JEŚLI COŚ POSZŁO ŹLE - ROLLBACK:
-- ROLLBACK;

