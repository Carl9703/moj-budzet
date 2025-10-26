-- ========================================
-- DODANIE TRANSAKCJI ZAMKNIĘCIA MIESIĄCA
-- Dla każdego miesiąca styczeń-sierpień 2025
-- ========================================

-- Styczeń 2025 - Zamknięcie miesiąca
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_close_jan_2025', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 661.87, 'Zamknięcie miesiąca - Styczeń 2025', '2025-01-31', null, null, false, NOW(), NOW());

-- Luty 2025 - Zamknięcie miesiąca  
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_close_feb_2025', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 5060.61, 'Zamknięcie miesiąca - Luty 2025', '2025-02-28', null, null, false, NOW(), NOW());

-- Marzec 2025 - Zamknięcie miesiąca
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_close_mar_2025', 'cmgm8hqws00006gcj13vo7jqn', 'expense', -2467.22, 'Zamknięcie miesiąca - Marzec 2025', '2025-03-31', null, null, false, NOW(), NOW());

-- Kwiecień 2025 - Zamknięcie miesiąca
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_close_apr_2025', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 1809.02, 'Zamknięcie miesiąca - Kwiecień 2025', '2025-04-30', null, null, false, NOW(), NOW());

-- Maj 2025 - Zamknięcie miesiąca
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_close_may_2025', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 885.86, 'Zamknięcie miesiąca - Maj 2025', '2025-05-31', null, null, false, NOW(), NOW());

-- Czerwiec 2025 - Zamknięcie miesiąca
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_close_jun_2025', 'cmgm8hqws00006gcj13vo7jqn', 'expense', -1426.01, 'Zamknięcie miesiąca - Czerwiec 2025', '2025-06-30', null, null, false, NOW(), NOW());

-- Lipiec 2025 - Zamknięcie miesiąca
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_close_jul_2025', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 2724.01, 'Zamknięcie miesiąca - Lipiec 2025', '2025-07-31', null, null, false, NOW(), NOW());

-- Sierpień 2025 - Zamknięcie miesiąca
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_close_aug_2025', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 2784.13, 'Zamknięcie miesiąca - Sierpień 2025', '2025-08-31', null, null, false, NOW(), NOW());

-- ========================================
-- SPRAWDZENIE SALDA PO DODANIU ZAMKNIĘĆ
-- ========================================

-- Sprawdzenie całkowitego salda
SELECT 
  'Po dodaniu zamknięć' as status,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as total_balance_from_transactions,
  (SELECT "currentAmount" FROM "Envelope" WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn' AND name = 'Fundusz Awaryjny') as emergency_fund_amount,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) - (SELECT "currentAmount" FROM "Envelope" WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn' AND name = 'Fundusz Awaryjny') as calculated_main_balance
FROM "Transaction" 
WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn';

