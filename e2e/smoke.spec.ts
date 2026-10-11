import { expect, test } from './support/backend';
import { loginPage } from './support/login-page';

test('without a session, the panel opens the login screen in Spanish by default', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Hidalgo Junior | Admin');
  await expect(loginPage(page).heading).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

test('a stored language is used on load', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('hj_admin.locale', JSON.stringify({ state: { locale: 'en' }, version: 0 }));
  });
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Sign in with your administrator account' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('the development-only kit page does not exist in a production build', async ({ page }) => {
  await page.goto('/_kit');

  await expect(page.getByRole('heading', { name: 'Kit visual' })).toHaveCount(0);
  await expect(page.getByText('Not Found')).toBeVisible();
});
