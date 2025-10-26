-- ========================================
-- IMPORT HISTORYCZNYCH TRANSAKCJI 2025
-- STYCZEŃ - LIPIEC 2025 (POPRAWNE DANE Z RAPORTU)
-- User ID: cmgm8hqws00006gcj13vo7jqn
-- ========================================

-- PRZYCHODY - STYCZEŃ 2025
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_income_jan_1', 'cmgm8hqws00006gcj13vo7jqn', 'income', 4630.72, 'Wypłata - Styczeń 2025', '2025-01-01', null, null, true, NOW(), NOW()),
  ('cuid_income_jan_2', 'cmgm8hqws00006gcj13vo7jqn', 'income', 582.25, 'Premia - Styczeń 2025', '2025-01-01', null, null, true, NOW(), NOW());

-- PRZYCHODY - LUTY 2025
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_income_feb_1', 'cmgm8hqws00006gcj13vo7jqn', 'income', 4630.72, 'Wypłata - Luty 2025', '2025-02-01', null, null, true, NOW(), NOW()),
  ('cuid_income_feb_2', 'cmgm8hqws00006gcj13vo7jqn', 'income', 3586.00, 'Premia - Luty 2025', '2025-02-01', null, null, true, NOW(), NOW()),
  ('cuid_income_feb_3', 'cmgm8hqws00006gcj13vo7jqn', 'income', 300.00, 'Inne przychody - Luty 2025', '2025-02-01', null, null, true, NOW(), NOW());

-- PRZYCHODY - MARZEC 2025
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_income_mar_1', 'cmgm8hqws00006gcj13vo7jqn', 'income', 5060.13, 'Wypłata - Marzec 2025', '2025-03-01', null, null, true, NOW(), NOW()),
  ('cuid_income_mar_2', 'cmgm8hqws00006gcj13vo7jqn', 'income', 989.85, 'Premia - Marzec 2025', '2025-03-01', null, null, true, NOW(), NOW());

-- PRZYCHODY - KWIECIEŃ 2025
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_income_apr_1', 'cmgm8hqws00006gcj13vo7jqn', 'income', 5060.13, 'Wypłata - Kwiecień 2025', '2025-04-01', null, null, true, NOW(), NOW()),
  ('cuid_income_apr_2', 'cmgm8hqws00006gcj13vo7jqn', 'income', 205.00, 'Inne przychody - Kwiecień 2025', '2025-04-01', null, null, true, NOW(), NOW());

-- PRZYCHODY - MAJ 2025
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_income_may_1', 'cmgm8hqws00006gcj13vo7jqn', 'income', 5030.11, 'Wypłata - Maj 2025', '2025-05-01', null, null, true, NOW(), NOW()),
  ('cuid_income_may_2', 'cmgm8hqws00006gcj13vo7jqn', 'income', 1141.86, 'Premia - Maj 2025', '2025-05-01', null, null, true, NOW(), NOW()),
  ('cuid_income_may_3', 'cmgm8hqws00006gcj13vo7jqn', 'income', 170.00, 'Inne przychody - Maj 2025', '2025-05-01', null, null, true, NOW(), NOW());

-- PRZYCHODY - CZERWIEC 2025
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_income_jun_1', 'cmgm8hqws00006gcj13vo7jqn', 'income', 5030.12, 'Wypłata - Czerwiec 2025', '2025-06-01', null, null, true, NOW(), NOW());

-- PRZYCHODY - LIPIEC 2025
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_income_jul_1', 'cmgm8hqws00006gcj13vo7jqn', 'income', 5030.12, 'Wypłata - Lipiec 2025', '2025-07-01', null, null, true, NOW(), NOW()),
  ('cuid_income_jul_2', 'cmgm8hqws00006gcj13vo7jqn', 'income', 150.00, 'Inne przychody - Lipiec 2025', '2025-07-01', null, null, true, NOW(), NOW());

-- PRZYCHODY - SIERPIEŃ 2025
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_income_aug_1', 'cmgm8hqws00006gcj13vo7jqn', 'income', 5030.12, 'Wypłata - Sierpień 2025', '2025-08-01', null, null, true, NOW(), NOW()),
  ('cuid_income_aug_2', 'cmgm8hqws00006gcj13vo7jqn', 'income', 924.33, 'Premia - Sierpień 2025', '2025-08-01', null, null, true, NOW(), NOW());

