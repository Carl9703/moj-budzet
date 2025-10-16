-- MIGRACJA DO MAIN - Dodaj brakujące kolumny
-- Wykonaj na bazie MAIN przed przejściem na main

-- 1. Dodaj transferPairId do Transaction
ALTER TABLE "Transaction" 
ADD COLUMN IF NOT EXISTS "transferPairId" TEXT;

-- Dodaj index dla transferPairId
CREATE INDEX IF NOT EXISTS "Transaction_transferPairId_idx" ON "Transaction"("transferPairId");

-- 2. Dodaj group do Envelope
ALTER TABLE "Envelope" 
ADD COLUMN IF NOT EXISTS "group" TEXT;

-- Dodaj index dla group
CREATE INDEX IF NOT EXISTS "Envelope_userId_group_idx" ON "Envelope"("userId", "group");

-- 3. Dodaj nowe pola do User
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP;

ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "loginAttempts" INTEGER DEFAULT 0;

ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP;

-- 4. Dodaj brakujące kolumny do UserConfig
ALTER TABLE "UserConfig" 
ADD COLUMN IF NOT EXISTS "defaultToWedding" DOUBLE PRECISION DEFAULT 0;

ALTER TABLE "UserConfig" 
ADD COLUMN IF NOT EXISTS "defaultToGroceries" DOUBLE PRECISION DEFAULT 0;

-- 5. Sprawdź czy wszystkie kolumny zostały dodane
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('User', 'Envelope', 'Transaction', 'UserConfig')
ORDER BY table_name, ordinal_position;
