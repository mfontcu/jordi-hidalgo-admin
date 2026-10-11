import { expect, storedTokens, test } from '../support/backend';
import { loginPage } from '../support/login-page';
import { shell, signedIn } from '../support/shell';

// Sign-out from the sidebar (AdminAppServices.logout): tokens cleared, login screen with no expiry
// notice, and browser history cannot bring the panel back.

test('signs out to the login screen, and Back does not reopen the panel', async ({ page, backend }) => {
  await signedIn(page, backend);
  const ui = shell(page);
  await page.goto('/');
  await ui.section('Servicios').click();
  await expect(ui.heading('Servicios')).toBeVisible();

  await ui.signOut.click();

  await expect(loginPage(page).heading).toBeVisible();
  await expect(page).toHaveURL('/login');
  await expect(loginPage(page).expiredNotice).toHaveCount(0);
  expect(await storedTokens(page)).toEqual({ access: null, refresh: null });

  await page.goBack();
  await expect(loginPage(page).heading).toBeVisible();
  await expect(ui.navigation).toHaveCount(0);
  expect(new URL(page.url()).pathname).toBe('/login');
});

test('signs out from the drawer on a narrow screen', async ({ page, backend }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signedIn(page, backend);
  const ui = shell(page);
  await page.goto('/clients');

  await ui.menuButton.click();
  await ui.signOut.click();

  await expect(loginPage(page).heading).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await storedTokens(page)).toEqual({ access: null, refresh: null });
});