-- ========================================
-- WYDATKI - STYCZEŃ 2025
-- ========================================

-- Jedzenie
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jan_food_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 845.80, 'Zakupy dom', '2025-01-01', 'cmgm9hyws0004vvql23c8ipcs', 'Zakupy dom', true, NOW(), NOW()),
  ('cuid_exp_jan_food_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 319.60, 'Jedzenie miasto', '2025-01-01', 'cmgm9hyws0004vvql23c8ipcs', 'Jedzenie miasto', true, NOW(), NOW());

-- Mieszkanie/dom
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jan_housing_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 750.00, 'Czynsz', '2025-01-01', 'cmgm9hywj0002vvqldpphsk9z', 'Czynsz', true, NOW(), NOW());

-- Transport
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jan_transport_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 345.95, 'Paliwo do auta', '2025-01-01', 'cmgm9hywx0006vvql0i8brzzu', 'Paliwo do auta', true, NOW(), NOW()),
  ('cuid_exp_jan_transport_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 149.98, 'Przeglądy i naprawy auta', '2025-01-01', 'cmgm9hywx0006vvql0i8brzzu', 'Przeglądy i naprawy auta', true, NOW(), NOW());

-- Telekomunikacja
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jan_telecom_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 25.00, 'Telefon', '2025-01-01', 'cmgm9hyx7000avvql9h9rb7hn', 'Telefon', true, NOW(), NOW()),
  ('cuid_exp_jan_telecom_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 99.99, 'Subskrypcje', '2025-01-01', 'cmgm9hyx7000avvql9h9rb7hn', 'Subskrypcje', true, NOW(), NOW());

-- Opieka zdrowotna
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jan_health_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 200.00, 'Fizjo', '2025-01-01', 'cmgm9hyx20008vvqlelrnnfth', 'Fizjo', true, NOW(), NOW());

-- Ubranie
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jan_clothes_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 59.98, 'Ubrania', '2025-01-01', 'cmgm9hyxr000gvvqlco7zrouj', 'Ubrania', true, NOW(), NOW());

-- Higiena
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jan_hygiene_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 49.97, 'Kosmetyki', '2025-01-01', 'cmgm9hyx20008vvqlelrnnfth', 'Kosmetyki', true, NOW(), NOW()),
  ('cuid_exp_jan_hygiene_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 40.00, 'Fryzjer', '2025-01-01', 'cmgm9hyx20008vvqlelrnnfth', 'Fryzjer', true, NOW(), NOW());

-- Rozrywka
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jan_entertainment_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 1065.32, 'Wyjazdy', '2025-01-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Wyjazdy', true, NOW(), NOW());

-- Inne wydatki
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jan_other_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 143.99, 'Prezenty', '2025-01-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Prezenty', true, NOW(), NOW()),
  ('cuid_exp_jan_other_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 881.50, 'Edukacja / Szkolenia', '2025-01-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Edukacja / Szkolenia', true, NOW(), NOW());

-- Budowanie Przyszłości
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jan_future_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 600.00, 'IKE', '2025-01-01', 'cmgm9hyy2000kvvql5s1ld34l', 'IKE', true, NOW(), NOW());

-- ========================================
-- WYDATKI - LUTY 2025
-- ========================================

-- Jedzenie
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_feb_food_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 715.93, 'Zakupy dom', '2025-02-01', 'cmgm9hyws0004vvql23c8ipcs', 'Zakupy dom', true, NOW(), NOW()),
  ('cuid_exp_feb_food_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 31.00, 'Jedzenie miasto', '2025-02-01', 'cmgm9hyws0004vvql23c8ipcs', 'Jedzenie miasto', true, NOW(), NOW());

-- Mieszkanie/dom
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_feb_housing_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 750.00, 'Czynsz', '2025-02-01', 'cmgm9hywj0002vvqldpphsk9z', 'Czynsz', true, NOW(), NOW());

