# 🚀 DEPLOY TO MAIN - Instrukcja

## ⚠️ WAŻNE: Wykonaj te kroki przed przejściem na main!

### 1. Sprawdź czy wszystkie kolumny istnieją w bazie MAIN

```sql
-- Połącz się z bazą MAIN
psql "your-main-database-connection-string"

-- Sprawdź czy kolumny istnieją
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('User', 'Envelope', 'Transaction')
ORDER BY table_name, ordinal_position;
```

### 2. Jeśli brakuje kolumn, wykonaj migrację

```sql
-- Wykonaj skrypt migracji
\i migrate_to_main.sql
```

### 3. Sprawdź czy migracja się powiodła

```sql
-- Sprawdź czy wszystkie kolumny zostały dodane
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('User', 'Envelope', 'Transaction')
ORDER BY table_name, ordinal_position;
```

### 4. Przejdź na main

```bash
# Przełącz na main
git checkout main

# Pobierz najnowsze zmiany
git pull origin main

# Zmerguj zmiany z dev
git merge dev

# Wypchnij na main
git push origin main
```

### 5. Sprawdź czy aplikacja działa

- Otwórz aplikację w przeglądarce
- Sprawdź czy wszystkie funkcje działają
- Sprawdź czy archiwum działa poprawnie

## 🔍 KOLUMNY KTÓRE MOGĄ BRAKOWAĆ:

### Transaction:
- `transferPairId` - dla par transferów

### Envelope:
- `group` - grupa koperty (needs, lifestyle, financial, target)

### User:
- `isActive` - status aktywności
- `lastLoginAt` - ostatnie logowanie
- `loginAttempts` - liczba prób logowania
- `lockedUntil` - blokada do czasu

## 🚨 ROZWIĄZYWANIE PROBLEMÓW:

### Problem: "Column does not exist"
```sql
-- Sprawdź czy kolumna istnieje
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'Transaction' AND column_name = 'transferPairId';
```

### Problem: "Index already exists"
```sql
-- Sprawdź czy index istnieje
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'Transaction' AND indexname = 'Transaction_transferPairId_idx';
```

## ✅ WERYFIKACJA:

Po migracji sprawdź:
1. Wszystkie kolumny zostały dodane
2. Aplikacja się uruchamia
3. Archiwum działa poprawnie
4. Transfery są poprawnie kategoryzowane
5. Wszystkie funkcje działają
