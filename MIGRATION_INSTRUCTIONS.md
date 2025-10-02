# 🚀 INSTRUKCJE MIGRACJI DEV → MAIN

## ⚠️ WAŻNE: Wykonaj te kroki dokładnie w tej kolejności!

### KROK 1: Backup bazy danych MAIN
```bash
# Na Vercel/PostgreSQL wykonaj backup:
# 1. Wejdź do Vercel Dashboard → Storage → Postgres → twoja-baza-main
# 2. Skopiuj connection string
# 3. Wykonaj backup:
pg_dump "postgresql://username:password@host:port/database" > backup_main_$(date +%Y%m%d_%H%M%S).sql
```

### KROK 2: Zastosuj migrację na bazie MAIN
```bash
# 1. Połącz się z bazą MAIN (PostgreSQL)
psql "postgresql://username:password@host:port/database"

# 2. Wykonaj skrypt migracji:
\i prisma/migration-script.sql

# 3. Sprawdź czy wszystko się udało:
\dt  # Lista tabel
SELECT * FROM "User" LIMIT 5;  # Sprawdź użytkowników
```

### KROK 3: Merge i deploy
```bash
# 1. Przełącz się na main
git checkout main

# 2. Merge dev do main
git merge dev

# 3. Wygeneruj Prisma client
npx prisma generate

# 4. Sprawdź czy schema się zgadza z bazą
npx prisma db pull  # To pokaże różnice jeśli są

# 5. Push na main
git push origin main

# 6. Deploy na Vercel (main branch)
```

### KROK 4: Weryfikacja
1. Sprawdź czy aplikacja się uruchamia
2. Sprawdź czy istniejący użytkownicy mogą się zalogować (będą musieli zresetować hasła)
3. Sprawdź czy wszystkie funkcje działają
4. Sprawdź Analytics, Dashboard, Config

### KROK 5: Czyszczenie
```bash
# Usuń pliki migracyjne po udanej migracji
rm prisma/migration-script.sql
rm MIGRATION_INSTRUCTIONS.md
```

## 🔧 Zmienne środowiskowe na Vercel MAIN:
Upewnij się, że masz ustawione:
- `DATABASE_URL` - connection string do PostgreSQL MAIN
- `NEXTAUTH_SECRET` - secret dla NextAuth
- `JWT_SECRET` - secret dla JWT tokenów

## 🚨 Plan B (jeśli coś pójdzie nie tak):
1. Przywróć backup: `psql "connection_string" < backup_main_YYYYMMDD_HHMMSS.sql`
2. Wróć na poprzednią wersję: `git reset --hard HEAD~1`
3. Redeploy poprzednią wersję na Vercel

## ✅ Co się zmieni dla użytkowników:
- Istniejący użytkownicy będą musieli zresetować hasła (bo dodaliśmy hashedPassword)
- Nowi użytkownicy będą mogli się rejestrować przez formularz
- Wszystkie dane (koperty, transakcje) zostaną zachowane
- Nowe funkcje: Dark mode, Analytics, lepszy UX
