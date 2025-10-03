# 🔐 Zmiany w Systemie Autoryzacji

## ✅ Co zostało naprawione?

### Problem
Wszyscy użytkownicy widzieli te same dane, ponieważ:
- API używało hardcodowanego `USER_ID = 'default-user'`
- Frontend nie wysyłał tokenów JWT do API
- Brak izolacji danych między kontami

### Rozwiązanie

## 📋 Zmiany Backend (API)

### 1. Utility do weryfikacji JWT
**Plik:** `lib/auth/jwt.ts`
- Funkcja `getUserIdFromToken()` - weryfikuje token i zwraca userId
- Funkcja `unauthorizedResponse()` - zwraca błąd 401
- Automatyczne przekierowanie do logowania przy wygasłym tokenie

### 2. Zaktualizowane API Endpointy
Wszystkie endpointy API teraz:
- ✅ Weryfikują JWT token z nagłówka `Authorization`
- ✅ Pobierają prawdziwy `userId` z tokenu
- ✅ Filtrują dane tylko dla zalogowanego użytkownika
- ✅ Zwracają błąd 401 dla nieautoryzowanych żądań

**Zaktualizowane pliki:**
- ✅ `/api/dashboard/route.ts`
- ✅ `/api/transactions/route.ts`
- ✅ `/api/transactions/[id]/route.ts`
- ✅ `/api/income/route.ts`
- ✅ `/api/config/route.ts`
- ✅ `/api/close-month/route.ts`
- ✅ `/api/archive/route.ts`
- ✅ `/api/analytics/route.ts`

## 📋 Zmiany Frontend

### 1. Utility do autoryzowanych żądań
**Plik:** `lib/utils/api.ts`
- Funkcja `authorizedFetch()` - automatycznie dodaje JWT token do każdego żądania
- Automatyczne przekierowanie do `/auth/signin` przy błędzie 401
- Obsługa wygasłych tokenów

### 2. Zaktualizowane Komponenty i Hooki
**Zaktualizowane pliki:**
- ✅ `lib/hooks/useDashboard.ts`
- ✅ `lib/hooks/useConfig.ts`
- ✅ `lib/hooks/usePreviousMonth.ts`
- ✅ `lib/handlers/modalHandlers.ts`
- ✅ `app/page.tsx`
- ✅ `app/history/page.tsx`
- ✅ `app/config/page.tsx`
- ✅ `app/archive/page.tsx`
- ✅ `app/analytics/page.tsx`
- ✅ `components/modals/CloseMonthModal.tsx`
- ✅ `components/modals/IncomeModal.tsx`

### 3. Middleware
**Plik:** `middleware.ts`
- Konfiguracja tras publicznych (`/auth/signin`, `/auth/signup`)
- Wszystkie inne trasy wymagają autoryzacji

## 🧪 Co trzeba przetestować?

### 1. Rejestracja i logowanie
```bash
1. Otwórz /auth/signup
2. Zarejestruj nowe konto (np. test1@example.com)
3. Zaloguj się
4. Sprawdź czy widzisz pustą stronę główną (brak danych)
```

### 2. Izolacja danych
```bash
1. W nowej karcie incognito, zarejestruj drugie konto (test2@example.com)
2. Dodaj transakcje/koperty dla test2
3. Wyloguj się i zaloguj jako test1
4. Sprawdź czy NIE widzisz danych test2 ✅
```

### 3. Automatyczne wylogowanie
```bash
1. Zaloguj się
2. Otwórz DevTools -> Application -> LocalStorage
3. Usuń 'authToken'
4. Odśwież stronę lub wykonaj jakąś akcję
5. Sprawdź czy zostałeś przekierowany do /auth/signin ✅
```

### 4. Token wygasłość
```bash
Token JWT wygasa po 7 dniach (ustawione w api/auth/signin/route.ts)
Po wygaśnięciu użytkownik zostanie automatycznie przekierowany do logowania
```

## 📊 Schemat działania

```
┌─────────────────┐
│   Frontend      │
│  (React/Next)   │
└────────┬────────┘
         │ 1. fetch() → authorizedFetch()
         │    + Authorization: Bearer <token>
         ▼
┌─────────────────┐
│   Backend API   │
│   (Next.js)     │
└────────┬────────┘
         │ 2. getUserIdFromToken()
         │    → weryfikacja JWT
         │    → pobranie userId
         ▼
┌─────────────────┐
│    Database     │
│   (Prisma)      │
└─────────────────┘
     WHERE userId = <prawdziwy_userId>
     
     ✅ Każdy użytkownik widzi tylko swoje dane
```

## 🔒 Bezpieczeństwo

### Token JWT
- ✅ Przechowywany w `localStorage`
- ✅ Wysyłany w nagłówku `Authorization: Bearer <token>`
- ✅ Weryfikowany po stronie serwera
- ✅ Wygasa po 7 dniach
- ✅ Automatyczne wylogowanie przy błędzie 401

### Zalecenia produkcyjne
1. **Zmień JWT_SECRET** w `.env`:
   ```
   JWT_SECRET=<długi_losowy_string>
   ```

2. **HTTPOnly Cookies** (opcjonalnie, lepsze bezpieczeństwo):
   - Przechowuj token w HTTPOnly cookies zamiast localStorage
   - Chroni przed atakami XSS

3. **HTTPS**:
   - Zawsze używaj HTTPS w produkcji
   - Chroni token przed przechwyceniem

4. **Rate Limiting**:
   - Dodaj ograniczenie liczby żądań na użytkownika
   - Chroni przed atakami brute-force

## 🚀 Następne kroki

### Opcjonalne ulepszenia:
1. **Refresh Tokens** - automatyczne odnawianie sesji
2. **Role-based Access Control (RBAC)** - różne uprawnienia dla użytkowników
3. **2FA (Two-Factor Authentication)** - dodatkowa warstwa bezpieczeństwa
4. **Email Verification** - weryfikacja adresu email przy rejestracji
5. **Password Reset** - resetowanie hasła przez email

## ❓ FAQ

### P: Czy muszę ponownie zalogować się po tych zmianach?
**O:** Tak, stare tokeny nie będą działać. Wszystkie konta muszą się ponownie zalogować.

### P: Co się stanie z istniejącymi danymi?
**O:** Wszystkie dane pozostają w bazie. Jeśli masz dane pod `default-user`, będą one dostępne tylko przez to konto.

### P: Jak przenieść dane z `default-user` do nowego konta?
**O:** Musisz zaktualizować `userId` w bazie danych:
```sql
-- Znajdź ID nowego użytkownika
SELECT id, email FROM "User";

-- Przenieś dane z default-user do nowego użytkownika
UPDATE "Transaction" SET "userId" = '<nowe_user_id>' WHERE "userId" = 'default-user';
UPDATE "Envelope" SET "userId" = '<nowe_user_id>' WHERE "userId" = 'default-user';
UPDATE "UserConfig" SET "userId" = '<nowe_user_id>' WHERE "userId" = 'default-user';
```

## 📝 Notatki dla developera

- Każde nowe API endpoint MUSI używać `getUserIdFromToken()`
- Każde nowe żądanie fetch MUSI używać `authorizedFetch()`
- Testuj zawsze izolację danych między kontami
- Loguj błędy autoryzacji do monitoringu

