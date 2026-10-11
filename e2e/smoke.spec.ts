import { expect, test } from '@playwright/test';

test('the placeholder home renders in Spanish by default', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Hidalgo Junior | Admin');
  await expect(page.getByRole('heading', { name: 'Hidalgo Junior' })).toBeVisible();
  await expect(page.getByText('Panel de administración')).toBeVisible();
});

test('a stored language is used on load', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('hj_admin.locale', JSON.stringify({ state: { locale: 'en' }, version: 0 }));
  });
  await page.goto('/');

  await expect(page.getByText('Admin panel')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
