import { expect, storedTokens, test } from '../support/backend';
import { loginPage } from '../support/login-page';
import { shell, signedIn } from '../support/shell';

// Sign-out from the sidebar (AdminAppServices.logout): tokens cleared, login screen with no expiry
// notice, and browser history cannot bring the panel back. The refresh token is then revoked with
// POST /auth/logout (BE-09), without the access token; a failure there does not keep the session.

/** The revocation the sign-out sends: the stored refresh token, with no access token. */
const REVOCATION = [expect.objectContaining({ authorization: null, body: { refreshToken: 'refresh-old' } })];

test('signs out to the login screen, and Back does not reopen the panel', async ({ page, backend }) => {
  await signedIn(page, backend);
  backend.on('POST', '/auth/logout', { status: 204 });
  const ui = shell(page);
  await page.goto('/');
  await ui.section('Servicios').click();
  await expect(ui.heading('Servicios')).toBeVisible();

  await ui.signOut.click();

  await expect(loginPage(page).heading).toBeVisible();
  await expect(page).toHaveURL('/login');
  await expect(loginPage(page).expiredNotice).toHaveCount(0);
  expect(await storedTokens(page)).toEqual({ access: null, refresh: null });
  await expect.poll(() => backend.callsTo('POST', '/auth/logout')).toEqual(REVOCATION);

  await page.goBack();
  await expect(loginPage(page).heading).toBeVisible();
  await expect(ui.navigation).toHaveCount(0);
  expect(new URL(page.url()).pathname).toBe('/login');
});

test('signs out from the drawer on a narrow screen', async ({ page, backend }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signedIn(page, backend);
  backend.on('POST', '/auth/logout', { status: 204 });
  const ui = shell(page);
  await page.goto('/clients');

  await ui.menuButton.click();
  await ui.signOut.click();

  await expect(loginPage(page).heading).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await storedTokens(page)).toEqual({ access: null, refresh: null });
});

test('signs out when the backend cannot revoke the session', async ({ page, backend }) => {
  await signedIn(page, backend);
  backend.on('POST', '/auth/logout', 'network-error');
  const ui = shell(page);
  await page.goto('/clients');

  await ui.signOut.click();

  await expect(loginPage(page).heading).toBeVisible();
  await expect(loginPage(page).expiredNotice).toHaveCount(0);
  expect(await storedTokens(page)).toEqual({ access: null, refresh: null });
  await expect.poll(() => backend.callsTo('POST', '/auth/logout')).toEqual(REVOCATION);
});
