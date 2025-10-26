-- ========================================
-- NAPRAWA SALDA KONTA GŁÓWNEGO
-- ========================================

-- 1. Sprawdzenie aktualnego stanu
SELECT 
  'Przed naprawą' as status,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as total_balance_from_transactions,
  (SELECT "currentAmount" FROM "Envelope" WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn' AND name = 'Fundusz Awaryjny') as emergency_fund_amount
FROM "Transaction" 
WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn';

-- 2. Sprawdzenie czy są jakieś transakcje transferowe lub zamknięcia miesiąca
SELECT 
  description,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM "Transaction" 
WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn'
  AND (description LIKE '%Zamknięcie miesiąca%' OR description LIKE '%przeniesienie bilansu%')
GROUP BY description;

-- 3. Sprawdzenie stanu kopert
SELECT 
  name,
  "currentAmount",
  type
FROM "Envelope" 
WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn'
ORDER BY type, name;
