-- Skrypt Ratunkowy 1: Przywracanie Niestandardowych ID (Undo)
-- Przywraca ID typu 'cmj...' dla transakcji, które zostały błędnie zmienione na 'entertainment', 'shared-groceries' itp.
-- Bazuje na unikalnych opisach transakcji z Twojego audytu.

-- 1. Przywracanie 'Randka, jarmark...' -> cmj3746ra000hbeys0efit2lz
UPDATE "Transaction"
SET "category" = 'cmj3746ra000hbeys0efit2lz'
WHERE "description" IN ('Randka', 'jarmark', 'wiśniewski')
  AND "category" = 'entertainment'; -- tylko jeśli zostały zmienione

-- 2. Przywracanie 'Mroziński, biedronka...' -> cmj3746ra0004beys308zmh6u
UPDATE "Transaction"
SET "category" = 'cmj3746ra0004beys308zmh6u'
WHERE "description" IN ('Mroziński', 'biedronka', 'lidl', 'zabka')
  AND "category" = 'shared-groceries';

-- 3. Przywracanie 'pralnia' -> cmj3746ra000lbeys4nrl5lgx
UPDATE "Transaction"
SET "category" = 'cmj3746ra000lbeys4nrl5lgx'
WHERE "description" = 'pralnia'
  AND "category" = 'housing-bills';

-- 4. Przywracanie 'skm' -> cmj3746ra0006beys3kwkrxtr
UPDATE "Transaction"
SET "category" = 'cmj3746ra0006beys3kwkrxtr'
WHERE "description" = 'skm'
  AND "category" = 'public-transport';

-- 5. Przywracanie 'balony...' -> cmj3746rb000sbeysgq805fpo
UPDATE "Transaction"
SET "category" = 'cmj3746rb000sbeysgq805fpo'
WHERE "description" IN ('balony', 'empik', 'ksero', 'prezent urodzinowy Karolina')
  AND "category" = 'gifts';
