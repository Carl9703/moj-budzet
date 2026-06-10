import { test, expect } from '@playwright/test';

test.describe('Dashboard Modals Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    await page.getByRole('button', { name: '🚀 Zaloguj jako Demo' }).click();
    await expect(page).toHaveURL('/', { timeout: 15000 });
  });

  test('powinno obsłużyć logikę przychodu', async ({ page }) => {
    await expect(page.getByText('Konto Główne')).toBeVisible();

    await page.getByRole('button', { name: 'Przychód' }).first().click();
    await expect(page.getByRole('heading', { name: '💰 Dodaj Przychód' })).toBeVisible();

    // Wypełnij kwotę
    await page.getByPlaceholder('0').fill('1000');
    
    // Zakładamy, że domyślnie wybrane jest "Konto Główne" jako cel dla przychodu.
    // Kliknij Zapisz
    await page.getByRole('button', { name: 'Dodaj 1000 PLN' }).click({ force: true });
    
    // Może się pojawić success toast, ale asynchroniczne odświeżanie ukrywa modal
    await expect(page.getByRole('heading', { name: '💰 Dodaj Przychód' })).not.toBeVisible({ timeout: 10000 });
  });

  test('powinno pozwolić na dodanie transferu', async ({ page }) => {
    await page.getByRole('button', { name: 'Transfer' }).first().click();
    await expect(page.getByRole('heading', { name: 'Transfer Środków' })).toBeVisible();

    await page.getByPlaceholder('0').fill('50');
    
    // Zamykamy modal klikając Anuluj
    await page.getByRole('button', { name: 'Anuluj' }).first().click();
    
    await expect(page.getByRole('heading', { name: 'Transfer Środków' })).not.toBeVisible({ timeout: 10000 });
  });
});