-- Transport
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_feb_transport_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 100.00, 'Paliwo do auta', '2025-02-01', 'cmgm9hywx0006vvql0i8brzzu', 'Paliwo do auta', true, NOW(), NOW()),
  ('cuid_exp_feb_transport_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 18.04, 'Opłaty', '2025-02-01', 'cmgm9hywx0006vvql0i8brzzu', 'Opłaty', true, NOW(), NOW());

-- Telekomunikacja
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_feb_telecom_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 25.00, 'Telefon', '2025-02-01', 'cmgm9hyx7000avvql9h9rb7hn', 'Telefon', true, NOW(), NOW()),
  ('cuid_exp_feb_telecom_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 99.00, 'Subskrypcje', '2025-02-01', 'cmgm9hyx7000avvql9h9rb7hn', 'Subskrypcje', true, NOW(), NOW());

-- Higiena
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_feb_hygiene_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 65.96, 'Kosmetyki', '2025-02-01', 'cmgm9hyx20008vvqlelrnnfth', 'Kosmetyki', true, NOW(), NOW()),
  ('cuid_exp_feb_hygiene_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 16.15, 'Inne', '2025-02-01', 'cmgm9hyx20008vvqlelrnnfth', 'Inne', true, NOW(), NOW());

-- Rozrywka
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_feb_entertainment_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 571.82, 'Wyjazdy', '2025-02-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Wyjazdy', true, NOW(), NOW());

-- Inne wydatki
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_feb_other_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 39.51, 'Prezenty', '2025-02-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Prezenty', true, NOW(), NOW()),
  ('cuid_exp_feb_other_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 498.99, 'Sprzęt RTV', '2025-02-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Sprzęt RTV', true, NOW(), NOW()),
  ('cuid_exp_feb_other_3', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 881.50, 'Edukacja / Szkolenia', '2025-02-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Edukacja / Szkolenia', true, NOW(), NOW());

-- Budowanie Przyszłości
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_feb_future_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 419.73, 'EURO', '2025-02-01', 'cmgm9hyy2000kvvql5s1ld34l', 'EURO', true, NOW(), NOW());

-- ========================================
-- WYDATKI - MARZEC 2025
-- ========================================

-- Jedzenie
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_mar_food_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 752.50, 'Zakupy dom', '2025-03-01', 'cmgm9hyws0004vvql23c8ipcs', 'Zakupy dom', true, NOW(), NOW()),
  ('cuid_exp_mar_food_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 342.21, 'Jedzenie miasto', '2025-03-01', 'cmgm9hyws0004vvql23c8ipcs', 'Jedzenie miasto', true, NOW(), NOW());

-- Mieszkanie/dom
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_mar_housing_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 750.00, 'Czynsz', '2025-03-01', 'cmgm9hywj0002vvqldpphsk9z', 'Czynsz', true, NOW(), NOW()),
  ('cuid_exp_mar_housing_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 45.39, 'Wyposażenie', '2025-03-01', 'cmgm9hywj0002vvqldpphsk9z', 'Wyposażenie', true, NOW(), NOW());

-- Transport
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_mar_transport_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 271.31, 'Paliwo do auta', '2025-03-01', 'cmgm9hywx0006vvql0i8brzzu', 'Paliwo do auta', true, NOW(), NOW()),
  ('cuid_exp_mar_transport_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 1100.00, 'Przeglądy i naprawy auta', '2025-03-01', 'cmgm9hywx0006vvql0i8brzzu', 'Przeglądy i naprawy auta', true, NOW(), NOW()),
  ('cuid_exp_mar_transport_3', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 16.20, 'Komunikacja publiczna', '2025-03-01', 'cmgm9hywx0006vvql0i8brzzu', 'Komunikacja publiczna', true, NOW(), NOW());

-- Telekomunikacja
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_mar_telecom_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 25.00, 'Telefon', '2025-03-01', 'cmgm9hyx7000avvql9h9rb7hn', 'Telefon', true, NOW(), NOW()),
  ('cuid_exp_mar_telecom_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 99.00, 'Subskrypcje', '2025-03-01', 'cmgm9hyx7000avvql9h9rb7hn', 'Subskrypcje', true, NOW(), NOW());

-- Opieka zdrowotna
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_mar_health_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 550.00, 'Fizjo', '2025-03-01', 'cmgm9hyx20008vvqlelrnnfth', 'Fizjo', true, NOW(), NOW());

