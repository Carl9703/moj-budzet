# Skrypt PowerShell do automatycznej migracji danych

Write-Host "🔍 KROK 1: Sprawdzam użytkowników..." -ForegroundColor Cyan
Write-Host ""

# Sprawdź użytkowników
try {
    $users = Invoke-RestMethod -Uri "https://moj-budzet.vercel.app/api/admin/migrate-user?secret=migrate-my-data-2025" -Method GET
    
    Write-Host "📊 Znalezieni użytkownicy:" -ForegroundColor Green
    $users.users | ForEach-Object {
        Write-Host "  📧 Email: $($_.email)" -ForegroundColor White
        Write-Host "     Imię: $($_.name)" -ForegroundColor Gray
        Write-Host "     Transakcje: $($_.stats.transactions)" -ForegroundColor Gray
        Write-Host "     Koperty: $($_.stats.envelopes)" -ForegroundColor Gray
        Write-Host "     Ma dane: $($_.hasData)" -ForegroundColor $(if ($_.hasData) { "Yellow" } else { "Gray" })
        Write-Host ""
    }
} catch {
    Write-Host "❌ Błąd sprawdzania użytkowników: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Poczekaj 1-2 minuty aż Vercel zakończy deployment" -ForegroundColor Yellow
    exit 1
}

Write-Host "🔄 KROK 2: Wykonuję migrację danych..." -ForegroundColor Cyan
Write-Host ""

# Wykonaj migrację
$body = @{
    secret = "migrate-my-data-2025"
    targetEmail = "newsletteryy@o2.pl"
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "https://moj-budzet.vercel.app/api/admin/migrate-user" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "✅ MIGRACJA ZAKOŃCZONA POMYŚLNIE!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Podsumowanie:" -ForegroundColor Cyan
    Write-Host "  Z konta: $($result.source.email) ($($result.source.name))" -ForegroundColor White
    Write-Host "  Na konto: $($result.target.email) ($($result.target.name))" -ForegroundColor White
    Write-Host ""
    Write-Host "  Przeniesione:" -ForegroundColor Yellow
    Write-Host "    • Transakcje: $($result.migrated.transactionsMoved)" -ForegroundColor Green
    Write-Host "    • Koperty: $($result.migrated.envelopesMoved)" -ForegroundColor Green
    Write-Host "    • Konfiguracja: $($result.migrated.configMoved)" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Weryfikacja:" -ForegroundColor Yellow
    Write-Host "    • Łącznie transakcji: $($result.verification.transactions)" -ForegroundColor Green
    Write-Host "    • Łącznie kopert: $($result.verification.envelopes)" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Możesz teraz zalogować się jako newsletteryy@o2.pl i zobaczyć wszystkie dane!" -ForegroundColor Magenta
    
} catch {
    Write-Host "❌ Błąd migracji: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Możliwe przyczyny:" -ForegroundColor Yellow
    Write-Host "  1. Vercel jeszcze nie zakończył deploymentu - poczekaj 1-2 minuty" -ForegroundColor Gray
    Write-Host "  2. Użytkownik newsletteryy@o2.pl już ma dane - sprawdź czy nie wykonałeś już migracji" -ForegroundColor Gray
    Write-Host "  3. Problem z bazą danych" -ForegroundColor Gray
    exit 1
}

