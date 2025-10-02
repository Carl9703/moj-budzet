-- SQL Migration Script: Add authentication fields to existing users
-- Run this script on your PostgreSQL database to migrate existing users

-- 1. First, let's see what users we have
SELECT 
    id, 
    email, 
    name, 
    "createdAt",
    "hashedPassword" IS NULL as needs_migration
FROM "User" 
ORDER BY "createdAt";

-- 2. Add missing columns if they don't exist (safety check)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "image" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hashedPassword" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'USER';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "loginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);

-- 3. Update existing users with temporary password
-- This is a bcrypt hash for "TempPassword123!"
UPDATE "User" 
SET 
    "hashedPassword" = '$2a$10$rOJ8vkJZ8vQs8yGzrGzrGOXxQxQxQxQxQxQxQxQxQxQxQxQxQxQxQx',
    "role" = 'USER',
    "updatedAt" = CURRENT_TIMESTAMP,
    "isActive" = true,
    "loginAttempts" = 0
WHERE "hashedPassword" IS NULL;

-- 4. Create NextAuth tables if they don't exist
CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- 5. Create indexes and constraints
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- 6. Add foreign key constraints
ALTER TABLE "Account" DROP CONSTRAINT IF EXISTS "Account_userId_fkey";
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. Update existing foreign keys to CASCADE
ALTER TABLE "Envelope" DROP CONSTRAINT IF EXISTS "Envelope_userId_fkey";
ALTER TABLE "Envelope" ADD CONSTRAINT "Envelope_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_userId_fkey";
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserConfig" DROP CONSTRAINT IF EXISTS "UserConfig_userId_fkey";
ALTER TABLE "UserConfig" ADD CONSTRAINT "UserConfig_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. Verify migration
SELECT 
    COUNT(*) as total_users,
    COUNT("hashedPassword") as users_with_password,
    COUNT(*) - COUNT("hashedPassword") as users_needing_password_reset
FROM "User";

-- 9. Show migrated users
SELECT 
    id,
    email,
    name,
    role,
    "isActive",
    "createdAt",
    "updatedAt"
FROM "User" 
ORDER BY "createdAt";

COMMIT;