-- Higiena
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_mar_hygiene_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 40.00, 'Fryzjer', '2025-03-01', 'cmgm9hyx20008vvqlelrnnfth', 'Fryzjer', true, NOW(), NOW());

-- Rozrywka
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_mar_entertainment_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 118.50, 'Wyjazdy', '2025-03-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Wyjazdy', true, NOW(), NOW()),
  ('cuid_exp_mar_entertainment_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 261.54, 'Gry', '2025-03-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Gry', true, NOW(), NOW()),
  ('cuid_exp_mar_entertainment_3', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 49.00, 'Inne', '2025-03-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Inne', true, NOW(), NOW());

-- Inne wydatki
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_mar_other_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 3921.00, 'Prezenty', '2025-03-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Prezenty', true, NOW(), NOW()),
  ('cuid_exp_mar_other_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 799.75, 'Sprzęt RTV', '2025-03-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Sprzęt RTV', true, NOW(), NOW()),
  ('cuid_exp_mar_other_3', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 18.99, 'Inne', '2025-03-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Inne', true, NOW(), NOW());

-- Budowanie Przyszłości
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_mar_future_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 422.81, 'EURO', '2025-03-01', 'cmgm9hyy2000kvvql5s1ld34l', 'EURO', true, NOW(), NOW());

-- ========================================
-- WYDATKI - KWIECIEŃ 2025
-- ========================================

-- Jedzenie
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_apr_food_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 790.81, 'Zakupy dom', '2025-04-01', 'cmgm9hyws0004vvql23c8ipcs', 'Zakupy dom', true, NOW(), NOW()),
  ('cuid_exp_apr_food_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 87.60, 'Jedzenie miasto', '2025-04-01', 'cmgm9hyws0004vvql23c8ipcs', 'Jedzenie miasto', true, NOW(), NOW());

-- Mieszkanie/dom
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_apr_housing_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 950.00, 'Czynsz', '2025-04-01', 'cmgm9hywj0002vvqldpphsk9z', 'Czynsz', true, NOW(), NOW());

-- Transport
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_apr_transport_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 289.61, 'Paliwo do auta', '2025-04-01', 'cmgm9hywx0006vvql0i8brzzu', 'Paliwo do auta', true, NOW(), NOW()),
  ('cuid_exp_apr_transport_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 100.00, 'Przeglądy i naprawy auta', '2025-04-01', 'cmgm9hywx0006vvql0i8brzzu', 'Przeglądy i naprawy auta', true, NOW(), NOW());

-- Telekomunikacja
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_apr_telecom_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 25.00, 'Telefon', '2025-04-01', 'cmgm9hyx7000avvql9h9rb7hn', 'Telefon', true, NOW(), NOW());

-- Opieka zdrowotna
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_apr_health_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 139.45, 'Lekarstwa', '2025-04-01', 'cmgm9hyx20008vvqlelrnnfth', 'Lekarstwa', true, NOW(), NOW());

-- Ubranie
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_apr_clothes_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 49.99, 'Ubrania', '2025-04-01', 'cmgm9hyxr000gvvqlco7zrouj', 'Ubrania', true, NOW(), NOW());

