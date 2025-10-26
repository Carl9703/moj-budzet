-- ========================================
-- RESET SALDA KONTA GŁÓWNEGO
-- ========================================

-- 1. Usuń wszystkie historyczne transakcje
DELETE FROM "Transaction" 
WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn' 
AND date < '2025-09-01';

-- 2. Dodaj jedną transakcję przychodu z aktualnym saldem
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_reset_balance', 'cmgm8hqws00006gcj13vo7jqn', 'income', 10032.29, 'Saldo początkowe - Import historycznych danych', '2025-09-01', null, null, true, NOW(), NOW());

-- 3. Sprawdzenie stanu po resecie
SELECT 
  'Po resecie' as status,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as total_balance_from_transactions,
  (SELECT "currentAmount" FROM "Envelope" WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn' AND name = 'Fundusz Awaryjny') as emergency_fund_amount,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) - (SELECT "currentAmount" FROM "Envelope" WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn' AND name = 'Fundusz Awaryjny') as calculated_main_balance
FROM "Transaction" 
WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn';

