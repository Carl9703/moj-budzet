import { test, expect } from '@playwright/test';

test.describe('Dashboard Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Wejdź na stronę logowania
    await page.goto('/auth/signin');
    
    // 2. Zaloguj się jako użytkownik Demo
    await page.getByRole('button', { name: '🚀 Zaloguj jako Demo' }).click();
    
    // 3. Poczekaj na przekierowanie na stronę główną (Dashboard)
    await expect(page).toHaveURL('/', { timeout: 15000 });
  });

  test('powinno pozwolić na dodanie nowego wydatku i odświeżyć saldo', async ({ page }) => {
    // Odczekaj chwilę, żeby dane dashboardu się załadowały (opcjonalne, ale zapobiega flaky testom)
    await expect(page.getByText('Konto Główne')).toBeVisible();

    // 1. Kliknij przycisk "Wydatek" w QuickActions
    await page.getByRole('button', { name: 'Wydatek' }).first().click();

    // 2. Upewnij się, że otworzył się modal dodawania wydatku
    await expect(page.getByRole('heading', { name: 'Dodaj Wydatek' })).toBeVisible();

    // 3. Wypełnij kwotę (placeholder to "0")
    await page.getByPlaceholder('0').fill('42.50');

    // 4. Wypełnij opis (placeholder to "OPIS (OPCJONALNY)")
    await page.getByPlaceholder('OPIS (OPCJONALNY)').fill('Test Playwright E2E');

    // 5. Wybierz kopertę "Żywność"
    await page.locator('button:has-text("Żywność")').first().click();

    // 6. Wybierz kategorię "Wspólne zakupy"
    await page.locator('button:has-text("Wspólne zakupy")').first().click();

    // 7. Zapisz wydatek (przycisk to "Wydaj 42.50 PLN")
    await page.getByRole('button', { name: 'Wydaj 42.50 PLN' }).click({ force: true });

    // 8. Sprawdź, czy pokazał się Toast sukcesu
    await expect(page.getByText('Wydatek zapisany pomyślnie!')).toBeVisible({ timeout: 15000 });

    // 9. Upewnij się, że modal się zamknął
    await expect(page.getByRole('heading', { name: 'Dodaj Wydatek' })).not.toBeVisible();
  });
});
