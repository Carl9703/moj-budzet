# 🔄 PRZEWODNIK MIGRACJI DANYCH NA NOWEGO UŻYTKOWNIKA

## ⚠️ BARDZO WAŻNE - Przeczytaj dokładnie!

Ta migracja przeniesie wszystkie Twoje dane (transakcje, koperty, konfigurację) 
z **starego użytkownika** na **nowego użytkownika**.

---

## 📋 KROK 1: Znajdź ID użytkowników

### A. Zaloguj się do bazy danych:

**Neon.tech (Twoja baza):**
```bash
psql "postgresql://neondb_owner:npg_apn5b9QFTrYG@ep-flat-sound-adj5s9vt-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### B. Sprawdź użytkowników:

```sql
SELECT id, email, name, "createdAt" FROM "User" ORDER BY "createdAt";
```

**Będziesz widział coś takiego:**
```
id                          | email              | name       | createdAt
----------------------------|--------------------|-----------|-----------
cm123abc...                 | demo@example.com   | Demo User | 2025-09-01
cm456def...                 | twoj@email.com     | Ty        | 2025-10-04
```

### C. Zidentyfikuj:
- **OLD_USER_ID** = stary użytkownik z danymi (prawdopodobnie pierwszy/demo)
- **NEW_USER_ID** = nowy użytkownik (Twoje prawdziwe konto)

---

## 📋 KROK 2: Backup bazy danych (OBOWIĄZKOWY!)

```bash
# Lokalnie - stwórz backup:
pg_dump "postgresql://neondb_owner:npg_apn5b9QFTrYG@ep-flat-sound-adj5s9vt-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Windows PowerShell:**
```powershell
# Potrzebujesz zainstalowanego pg_dump (PostgreSQL tools)
# Lub zrób backup przez Neon.tech Dashboard → Backups → Create backup
```

---

## 📋 KROK 3: Wykonaj migrację

### A. Skopiuj skrypt `scripts/migrate-data.sql`

### B. Zamień placeholdery:
```sql
-- Zamień to:
'<OLD_USER_ID>'  →  'cm123abc...'  (stary użytkownik)
'<NEW_USER_ID>'  →  'cm456def...'  (Ty)
```

### C. Wykonaj w psql:

```sql
-- Wklej zmodyfikowany skrypt migrate-data.sql
-- ALBO uruchom:
\i scripts/migrate-data.sql
```

### D. Sprawdź wyniki:

Po wykonaniu zobaczysz:
```
status          | transaction_count | envelope_count | config_count
----------------|-------------------|----------------|-------------
AFTER_MIGRATION | 150               | 13             | 1
```

### E. Jeśli wszystko OK:
```sql
COMMIT;
```

### F. Jeśli coś poszło źle:
```sql
ROLLBACK;  -- Przywróć stan sprzed migracji
```

---

## 📋 KROK 4: Weryfikacja

### A. Zaloguj się do aplikacji jako nowy użytkownik

### B. Sprawdź czy widzisz:
- ✅ Wszystkie transakcje
- ✅ Wszystkie koperty z prawidłowymi kwotami
- ✅ Konfigurację wypłaty
- ✅ Saldo się zgadza

---

## 📋 KROK 5: Merge dev → main

Po pomyślnej migracji danych:

```bash
# Przełącz się na main
git checkout main

# Merge dev do main
git merge dev

# Push na main
git push origin main
```

---

## 🚨 PLAN B - Jeśli coś pójdzie nie tak:

### Opcja 1: Rollback SQL
```sql
ROLLBACK;  -- W psql przed COMMIT
```

### Opcja 2: Przywróć backup
```bash
psql "connection_string" < backup_YYYYMMDD_HHMMSS.sql
```

### Opcja 3: Ręczne przeniesienie
Mogę Ci pomóc przenieść dane ręcznie przez API.

---

## ❓ **Pytania do Ciebie:**

1. **Czy założyłeś już nowe konto** w produkcyjnej aplikacji?
2. **Czy znasz swój email** nowego konta?
3. **Czy masz dostęp do psql / Neon.tech dashboard?**

Mogę Ci pomóc na kilka sposobów:

### **Opcja A: SQL Migration (najszybsza - 5 min)**
Połączysz się z bazą i uruchomisz skrypt SQL

### **Opcja B: API Script (bezpieczniejsza - 10 min)**
Stworzę skrypt Node.js, który przeniesie dane przez API

### **Opcja C: Manual przez Dashboard (najwolniejsza - 30 min)**
Pokażę Ci jak zrobić to ręcznie

---

**Którą opcję wybierasz?** Polecam **Opcję A** jeśli masz psql, albo **Opcję B** jeśli wolisz bezpieczniej. 🚀