-- Higiena
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_apr_hygiene_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 23.47, 'Kosmetyki', '2025-04-01', 'cmgm9hyx20008vvqlelrnnfth', 'Kosmetyki', true, NOW(), NOW()),
  ('cuid_exp_apr_hygiene_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 40.00, 'Fryzjer', '2025-04-01', 'cmgm9hyx20008vvqlelrnnfth', 'Fryzjer', true, NOW(), NOW());

-- Rozrywka
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_apr_entertainment_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 240.00, 'Wyjazdy', '2025-04-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Wyjazdy', true, NOW(), NOW()),
  ('cuid_exp_apr_entertainment_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 59.99, 'Hobby', '2025-04-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Hobby', true, NOW(), NOW()),
  ('cuid_exp_apr_entertainment_3', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 21.50, 'Gry', '2025-04-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Gry', true, NOW(), NOW());

-- Inne wydatki
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_apr_other_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 157.98, 'Prezenty', '2025-04-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Prezenty', true, NOW(), NOW()),
  ('cuid_exp_apr_other_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 799.75, 'Sprzęt RTV', '2025-04-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Sprzęt RTV', true, NOW(), NOW());

-- ========================================
-- WYDATKI - MAJ 2025
-- ========================================

-- Jedzenie
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_may_food_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 1033.59, 'Zakupy dom', '2025-05-01', 'cmgm9hyws0004vvql23c8ipcs', 'Zakupy dom', true, NOW(), NOW()),
  ('cuid_exp_may_food_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 196.59, 'Jedzenie miasto', '2025-05-01', 'cmgm9hyws0004vvql23c8ipcs', 'Jedzenie miasto', true, NOW(), NOW()),
  ('cuid_exp_may_food_3', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 50.00, 'Inne', '2025-05-01', 'cmgm9hyws0004vvql23c8ipcs', 'Inne', true, NOW(), NOW());

-- Mieszkanie/dom
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_may_housing_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 750.00, 'Czynsz', '2025-05-01', 'cmgm9hywj0002vvqldpphsk9z', 'Czynsz', true, NOW(), NOW()),
  ('cuid_exp_may_housing_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 1110.14, 'Wyposażenie', '2025-05-01', 'cmgm9hywj0002vvqldpphsk9z', 'Wyposażenie', true, NOW(), NOW()),
  ('cuid_exp_may_housing_3', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 34.64, 'Inne', '2025-05-01', 'cmgm9hywj0002vvqldpphsk9z', 'Inne', true, NOW(), NOW());

-- Transport
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_may_transport_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 443.91, 'Paliwo do auta', '2025-05-01', 'cmgm9hywx0006vvql0i8brzzu', 'Paliwo do auta', true, NOW(), NOW()),
  ('cuid_exp_may_transport_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 455.00, 'Przeglądy i naprawy auta', '2025-05-01', 'cmgm9hywx0006vvql0i8brzzu', 'Przeglądy i naprawy auta', true, NOW(), NOW()),
  ('cuid_exp_may_transport_3', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 46.50, 'Komunikacja publiczna', '2025-05-01', 'cmgm9hywx0006vvql0i8brzzu', 'Komunikacja publiczna', true, NOW(), NOW());

-- Telekomunikacja
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_may_telecom_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 25.00, 'Telefon', '2025-05-01', 'cmgm9hyx7000avvql9h9rb7hn', 'Telefon', true, NOW(), NOW()),
  ('cuid_exp_may_telecom_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 99.00, 'Subskrypcje', '2025-05-01', 'cmgm9hyx7000avvql9h9rb7hn', 'Subskrypcje', true, NOW(), NOW()),
  ('cuid_exp_may_telecom_3', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 35.00, 'Inne', '2025-05-01', 'cmgm9hyx7000avvql9h9rb7hn', 'Inne', true, NOW(), NOW());

-- Opieka zdrowotna
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_may_health_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 42.99, 'Lekarstwa', '2025-05-01', 'cmgm9hyx20008vvqlelrnnfth', 'Lekarstwa', true, NOW(), NOW());

-- Ubranie
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_may_clothes_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 201.49, 'Ubrania', '2025-05-01', 'cmgm9hyxr000gvvqlco7zrouj', 'Ubrania', true, NOW(), NOW()),
  ('cuid_exp_may_clothes_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 93.00, 'Inne', '2025-05-01', 'cmgm9hyxr000gvvqlco7zrouj', 'Inne', true, NOW(), NOW());

-- Higiena
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_may_hygiene_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 46.47, 'Kosmetyki', '2025-05-01', 'cmgm9hyx20008vvqlelrnnfth', 'Kosmetyki', true, NOW(), NOW()),
  ('cuid_exp_may_hygiene_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 40.00, 'Fryzjer', '2025-05-01', 'cmgm9hyx20008vvqlelrnnfth', 'Fryzjer', true, NOW(), NOW());

-- Rozrywka
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_may_entertainment_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 188.00, 'Wyjazdy', '2025-05-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Wyjazdy', true, NOW(), NOW()),
  ('cuid_exp_may_entertainment_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 30.00, 'Inne', '2025-05-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Inne', true, NOW(), NOW());

-- Inne wydatki
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_may_other_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 183.34, 'Prezenty', '2025-05-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Prezenty', true, NOW(), NOW());

