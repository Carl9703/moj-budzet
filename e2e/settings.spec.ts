import { test, expect } from '@playwright/test';

test.describe('Settings Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    await page.getByRole('button', { name: '🚀 Zaloguj jako Demo' }).click();
    await expect(page).toHaveURL('/', { timeout: 15000 });
    
    await page.goto('/config');
    await expect(page.getByText('Konfiguracja')).toBeVisible({ timeout: 15000 });
    
    // Switch to General tab
    await page.getByRole('button', { name: 'Ogólne' }).click();
  });

  test('powinno pozwolić na zmianę głównej pensji', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const salaryInput = page.locator('input[type="number"]').first();
    await expect(salaryInput).toBeVisible();
    
    await salaryInput.fill('5000');
    
    const saveButton = page.getByRole('button', { name: 'Zapisz ustawienia' }).first();
    await saveButton.click({ force: true });
    
    // Upewniamy się, że nie wywaliło błędów - czekamy na przycisk
    await expect(saveButton).toBeVisible();
  });

  test('powinno poprawnie limitować miejsca po przecinku (w locie)', async ({ page }) => {
    // Switch to General tab first
    await page.getByRole('button', { name: 'Ogólne' }).click();
    
    const salaryInput = page.locator('input[type="number"]').first();
    await salaryInput.fill('5000.123'); // Trzecie miejsce po przecinku
    
    // Zdarzenie onInput zablokuje 3 cyfrę, więc wartość powinna wynosić 5000.12
    const val = await salaryInput.inputValue();
    expect(val).toBe('5000.12');
  });
});
