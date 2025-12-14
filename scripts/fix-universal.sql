-- FIX UNIWERSALNY
-- Próbuje dopasować systemowe ID do Twoich kategorii używając szerokiej listy synonimów.

-- POTRZEBY
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'housing-bills' AND c.name IN ('Czynsz', 'Opłaty', 'Wspólne opłaty', 'Rachunki', 'Mieszkanie');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'housing-equipment' AND c.name IN ('Wyposażenie', 'Sprzęt RTV', 'Meble', 'AGD', 'Dom');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'housing-repairs' AND c.name IN ('Naprawy', 'Remont', 'Naprawy domowe');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'shared-groceries' AND c.name IN ('Wspólne zakupy', 'Zakupy dom', 'Żywność', 'Jedzenie', 'Biedronka', 'Lidl');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'personal-groceries' AND c.name IN ('Moje zakupy', 'Zakupy', 'Spożywcze', 'Śniadania');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'fuel' AND c.name IN ('Paliwo', 'Paliwo do auta', 'Benzyna', 'Diesel', 'Transport');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'public-transport' AND c.name IN ('Komunikacja miejska', 'Bilety', 'SKM', 'PKP', 'Autobus', 'Tramwaj', 'Pociąg', 'Transport');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'parking' AND c.name IN ('Parking', 'Postój');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'healthcare' AND c.name IN ('Lekarz', 'Leki', 'Zdrowie', 'Apteka', 'Lekarstwa', 'Fizjo', 'Medyczne');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'drugstore' AND c.name IN ('Drogeria', 'Kosmetyki', 'Chemia', 'Higiena');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'phone' AND c.name IN ('Telefon', 'Abonament', 'Komórka');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'subscriptions' AND c.name IN ('Subskrypcje', 'Netflix', 'Spotify', 'Internet', 'Streaming');

-- STYL ŻYCIA
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'hobby' AND c.name IN ('Hobby', 'Gry', 'Zainteresowania', 'Pasje');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'entertainment' AND c.name IN ('Wyjścia', 'Rozrywka', 'Kino', 'Teatr', 'Imprezy', 'Koncerty', 'Bar');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'books' AND c.name IN ('Książki', 'Edukacja', 'Kursy', 'Szkolenia', 'Rozwój');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'sport' AND c.name IN ('Sport', 'Siłownia', 'Basen', 'Trening');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'beauty' AND c.name IN ('Fryzjer', 'Uroda', 'Barber', 'Kosmetyczka');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'restaurants' AND c.name IN ('Restauracje', 'Jedzenie na mieście', 'Jedzenie miasto', 'Pizza', 'Burger', 'Kebab', 'Gastronomia');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'work-lunch' AND c.name IN ('Lunch', 'Obiad w pracy', 'Stołówka');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'clothes' AND c.name IN ('Ubrania', 'Odzież', 'Ciuszki', 'Garderoba');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'shoes' AND c.name IN ('Obuwie', 'Buty');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'accessories' AND c.name IN ('Dodatki', 'Biżuteria', 'Akcesoria');

-- CELE FINANSOWE / INNE
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'ike' AND c.name IN ('IKE', 'Emerytura', 'Oszczędności');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'crypto' AND c.name IN ('Krypto', 'Kryptowaluty', 'Bitcoin', 'Inwestycje');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'car-insurance' AND c.name IN ('Ubezpieczenie', 'OC/AC', 'OC', 'AC', 'Auto');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'car-repairs' AND c.name IN ('Naprawy auta', 'Serwis', 'Mechanik', 'Przeglądy i naprawy auta', 'Warsztat');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'vacation' AND c.name IN ('Wakacje', 'Urlop', 'Podróże');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'weekend-trips' AND c.name IN ('Wyjazdy', 'Wycieczki', 'Weekend', 'Wyjazdy Weekendowe');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'wedding' AND c.name IN ('Wesele', 'Ślub');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'gifts' AND c.name IN ('Prezenty', 'Podarunki');
UPDATE "Transaction" t SET "category" = c.id FROM "Category" c WHERE t."userId" = c."userId" AND t."category" = 'emergency' AND c.name IN ('Fundusz Awaryjny', 'Poduszka');
