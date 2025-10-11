# 🚀 DEBUG VERCEL DEPLOYMENT

## 🔍 PROBLEM: "Wystąpił błąd podczas tworzenia konta" na Vercel

### 📋 KROKI DEBUGOWANIA:

#### 1. Sprawdź zmienne środowiskowe w Vercel Dashboard:
```
DATABASE_URL_MAIN=<production-database-url>
JWT_SECRET=<your-jwt-secret>
NODE_ENV=production
```

#### 2. Sprawdź czy baza produkcyjna ma wszystkie kolumny:
```sql
-- Połącz się z bazą MAIN na Vercel
-- Sprawdź czy kolumny istnieją:
SELECT column_name FROM information_schema.columns WHERE table_name = 'User';
SELECT column_name FROM information_schema.columns WHERE table_name = 'Envelope';
SELECT column_name FROM information_schema.columns WHERE table_name = 'Transaction';
```

#### 3. Jeśli brakuje kolumn, wykonaj migrację:
```sql
-- Wykonaj migrate_to_main.sql na bazie produkcyjnej
\i migrate_to_main.sql
```

#### 4. Sprawdź logi Vercel:
- Idź do Vercel Dashboard
- Wybierz projekt
- Kliknij "Functions" 
- Sprawdź logi dla `/api/auth/signup`

#### 5. Testuj połączenie z bazą:
```bash
# Lokalnie z DATABASE_URL_MAIN
npx prisma db pull
npx prisma generate
```

### 🚨 MOŻLIWE PRZYCZYNY:

1. **Brak DATABASE_URL_MAIN** w Vercel
2. **Brak kolumn** w bazie produkcyjnej
3. **Błąd połączenia** z bazą
4. **Błąd JWT_SECRET** 
5. **Błąd Prisma Client** - nieaktualny

### 🔧 ROZWIĄZANIA:

#### A. Dodaj zmienne w Vercel:
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Dodaj:
   - `DATABASE_URL_MAIN` = your-production-database-url
   - `JWT_SECRET` = your-jwt-secret
   - `NODE_ENV` = production

#### B. Wykonaj migrację bazy:
```sql
-- Na bazie produkcyjnej
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "transferPairId" TEXT;
ALTER TABLE "Envelope" ADD COLUMN IF NOT EXISTS "group" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
-- ... reszta z migrate_to_main.sql
```

#### C. Redeploy aplikacji:
```bash
git push origin main
# Vercel automatycznie zredeployuje
```

### ✅ WERYFIKACJA:

Po naprawie sprawdź:
1. Czy aplikacja się uruchamia na Vercel
2. Czy można się zarejestrować
3. Czy wszystkie funkcje działają
4. Czy archiwum działa poprawnie
