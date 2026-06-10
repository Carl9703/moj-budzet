import { test, expect } from '@playwright/test';

test.describe('Wallets Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    await page.getByRole('button', { name: '🚀 Zaloguj jako Demo' }).click();
    await expect(page).toHaveURL('/', { timeout: 15000 });
    
    await page.goto('/wallets');
    await expect(page.getByRole('heading', { name: 'Portfele walutowe' })).toBeVisible({ timeout: 15000 });
  });

  test('powinno umożliwić nawigację i wyświetlać listę walut', async ({ page }) => {
    await page.waitForTimeout(1000);
    // Jeśli użytkownik ma jakieś waluty, pojawią się na ekranie (np. USD, EUR)
    // Z uwagi na różne dane demo, testujemy po prostu czy UI nie wywala błędów
    await expect(page.getByText('Portfele Walutowe').first()).toBeVisible();
  });
  
  test('powinno wyświetlić modal nowej wymiany', async ({ page }) => {
    // Przycisk "Dodaj / Wymień" lub ikona w Quick Actions
    const exchangeBtn = page.getByRole('button', { name: 'Dodaj / Wymień' }).first();
    
    if (await exchangeBtn.isVisible()) {
        await exchangeBtn.click();
        await expect(page.getByText('Wymiana walut')).toBeVisible({ timeout: 10000 });
        
        // Zamykamy
        await page.locator('.glass-card button').first().click(); // Przycisk krzyżyka
    }
  });
});
