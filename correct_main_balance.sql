-- ========================================
-- KOREKTA SALDA KONTA GŁÓWNEGO
-- Zachowuje wszystkie transakcje + ustawia prawidłowe saldo na dzisiaj
-- ========================================

-- 1. Sprawdzenie aktualnego stanu przed korektą
SELECT 
  'Przed korektą' as status,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as total_balance_from_transactions,
  (SELECT "currentAmount" FROM "Envelope" WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn' AND name = 'Fundusz Awaryjny') as emergency_fund_amount,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) - (SELECT "currentAmount" FROM "Envelope" WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn' AND name = 'Fundusz Awaryjny') as calculated_main_balance
FROM "Transaction" 
WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn';

-- 2. Obliczenie różnicy do skorygowania
-- Rzeczywiste saldo powinno być: 10 032,29 zł (z naszego podsumowania)
-- Obliczmy różnicę między aktualnym saldem a oczekiwanym

-- 3. Dodanie transakcji korygującej na dzisiaj
-- Jeśli saldo jest za wysokie - dodamy wydatek korygujący
-- Jeśli saldo jest za niskie - dodamy przychód korygujący
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_balance_correction', 'cmgm8hqws00006gcj13vo7jqn', 'income', 0.00, 'Korekta salda konta głównego - Import historycznych danych', NOW(), null, null, false, NOW(), NOW());

-- 4. Sprawdzenie stanu po korekcie
SELECT 
  'Po korekcie' as status,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as total_balance_from_transactions,
  (SELECT "currentAmount" FROM "Envelope" WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn' AND name = 'Fundusz Awaryjny') as emergency_fund_amount,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) - (SELECT "currentAmount" FROM "Envelope" WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn' AND name = 'Fundusz Awaryjny') as calculated_main_balance
FROM "Transaction" 
WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn';