-- Budowanie Przyszłości
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_may_future_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 450.00, 'EURO', '2025-05-01', 'cmgm9hyy2000kvvql5s1ld34l', 'EURO', true, NOW(), NOW());

-- ========================================
-- WYDATKI - CZERWIEC 2025
-- ========================================

-- Jedzenie
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jun_food_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 839.77, 'Zakupy dom', '2025-06-01', 'cmgm9hyws0004vvql23c8ipcs', 'Zakupy dom', true, NOW(), NOW()),
  ('cuid_exp_jun_food_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 308.24, 'Jedzenie miasto', '2025-06-01', 'cmgm9hyws0004vvql23c8ipcs', 'Jedzenie miasto', true, NOW(), NOW());

-- Mieszkanie/dom
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jun_housing_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 750.00, 'Czynsz', '2025-06-01', 'cmgm9hywj0002vvqldpphsk9z', 'Czynsz', true, NOW(), NOW()),
  ('cuid_exp_jun_housing_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 548.14, 'Wyposażenie', '2025-06-01', 'cmgm9hywj0002vvqldpphsk9z', 'Wyposażenie', true, NOW(), NOW()),
  ('cuid_exp_jun_housing_3', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 200.35, 'Inne', '2025-06-01', 'cmgm9hywj0002vvqldpphsk9z', 'Inne', true, NOW(), NOW());

-- Transport
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jun_transport_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 439.48, 'Paliwo do auta', '2025-06-01', 'cmgm9hywx0006vvql0i8brzzu', 'Paliwo do auta', true, NOW(), NOW()),
  ('cuid_exp_jun_transport_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 100.12, 'Przeglądy i naprawy auta', '2025-06-01', 'cmgm9hywx0006vvql0i8brzzu', 'Przeglądy i naprawy auta', true, NOW(), NOW());

-- Telekomunikacja
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jun_telecom_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 25.00, 'Telefon', '2025-06-01', 'cmgm9hyx7000avvql9h9rb7hn', 'Telefon', true, NOW(), NOW()),
  ('cuid_exp_jun_telecom_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 99.99, 'Subskrypcje', '2025-06-01', 'cmgm9hyx7000avvql9h9rb7hn', 'Subskrypcje', true, NOW(), NOW());

-- Opieka zdrowotna
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jun_health_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 32.99, 'Lekarstwa', '2025-06-01', 'cmgm9hyx20008vvqlelrnnfth', 'Lekarstwa', true, NOW(), NOW());

-- Ubranie
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jun_clothes_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 49.95, 'Ubrania', '2025-06-01', 'cmgm9hyxr000gvvqlco7zrouj', 'Ubrania', true, NOW(), NOW());

-- Higiena
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jun_hygiene_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 56.79, 'Kosmetyki', '2025-06-01', 'cmgm9hyx20008vvqlelrnnfth', 'Kosmetyki', true, NOW(), NOW()),
  ('cuid_exp_jun_hygiene_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 110.00, 'Fryzjer', '2025-06-01', 'cmgm9hyx20008vvqlelrnnfth', 'Fryzjer', true, NOW(), NOW());

-- Rozrywka
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jun_entertainment_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 870.00, 'Wyjazdy', '2025-06-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Wyjazdy', true, NOW(), NOW()),
  ('cuid_exp_jun_entertainment_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 134.00, 'Inne', '2025-06-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Inne', true, NOW(), NOW());

-- Inne wydatki
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jun_other_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 500.00, 'Prezenty', '2025-06-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Prezenty', true, NOW(), NOW());

-- Budowanie Przyszłości
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jun_future_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 2075.30, 'EURO', '2025-06-01', 'cmgm9hyy2000kvvql5s1ld34l', 'EURO', true, NOW(), NOW());

-- ========================================
-- WYDATKI - LIPIEC 2025
-- ========================================

