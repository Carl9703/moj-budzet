# 🤖 AUTOMATYCZNA MIGRACJA DANYCH

## ✨ Prostsza metoda - przez endpoint API!

Stworzyłem specjalny endpoint, który automatycznie przeniesie Twoje dane.

---

## 📋 KROK 1: Sprawdź użytkowników

### Otwórz w przeglądarce:
```
http://localhost:3000/api/admin/migrate-user?secret=migrate-my-data-2025
```

**LUB** użyj curl:
```bash
curl "http://localhost:3000/api/admin/migrate-user?secret=migrate-my-data-2025"
```

**Zobaczysz listę użytkowników:**
```json
{
  "users": [
    {
      "email": "demo@example.com",
      "name": "Demo User", 
      "hasData": true,
      "stats": { "transactions": 150, "envelopes": 13 }
    },
    {
      "email": "twoj@email.com",
      "name": "Twoje Imię",
      "hasData": false,
      "stats": { "transactions": 0, "envelopes": 0 }
    }
  ]
}
```

---

## 📋 KROK 2: Wykonaj migrację

### Wyślij POST request:

**Przez Postman/Insomnia:**
```
POST http://localhost:3000/api/admin/migrate-user
Content-Type: application/json

{
  "secret": "migrate-my-data-2025",
  "targetEmail": "twoj@email.com"
}
```

**LUB przez PowerShell:**
```powershell
$body = @{
    secret = "migrate-my-data-2025"
    targetEmail = "twoj@email.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/admin/migrate-user" -Method POST -Body $body -ContentType "application/json"
```

**LUB przez curl:**
```bash
curl -X POST http://localhost:3000/api/admin/migrate-user \
  -H "Content-Type: application/json" \
  -d '{"secret":"migrate-my-data-2025","targetEmail":"twoj@email.com"}'
```

---

## 📋 KROK 3: Sprawdź wyniki

**Otrzymasz:**
```json
{
  "success": true,
  "message": "✅ Migracja zakończona pomyślnie!",
  "source": {
    "email": "demo@example.com",
    "name": "Demo User"
  },
  "target": {
    "email": "twoj@email.com", 
    "name": "Twoje Imię"
  },
  "migrated": {
    "transactionsMoved": 150,
    "envelopesMoved": 13,
    "configMoved": 1
  },
  "verification": {
    "transactions": 150,
    "envelopes": 13
  }
}
```

---

## 📋 KROK 4: Weryfikacja

1. Zaloguj się jako nowy użytkownik
2. Sprawdź czy widzisz wszystkie dane
3. Sprawdź saldo, transakcje, koperty

---

## 📋 KROK 5: USUŃ ENDPOINT! ⚠️

**Po udanej migracji:**
```bash
# Usuń folder z endpointem
rm -rf app/api/admin

# Commit
git add -A
git commit -m "chore: usuń migration endpoint po migracji"
git push origin dev
```

---

## 🔒 Bezpieczeństwo:

- ✅ Endpoint wymaga secret (hasło)
- ✅ Migracja w database transaction (rollback jeśli błąd)
- ✅ Nie nadpisuje jeśli target już ma dane
- ✅ Po migracji endpoint zostanie usunięty

---

## ❓ W razie problemów:

Jeśli zobaczysz błąd - skopiuj cały output i wyślij mi, pomogę!

