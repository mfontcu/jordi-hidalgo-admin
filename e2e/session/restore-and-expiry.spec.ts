import {
  bearerOf,
  CUSTOMER_USER,
  expect,
  NEW_TOKENS,
  OLD_TOKENS,
  seedSession,
  STAFF_USER,
  storedTokens,
  test,
} from '../support/backend';
import { mockHome } from '../support/home';
import { loginPage, signedInShell } from '../support/login-page';
import { mockSchedule } from '../support/schedule';
import { mockUsers } from '../support/users';

// Session restore on load (Flutter AuthGateScreen / bootstrapFromStoredSession), refresh, expiry,
// and blocked users (ApiHttpClient and AdminSessionListener).

const expectOnLoginWithRedirect = async (page: import('@playwright/test').Page, redirect: string) => {
  await expect(loginPage(page).heading).toBeVisible();
  const url = new URL(page.url());
  expect(url.pathname).toBe('/login');
  expect(url.searchParams.get('redirect')).toBe(redirect);
};

test('restores the session on load and on reload, staying on the requested page', async ({
  page,
  backend,
}) => {
  // The clients list asks for its rows. The shell opens the activity stream.
  mockUsers(backend);
  mockHome(backend);
  backend.on('GET', '/auth/me', { json: STAFF_USER });
  await seedSession(page, OLD_TOKENS);

  await page.goto('/clients?search=ana');
  await expect(signedInShell(page)).toBeVisible();
  await page.reload();
  await expect(signedInShell(page)).toBeVisible();

  await expect(page).toHaveURL('/clients?search=ana');
  expect(backend.callsTo('GET', '/auth/me').map((call) => call.authorization)).toEqual([
    'Bearer access-old',
    'Bearer access-old',
  ]);
  expect(backend.callsTo('POST', '/auth/refresh')).toEqual([]);
});

test('refreshes an expired access token once on load and keeps the session', async ({ page, backend }) => {
  // The clients list asks for its rows. The shell opens the activity stream.
  mockUsers(backend);
  mockHome(backend);
  backend.on('GET', '/auth/me', (request) =>
    bearerOf(request) === NEW_TOKENS.accessToken
      ? { json: STAFF_USER }
      : { status: 401, text: 'unauthorized' },
  );
  backend.on('POST', '/auth/refresh', { json: { ...NEW_TOKENS, user: STAFF_USER } });
  await seedSession(page, OLD_TOKENS);

  await page.goto('/clients');

  await expect(signedInShell(page)).toBeVisible();
  await expect(page).toHaveURL('/clients');
  expect(backend.callsTo('POST', '/auth/refresh')).toEqual([
    expect.objectContaining({ authorization: null, body: { refreshToken: 'refresh-old' } }),
  ]);
  expect(backend.callsTo('GET', '/auth/me').map((call) => call.authorization)).toEqual([
    'Bearer access-old',
    'Bearer access-new',
  ]);
  expect(await storedTokens(page)).toEqual({ access: 'access-new', refresh: 'refresh-new' });
});

for (const status of [401, 403]) {
  test(`expires the session when the refresh answers ${status}`, async ({ page, backend }) => {
    backend.on('GET', '/auth/me', { status: 401, text: 'unauthorized' });
    backend.on('POST', '/auth/refresh', { status, text: 'invalid refresh token' });
    await seedSession(page, OLD_TOKENS);

    await page.goto('/clients?search=ana');

    await expectOnLoginWithRedirect(page, '/clients?search=ana');
    await expect(loginPage(page).expiredNotice).toBeVisible();
    expect(backend.callsTo('POST', '/auth/refresh')).toHaveLength(1);
    expect(await storedTokens(page)).toEqual({ access: null, refresh: null });
  });
}

test('expires the session of a blocked user', async ({ page, backend }) => {
  backend.on('GET', '/auth/me', { status: 403, text: 'user is blocked' });
  await seedSession(page, OLD_TOKENS);

  await page.goto('/appointments');

  await expectOnLoginWithRedirect(page, '/appointments');
  await expect(loginPage(page).expiredNotice).toBeVisible();
  expect(backend.callsTo('POST', '/auth/refresh')).toEqual([]);
  expect(await storedTokens(page)).toEqual({ access: null, refresh: null });
});

test('expires the session when the refresh finds the user blocked', async ({ page, backend }) => {
  backend.on('GET', '/auth/me', { status: 401, text: 'unauthorized' });
  backend.on('POST', '/auth/refresh', { status: 403, text: 'user is blocked' });
  await seedSession(page, OLD_TOKENS);

  await page.goto('/appointments');

  await expectOnLoginWithRedirect(page, '/appointments');
  await expect(loginPage(page).expiredNotice).toBeVisible();
  expect(await storedTokens(page)).toEqual({ access: null, refresh: null });
});

test('signs out a stored customer session, with no expiry notice', async ({ page, backend }) => {
  backend.on('GET', '/auth/me', { json: CUSTOMER_USER });
  await seedSession(page, OLD_TOKENS);

  await page.goto('/clients');

  await expectOnLoginWithRedirect(page, '/clients');
  await expect(loginPage(page).expiredNotice).toHaveCount(0);
  expect(await storedTokens(page)).toEqual({ access: null, refresh: null });
});

test('keeps the tokens when the backend is unreachable on load', async ({ page, backend }) => {
  backend.on('GET', '/auth/me', 'network-error');
  await seedSession(page, OLD_TOKENS);

  await page.goto('/clients');

  await expectOnLoginWithRedirect(page, '/clients');
  await expect(loginPage(page).expiredNotice).toHaveCount(0);
  expect(await storedTokens(page)).toEqual({ access: 'access-old', refresh: 'refresh-old' });
});

test('signs in again after an expiry and returns to the page that was open', async ({ page, backend }) => {
  backend.on('GET', '/auth/me', (request) =>
    bearerOf(request) === NEW_TOKENS.accessToken
      ? { json: STAFF_USER }
      : { status: 401, text: 'unauthorized' },
  );
  backend.on('POST', '/auth/refresh', { status: 401, text: 'unauthorized' });
  backend.on('POST', '/auth/login', { json: { ...NEW_TOKENS, user: STAFF_USER } });
  mockSchedule(backend);
  mockHome(backend);
  await seedSession(page, OLD_TOKENS);

  await page.goto('/schedule/working-hours');
  await expectOnLoginWithRedirect(page, '/schedule/working-hours');
  await loginPage(page).signIn();

  await expect(page).toHaveURL('/schedule/working-hours');
  await expect(signedInShell(page)).toBeVisible();
});
