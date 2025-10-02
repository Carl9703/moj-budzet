# 🔄 MIGRACJA ISTNIEJĄCYCH UŻYTKOWNIKÓW

## ⚠️ WAŻNE: Wykonaj backup bazy danych przed migracją!

## 🎯 CEL
Rozszerzyć istniejących użytkowników o nowe pola autoryzacji, zachowując wszystkie dane (koperty, transakcje, konfigurację).

## 📋 OPCJE MIGRACJI

### OPCJA A: Skrypt Node.js (REKOMENDOWANE)
```bash
# 1. Zainstaluj zależności (jeśli nie masz)
npm install bcryptjs

# 2. Uruchom skrypt migracji
node scripts/migrate-existing-users.js
```

### OPCJA B: Bezpośrednio SQL
```bash
# 1. Połącz się z bazą PostgreSQL
psql "your-database-connection-string"

# 2. Uruchom skrypt SQL
\i scripts/migrate-users.sql
```

## 🔐 CO SIĘ STANIE PO MIGRACJI

### ✅ ZACHOWANE DANE:
- Wszystkie użytkownicy (id, email, name, createdAt)
- Wszystkie koperty (Envelope)
- Wszystkie transakcje (Transaction)
- Wszystkie konfiguracje (UserConfig)

### 🆕 DODANE POLA:
- `hashedPassword` - tymczasowe hasło
- `role` - rola użytkownika (USER)
- `isActive` - status aktywności (true)
- `updatedAt` - data aktualizacji
- `loginAttempts` - liczba prób logowania (0)
- Tabele NextAuth (Account, Session, VerificationToken)

## 🔑 LOGOWANIE PO MIGRACJI

### Dla istniejących użytkowników:
```
Email: [ich obecny email]
Hasło: TempPassword123!
```

**WAŻNE**: Użytkownicy będą musieli zmienić hasło po pierwszym logowaniu.

### Dla nowych użytkowników:
- Mogą się zarejestrować normalnie przez formularz

## 📧 KOMUNIKAT DLA UŻYTKOWNIKÓW

```
Cześć!

Zaktualizowaliśmy naszą aplikację budżetową o nowe funkcje:
- 🌙 Dark Mode
- 📊 Zaawansowane Analytics  
- 🔐 Bezpieczny system logowania

LOGOWANIE:
- Email: [twój obecny email]
- Hasło: TempPassword123!
- Po zalogowaniu zmień hasło w ustawieniach

Wszystkie Twoje dane (koperty, transakcje) zostały zachowane!

Pozdrawiam,
[Twoje imię]
```

## 🚨 ROZWIĄZYWANIE PROBLEMÓW

### Problem: "User already exists"
```sql
-- Sprawdź duplikaty emaili
SELECT email, COUNT(*) 
FROM "User" 
GROUP BY email 
HAVING COUNT(*) > 1;
```

### Problem: "Foreign key constraint"
```sql
-- Sprawdź relacje
SELECT 
    u.email,
    COUNT(e.id) as envelopes,
    COUNT(t.id) as transactions
FROM "User" u
LEFT JOIN "Envelope" e ON u.id = e."userId"
LEFT JOIN "Transaction" t ON u.id = t."userId"
GROUP BY u.id, u.email;
```

### Problem: "Cannot login"
```sql
-- Zresetuj hasło użytkownika
UPDATE "User" 
SET "hashedPassword" = '$2a$10$rOJ8vkJZ8vQs8yGzrGzrGOXxQxQxQxQxQxQxQxQxQxQxQxQxQxQxQx'
WHERE email = 'user@example.com';
```

## ✅ WERYFIKACJA MIGRACJI

Po migracji sprawdź:
1. Liczba użytkowników się nie zmieniła
2. Wszystkie koperty są przypisane do użytkowników
3. Wszystkie transakcje są przypisane do użytkowników
4. Użytkownicy mogą się zalogować z tymczasowym hasłem
5. Wszystkie funkcje aplikacji działają

## 🧹 CZYSZCZENIE

Po udanej migracji i weryfikacji:
```bash
rm scripts/migrate-existing-users.js
rm scripts/migrate-users.sql
rm USER_MIGRATION_GUIDE.md
```
