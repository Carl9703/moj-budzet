# 🔒 KONFIGURACJA BEZPIECZEŃSTWA

## ⚠️ WAŻNE: Wykonaj te kroki przed uruchomieniem aplikacji!

### 1. Utwórz plik `.env.local` w katalogu głównym:

```bash
# Skopiuj poniższy szablon do .env.local
```

```env
# Database - dla development
DATABASE_URL_DEV=postgresql://user:password@localhost:5432/budget_dev

# Security - WYGENERUJ WŁASNY KLUCZ!
JWT_SECRET=ZMIEN_TO_NA_LOSOWY_STRING_MIN_32_ZNAKI

# Environment
NODE_ENV=development
```

### 2. Wygeneruj bezpieczny JWT_SECRET:

**Opcja A - Node.js (zalecana):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Opcja B - PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

**Opcja C - Online generator:**
https://generate-secret.vercel.app/32

### 3. Wklej wygenerowany klucz do `.env.local`:

```env
JWT_SECRET=a7f3b9c2d4e5f6g8h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4
```

### 4. Sprawdź czy `.env.local` NIE jest w Git:

```bash
git status
# .env.local NIE powinien być na liście!
```

---

## ✅ Zrobione!

Aplikacja teraz:
- ✓ Wymaga prawdziwego JWT_SECRET (nie może wystartować bez niego)
- ✓ Waliduje wszystkie inputy z Zod
- ✓ Używa database transactions (atomowe operacje)
- ✓ Nie loguje wrażliwych danych
- ✓ .env.local jest ignorowany przez Git

---

## 🚨 NIE COMMITUJ:

❌ `.env.local`  
❌ `.env`  
❌ Plików z sekretami/hasłami

---

## 📝 Dla produkcji (Vercel):

W dashboard Vercel ustaw zmienne środowiskowe dla różnych gałęzi:

**Dla gałęzi `main` (produkcja):**
```
DATABASE_URL_MAIN=<production-database-url>
JWT_SECRET=<inny-losowy-string-niz-w-dev>
NODE_ENV=production
```

**Dla gałęzi `dev` (staging):**
```
DATABASE_URL_DEV=<staging-database-url>
JWT_SECRET=<inny-losowy-string-niz-w-main>
NODE_ENV=production
```

**NIGDY NIE UŻYWAJ TEGO SAMEGO JWT_SECRET w dev i production!**

### 🔄 Automatyczne przełączanie baz danych:

Aplikacja automatycznie wybiera odpowiednią bazę danych:
- **Gałąź `main`** → używa `DATABASE_URL_MAIN`
- **Gałąź `dev`** → używa `DATABASE_URL_DEV`
- **Lokalnie** → używa `DATABASE_URL_DEV` z `.env.local`

