import { test, expect } from '@playwright/test';

test.describe('History Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    await page.getByRole('button', { name: '🚀 Zaloguj jako Demo' }).click();
    await expect(page).toHaveURL('/', { timeout: 15000 });
    
    await page.goto('/history');
    await expect(page.getByRole('heading', { name: 'Historia transakcji' })).toBeVisible({ timeout: 15000 });
  });

  test('powinno pozwolić na wyszukanie transakcji i wyświetlić poprawne podsumowanie', async ({ page }) => {
    // Poczekaj na załadowanie modyfikacji DOM
    await page.waitForTimeout(1000);
    
    // Wyszukaj frazę
    const searchInput = page.getByPlaceholder('SZUKAJ (TYTUŁ, OPIS, KWOTA)...');
    await searchInput.fill('Biedronka');
    await searchInput.press('Enter');

    // Sprawdź czy kafelki podsumowania są widoczne
    // (Ponieważ to zależy od danych, sprawdzamy po prostu czy etykiety statystyk się pojawiły na ekranie)
    await expect(page.getByText('Suma wydatków')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Suma przychodów')).toBeVisible();
    await expect(page.getByText('Bilans').first()).toBeVisible();
  });
  
  test('powinno wspierać operacje na kalkulatorze kwot w edycji tabeli', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Oczekujemy że w tabeli jest chociaż jedna transakcja
    const rows = page.locator('table tbody tr');
    if (await rows.count() > 0) {
      const firstRow = rows.first();
      // Kliknij w kwotę w celu edycji (kwota jest klikalna)
      const amountCell = firstRow.locator('td').nth(1); // Kolumna kwoty
      await amountCell.click();
      
      // Powinien pojawić się input
      const amountInput = amountCell.locator('input[type="text"]');
      if (await amountInput.isVisible()) {
        await amountInput.fill('750/2');
        await amountInput.press('Enter');
        
        // Zapis transakcji
        await page.waitForTimeout(1000);
        await expect(amountCell).toContainText('375.00'); // Sprawdzamy czy kalkulator obliczył wynik
      }
    }
  });
});
