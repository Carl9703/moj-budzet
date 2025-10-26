-- ========================================
-- USUWANIE BŁĘDNYCH TRANSAKCJI 2025
-- Usuwa transakcje z błędnymi danymi (marzec-lipiec)
-- ========================================

-- Sprawdzenie ile transakcji mamy przed usunięciem
SELECT COUNT(*) as total_before_delete 
FROM "Transaction" 
WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn' 
AND date >= '2025-01-01' 
AND date <= '2025-07-31';

-- Usunięcie błędnych transakcji z marca-lipca 2025
-- (zachowujemy tylko styczeń i luty, które były poprawne)
DELETE FROM "Transaction" 
WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn' 
AND date >= '2025-03-01' 
AND date <= '2025-07-31';

-- Sprawdzenie ile transakcji zostało po usunięciu
SELECT COUNT(*) as total_after_delete 
FROM "Transaction" 
WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn' 
AND date >= '2025-01-01' 
AND date <= '2025-07-31';

-- Sprawdzenie jakie transakcje zostały (styczeń-luty)
SELECT 
  DATE_TRUNC('month', date) as month,
  type,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM "Transaction" 
WHERE "userId" = 'cmgm8hqws00006gcj13vo7jqn' 
AND date >= '2025-01-01' 
AND date <= '2025-07-31'
GROUP BY DATE_TRUNC('month', date), type
ORDER BY month, type;

