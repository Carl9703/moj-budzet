-- Skrypt Naprawczy 2: Bezpieczna naprawa nazw tekstowych (Safe Fix)
-- Zamienia TYLKO stare nazwy (np. "Kosmetyki") na systemowe ID (np. "drugstore").
-- NIE RUSZA żadnych istniejących ID (ani systemowych, ani 'cmj...').

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
    WHEN TRIM("category") = 'Ike' THEN 'ike'
    WHEN TRIM("category") = 'Przeglądy i naprawy auta' THEN 'car-repairs'
    WHEN TRIM("category") = 'Wyjazdy' THEN 'weekend-trips'
    WHEN TRIM("category") = 'Inne' THEN 'other'
    
    ELSE "category" -- Zostaw bez zmian (to chroni Twoje ID cmj...)
END
WHERE "category" IN (
    'Czynsz', 'Opłaty', 'Wyposażenie', 'Sprzęt RTV', 'Zakupy dom', 
    'Paliwo do auta', 'Komunikacja publiczna', 'Lekarstwa', 'Fizjo', 
    'Kosmetyki', 'Telefon', 'Subskrypcje', 'Hobby', 'Gry', 
    'Edukacja / Szkolenia', 'Prezenty', 'Fryzjer', 'Jedzenie miasto', 
    'Ubrania', 'IKE', 'Ike', 'Przeglądy i naprawy auta', 'Wyjazdy', 'Inne'
);
