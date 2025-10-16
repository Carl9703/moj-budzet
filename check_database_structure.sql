-- 🔍 SPRAWDŹ STRUKTURĘ BAZY MAIN
-- Wykonaj na bazie MAIN aby sprawdzić czy wszystkie kolumny istnieją

-- 1. Sprawdź tabele
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Sprawdź kolumny w tabeli User
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'User'
ORDER BY ordinal_position;

-- 3. Sprawdź kolumny w tabeli Envelope
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'Envelope'
ORDER BY ordinal_position;

-- 4. Sprawdź kolumny w tabeli Transaction
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'Transaction'
ORDER BY ordinal_position;

-- 5. Sprawdź kolumny w tabeli UserConfig
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'UserConfig'
ORDER BY ordinal_position;

-- 6. Sprawdź czy istnieją tabele NextAuth
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('Account', 'Session', 'VerificationToken')
ORDER BY table_name;