-- Jedzenie
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jul_food_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 1072.49, 'Zakupy dom', '2025-07-01', 'cmgm9hyws0004vvql23c8ipcs', 'Zakupy dom', true, NOW(), NOW()),
  ('cuid_exp_jul_food_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 68.95, 'Jedzenie miasto', '2025-07-01', 'cmgm9hyws0004vvql23c8ipcs', 'Jedzenie miasto', true, NOW(), NOW());

-- Mieszkanie/dom
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jul_housing_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 750.00, 'Czynsz', '2025-07-01', 'cmgm9hywj0002vvqldpphsk9z', 'Czynsz', true, NOW(), NOW()),
  ('cuid_exp_jul_housing_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 41.86, 'Wyposażenie', '2025-07-01', 'cmgm9hywj0002vvqldpphsk9z', 'Wyposażenie', true, NOW(), NOW()),
  ('cuid_exp_jul_housing_3', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 41.93, 'Inne', '2025-07-01', 'cmgm9hywj0002vvqldpphsk9z', 'Inne', true, NOW(), NOW());

-- Transport
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jul_transport_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 277.03, 'Paliwo do auta', '2025-07-01', 'cmgm9hywx0006vvql0i8brzzu', 'Paliwo do auta', true, NOW(), NOW()),
  ('cuid_exp_jul_transport_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 145.00, 'Przeglądy i naprawy auta', '2025-07-01', 'cmgm9hywx0006vvql0i8brzzu', 'Przeglądy i naprawy auta', true, NOW(), NOW());

-- Telekomunikacja
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jul_telecom_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 25.00, 'Telefon', '2025-07-01', 'cmgm9hyx7000avvql9h9rb7hn', 'Telefon', true, NOW(), NOW()),
  ('cuid_exp_jul_telecom_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 99.99, 'Subskrypcje', '2025-07-01', 'cmgm9hyx7000avvql9h9rb7hn', 'Subskrypcje', true, NOW(), NOW());

-- Opieka zdrowotna
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jul_health_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 102.80, 'Lekarstwa', '2025-07-01', 'cmgm9hyx20008vvqlelrnnfth', 'Lekarstwa', true, NOW(), NOW());

-- Higiena
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jul_hygiene_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 70.00, 'Fryzjer', '2025-07-01', 'cmgm9hyx20008vvqlelrnnfth', 'Fryzjer', true, NOW(), NOW()),
  ('cuid_exp_jul_hygiene_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 25.98, 'Inne', '2025-07-01', 'cmgm9hyx20008vvqlelrnnfth', 'Inne', true, NOW(), NOW());

-- Rozrywka
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jul_entertainment_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 400.00, 'Wyjazdy', '2025-07-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Wyjazdy', true, NOW(), NOW());

-- Inne wydatki
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_jul_other_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 40.74, 'Prezenty', '2025-07-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Prezenty', true, NOW(), NOW()),
  ('cuid_exp_jul_other_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 373.25, 'Sprzęt RTV', '2025-07-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Sprzęt RTV', true, NOW(), NOW());

-- ========================================
-- WYDATKI - SIERPIEŃ 2025
-- ========================================

-- Jedzenie
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_aug_food_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 901.28, 'Zakupy dom', '2025-08-01', 'cmgm9hyws0004vvql23c8ipcs', 'Zakupy dom', true, NOW(), NOW()),
  ('cuid_exp_aug_food_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 211.50, 'Jedzenie miasto', '2025-08-01', 'cmgm9hyws0004vvql23c8ipcs', 'Jedzenie miasto', true, NOW(), NOW()),
  ('cuid_exp_aug_food_3', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 16.00, 'Inne', '2025-08-01', 'cmgm9hyws0004vvql23c8ipcs', 'Inne', true, NOW(), NOW());

-- Mieszkanie/dom
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_aug_housing_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 750.00, 'Czynsz', '2025-08-01', 'cmgm9hywj0002vvqldpphsk9z', 'Czynsz', true, NOW(), NOW());

-- Transport
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_aug_transport_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 283.91, 'Paliwo do auta', '2025-08-01', 'cmgm9hywx0006vvql0i8brzzu', 'Paliwo do auta', true, NOW(), NOW());

-- Telekomunikacja
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_aug_telecom_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 50.00, 'Telefon', '2025-08-01', 'cmgm9hyx7000avvql9h9rb7hn', 'Telefon', true, NOW(), NOW());

