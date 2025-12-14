-- Skrypt naprawczy do kategorii transakcji (Wersja 2 - Bardziej agresywna)
-- Usunięto transakcję explicit (BEGIN/COMMIT) aby uniknąć problemów w niektórych klientach SQL
-- Dodano TRIM() przy sprawdzaniu warunków

UPDATE "Transaction"
SET "category" = CASE 
    -- Potrzeby
    WHEN TRIM("category") = 'Czynsz' THEN 'housing-bills'
    WHEN TRIM("category") = 'Opłaty' THEN 'housing-bills'
    WHEN TRIM("category") = 'Wyposażenie' THEN 'housing-equipment'
    WHEN TRIM("category") = 'Sprzęt RTV' THEN 'housing-equipment'
    WHEN TRIM("category") = 'Zakupy dom' THEN 'shared-groceries'
    WHEN TRIM("category") = 'Paliwo do auta' THEN 'fuel'
    WHEN TRIM("category") = 'Komunikacja publiczna' THEN 'public-transport'
    WHEN TRIM("category") = 'Lekarstwa' THEN 'healthcare'
    WHEN TRIM("category") = 'Fizjo' THEN 'healthcare'
    WHEN TRIM("category") = 'Kosmetyki' THEN 'drugstore'
    WHEN TRIM("category") = 'Telefon' THEN 'phone'
    WHEN TRIM("category") = 'Subskrypcje' THEN 'subscriptions'
    
    -- Styl życia
    WHEN TRIM("category") = 'Hobby' THEN 'hobby'
    WHEN TRIM("category") = 'Gry' THEN 'hobby'
    WHEN TRIM("category") = 'Edukacja / Szkolenia' THEN 'books'
    WHEN TRIM("category") = 'Prezenty' THEN 'gifts'
    WHEN TRIM("category") = 'Fryzjer' THEN 'beauty'
    WHEN TRIM("category") = 'Jedzenie miasto' THEN 'restaurants'
    WHEN TRIM("category") = 'Ubrania' THEN 'clothes'
    
    -- Cele finansowe / Inne
    WHEN TRIM("category") = 'IKE' THEN 'ike'
    WHEN TRIM("category") = 'Ike' THEN 'ike' -- Czasem wielkość liter
    WHEN TRIM("category") = 'Przeglądy i naprawy auta' THEN 'car-repairs'
    WHEN TRIM("category") = 'Wyjazdy' THEN 'weekend-trips'
    WHEN TRIM("category") = 'Inne' THEN 'other'

    -- 2. Mapowanie dziwnych ID
    WHEN TRIM("category") = 'cmj3746ra000hbeys0efit2lz' THEN 'entertainment'
    WHEN TRIM("category") = 'cmj3746ra0004beys308zmh6u' THEN 'shared-groceries'
    WHEN TRIM("category") = 'cmj3746ra000lbeys4nrl5lgx' THEN 'housing-bills'
    WHEN TRIM("category") = 'cmj3746ra0006beys3kwkrxtr' THEN 'public-transport'
    WHEN TRIM("category") = 'cmj3746rb000sbeysgq805fpo' THEN 'gifts'

    ELSE "category"
END
WHERE "category" IS NOT NULL 
  AND "category" NOT IN (
    'housing-bills', 'housing-equipment', 'housing-repairs',
    'shared-groceries', 'personal-groceries',
    'fuel', 'public-transport', 'parking',
    'healthcare', 'drugstore',
    'phone', 'subscriptions',
    'hobby', 'entertainment', 'books', 'sport', 'beauty',
    'restaurants', 'work-lunch',
    'clothes', 'shoes', 'accessories',
    'ike', 'crypto',
    'car-insurance', 'car-repairs',
    'vacation', 'weekend-trips',
    'wedding', 'gifts', 'emergency',
    'salary', 'bonus', 'other-income', 'investments', 'other'
  );
