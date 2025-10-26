-- ========================================
-- DIAGNOSTYKA SALDA KONTA GŁÓWNEGO
-- ========================================

-- 1. Sprawdzenie całkowitego salda z transakcji
SELECT 
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as total_balance_from_transactions
FROM "Transaction" 
WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn';

-- 2. Sprawdzenie salda według miesięcy
SELECT 
  DATE_TRUNC('month', date) as month,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as monthly_balance
FROM "Transaction" 
WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn'
GROUP BY DATE_TRUNC('month', date)
ORDER BY month;

-- 3. Sprawdzenie aktualnego salda konta głównego w UserConfig
SELECT 
  u.email,
  uc.mainAccountBalance
FROM "User" u
LEFT JOIN "UserConfig" uc ON u.id = uc."userId"
WHERE u.id = 'cmgm8hqws00006gcj13vo7jqn';

-- 4. Sprawdzenie czy są jakieś transakcje transferowe
SELECT 
  type,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM "Transaction" 
WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn'
GROUP BY type;