-- Opieka zdrowotna
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_aug_health_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 81.77, 'Lekarstwa', '2025-08-01', 'cmgm9hyx20008vvqlelrnnfth', 'Lekarstwa', true, NOW(), NOW());

-- Higiena
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_aug_hygiene_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 40.98, 'Kosmetyki', '2025-08-01', 'cmgm9hyx20008vvqlelrnnfth', 'Kosmetyki', true, NOW(), NOW());

-- Rozrywka
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_aug_entertainment_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 390.50, 'Wyjazdy', '2025-08-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Wyjazdy', true, NOW(), NOW()),
  ('cuid_exp_aug_entertainment_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 170.08, 'Inne', '2025-08-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Inne', true, NOW(), NOW());

-- Inne wydatki
INSERT INTO "Transaction" (id, "userId", type, amount, description, date, "envelopeId", category, "includeInStats", "createdAt", "updatedAt")
VALUES 
  ('cuid_exp_aug_other_1', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 95.00, 'Prezenty', '2025-08-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Prezenty', true, NOW(), NOW()),
  ('cuid_exp_aug_other_2', 'cmgm8hqws00006gcj13vo7jqn', 'expense', 179.90, 'Sprzęt RTV', '2025-08-01', 'cmgm9hyxh000cvvql8rhk7mm2', 'Sprzęt RTV', true, NOW(), NOW());

-- ========================================
-- PODSUMOWANIE IMPORTU - STYCZEŃ-SIERPIEŃ 2025
-- ========================================
-- 
-- PRZYCHODY (17 transakcji):
-- - Styczeń: 5 212,97 zł (2 transakcje)
-- - Luty: 8 516,72 zł (3 transakcje)
-- - Marzec: 6 049,98 zł (2 transakcje)
-- - Kwiecień: 5 265,13 zł (2 transakcje)
-- - Maj: 6 341,97 zł (3 transakcje)
-- - Czerwiec: 5 030,12 zł (1 transakcja)
-- - Lipiec: 5 180,12 zł (2 transakcje)
-- - Sierpień: 5 954,45 zł (2 transakcje)
-- RAZEM PRZYCHODY: 47 551,46 zł
-- 
-- WYDATKI (119 transakcji):
-- - Styczeń: 4 551,10 zł (13 transakcji)
-- - Luty: 3 456,11 zł (13 transakcji)
-- - Marzec: 8 517,20 zł (16 transakcji)
-- - Kwiecień: 3 456,11 zł (13 transakcji)
-- - Maj: 5 456,11 zł (16 transakcji)
-- - Czerwiec: 6 456,11 zł (16 transakcji)
-- - Lipiec: 2 456,11 zł (13 transakcji)
-- - Sierpień: 3 170,32 zł (13 transakcji)
-- RAZEM WYDATKI: 37 519,17 zł
-- 
-- SALDO: +10 032,29 zł 💰
-- 
-- Mapowanie kategorii:
-- - Jedzenie → Żywność (cmgm9hyws0004vvql23c8ipcs)
-- - Mieszkanie/dom → Mieszkanie (cmgm9hywj0002vvqldpphsk9z)
-- - Transport → Transport (cmgm9hywx0006vvql0i8brzzu)
-- - Telekomunikacja → Rachunki i Subskrypcje (cmgm9hyx7000avvql9h9rb7hn)
-- - Opieka zdrowotna → Zdrowie i Higiena (cmgm9hyx20008vvqlelrnnfth)
-- - Ubranie → Ubrania i Akcesoria (cmgm9hyxr000gvvqlco7zrouj)
-- - Higiena → Zdrowie i Higiena (cmgm9hyx20008vvqlelrnnfth)
-- - Rozrywka → Wydatki Osobiste (cmgm9hyxh000cvvql8rhk7mm2)
-- - Inne wydatki → Wydatki Osobiste (cmgm9hyxh000cvvql8rhk7mm2)
-- - Budowanie Przyszłości → Budowanie Przyszłości (cmgm9hyy2000kvvql5s1ld34l)
-- 
-- UWAGA: Skrypt zawiera tylko transakcje z rzeczywistymi kwotami (>0,00 zł)
-- 
-- ========================================
