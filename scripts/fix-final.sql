-- FIX FINALNY (Aktualizacja)
-- Podmienia błędne systemowe ID na Twoje poprawne ID z tabeli.
-- Dodałem: Lunch w pracy (work-lunch)

-- 1. URODA / FRYZJER
UPDATE "Transaction" SET "category" = 'cmj3746ra000gbeysjkilhrw9' WHERE "category" = 'beauty';

-- 2. WSPÓLNE ZAKUPY / ŻYWNOŚĆ
UPDATE "Transaction" SET "category" = 'cmj3746ra0003beysm9wv15bc' WHERE "category" = 'shared-groceries';

-- 3. DROGERIA / KOSMETYKI
UPDATE "Transaction" SET "category" = 'cmj3746ra0009beysiy8cbrmt' WHERE "category" = 'drugstore';

-- 4. LEKARZ / ZDROWIE
UPDATE "Transaction" SET "category" = 'cmj3746ra0008beys59brh3nw' WHERE "category" = 'healthcare';

-- 5. IKE
UPDATE "Transaction" SET "category" = 'cmj3746ra000mbeysbly6k00u' WHERE "category" = 'ike';

-- 6. RESTAURACJE
UPDATE "Transaction" SET "category" = 'cmj3746ra000hbeys0efit2lz' WHERE "category" = 'restaurants';

-- 7. PALIWO
UPDATE "Transaction" SET "category" = 'cmj3746ra0005beyslw4pokdn' WHERE "category" = 'fuel';

-- 8. KOMUNIKACJA
UPDATE "Transaction" SET "category" = 'cmj3746ra0006beys3kwkrxtr' WHERE "category" = 'public-transport';

-- 9. PARKINGI
UPDATE "Transaction" SET "category" = 'cmj3746ra0007beysxyswihuj' WHERE "category" = 'parking';

-- 10. WYJŚCIA / ROZRYWKA
UPDATE "Transaction" SET "category" = 'cmj3746ra000dbeyssvurjww8' WHERE "category" = 'entertainment';

-- 11. UBRANIA / ODZIEŻ
UPDATE "Transaction" SET "category" = 'cmj3746ra000jbeyscr7heio6' WHERE "category" = 'clothes';

-- 12. OBUWIE
UPDATE "Transaction" SET "category" = 'cmj3746ra000kbeysnt73kgri' WHERE "category" = 'shoes';

-- 13. INNE (Inne wydatki)
UPDATE "Transaction" SET "category" = 'cmj3746rb000ybeys3364sh70' WHERE "category" = 'other';

-- 14. NAPRAWY AUTA
UPDATE "Transaction" SET "category" = 'cmj37qpkt0007crisb907ek81' WHERE "category" = 'car-repairs';

-- 15. HOBBY / SPORT
UPDATE "Transaction" SET "category" = 'cmj3746ra000cbeysh4na0ypq' WHERE "category" = 'hobby';
UPDATE "Transaction" SET "category" = 'cmj3746ra000fbeysob0g3ad1' WHERE "category" = 'sport';

-- 16. SUBKSRYPCJE I TELEFON
UPDATE "Transaction" SET "category" = 'cmj3746ra000bbeysv4dyra7p' WHERE "category" = 'subscriptions';
UPDATE "Transaction" SET "category" = 'cmj3746ra000abeysptsvrewu' WHERE "category" = 'phone';

-- 17. LUNCH W PRACY (Nowe!)
-- work-lunch -> Lunch w pracy (cmj3746ra000ibeyschj6qsoh)
UPDATE "Transaction" SET "category" = 'cmj3746ra000ibeyschj6qsoh' WHERE "category" = 'work-lunch';

-- 18. BRAKUJĄCE (NULL / PUSTE)
-- Wypłata
UPDATE "Transaction" SET "category" = 'cmj3746rb000ubeysvkdy9cmf' WHERE ("category" IS NULL OR "category" = '') AND "description" LIKE 'Wypłata%';
-- Premia
UPDATE "Transaction" SET "category" = 'cmj3746rb000vbeysrqwl8q17' WHERE ("category" IS NULL OR "category" = '') AND "description" LIKE 'Premia%';
-- Inne przychody
UPDATE "Transaction" SET "category" = 'cmj3746rb000wbeyso2r5e4n0' WHERE ("category" IS NULL OR "category" = '') AND "description" LIKE 'Inne przychody%';
