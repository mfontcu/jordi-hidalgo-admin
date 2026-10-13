import type { Page } from '@playwright/test';

import { expect, test } from '../support/backend';
import { loginPage } from '../support/login-page';
import { shell, signedIn } from '../support/shell';

// Language: the chosen one, else the browser's first language if it is es/ca/en, else Spanish;
// sent as Accept-Language. Theme: system, light, or dark, with the sidebar always dark.

test.describe('language', () => {
  test.describe('with a Catalan browser', () => {
    test.use({ locale: 'ca-ES' });

    test('opens in Catalan and asks the backend in Catalan', async ({ page, backend }) => {
      await signedIn(page, backend);
      await page.goto('/');

      await expect(page.getByRole('navigation', { name: 'Menú de navegació' })).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', 'ca');
      expect(backend.callsTo('GET', '/auth/me').map((call) => call.acceptLanguage)).toEqual(['ca']);
    });
  });

  test.describe('with a browser in a language the panel lacks', () => {
    test.use({ locale: 'fr-FR' });

    test('falls back to Spanish', async ({ page }) => {
      await page.goto('/');

      await expect(loginPage(page).heading).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    });
  });

  test('the chosen language replaces the browser one and survives a reload', async ({ page, backend }) => {
    await signedIn(page, backend);
    await page.goto('/appointments');
    await expect(shell(page).heading('Citas')).toBeVisible();

    await page.getByRole('button', { name: 'Español' }).click();
    const sheet = page.getByRole('dialog', { name: 'Idioma' });
    await expect(sheet.getByRole('radio', { name: 'Español' })).toBeChecked();
    await sheet.getByRole('radio', { name: 'English' }).click();

    await expect(sheet).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1, name: 'Appointments' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Appointments' })).toBeVisible();
    expect(backend.callsTo('GET', '/auth/me').map((call) => call.acceptLanguage)).toEqual(['es', 'en']);
  });
});

test.describe('theme', () => {
  const SIDEBAR_BACKGROUND = 'rgb(14, 14, 13)';
  const sidebar = (page: Page) => shell(page).navigation.locator('..');

  test.beforeEach(async ({ page, backend }) => {
    await signedIn(page, backend);
  });

  test('follows the device in system mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass('dark');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(18, 18, 16)');

    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('html')).toHaveClass('light');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(246, 245, 242)');
    await expect(sidebar(page)).toHaveCSS('background-color', SIDEBAR_BACKGROUND);
  });

  test('the chosen mode overrides the device, survives a reload, and keeps the sidebar dark', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    await page.getByRole('button', { name: 'Sistema' }).click();
    await page.getByRole('dialog', { name: 'Apariencia' }).getByRole('radio', { name: 'Oscuro' }).click();
    await expect(page.locator('html')).toHaveClass('dark');
    await expect(sidebar(page)).toHaveCSS('background-color', SIDEBAR_BACKGROUND);

    await page.reload();
    await expect(page.locator('html')).toHaveClass('dark');
    await expect(page.getByRole('button', { name: 'Oscuro' })).toBeVisible();

    await page.getByRole('button', { name: 'Oscuro' }).click();
    await page.getByRole('dialog', { name: 'Apariencia' }).getByRole('radio', { name: 'Claro' }).click();
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('html')).toHaveClass('light');
    await expect(sidebar(page)).toHaveCSS('background-color', SIDEBAR_BACKGROUND);
  });
});
