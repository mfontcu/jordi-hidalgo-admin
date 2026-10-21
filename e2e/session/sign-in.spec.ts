import {
  CUSTOMER_USER,
  expect,
  OLD_TOKENS,
  seedSession,
  STAFF_USER,
  storedTokens,
  test,
} from '../support/backend';
import { mockHome } from '../support/home';
import { loginPage, signedInShell } from '../support/login-page';
import { mockServices } from '../support/services';
import { mockUsers } from '../support/users';

// Sign-in paths of the Flutter panel's LoginScreen (features/auth) and its router redirect.

test('signs in from the login screen, stores the tokens, and opens the dashboard', async ({
  page,
  backend,
}) => {
  backend.on('POST', '/auth/login', { json: { ...OLD_TOKENS, user: STAFF_USER } });
  mockHome(backend);
  const login = loginPage(page);

  await page.goto('/login');
  await login.signIn(' staff@example.com ', 'secret');

  await expect(signedInShell(page)).toBeVisible();
  await expect(page).toHaveURL('/');
  expect(backend.callsTo('POST', '/auth/login')).toEqual([
    expect.objectContaining({
      authorization: null,
      body: { email: 'staff@example.com', password: 'secret' },
    }),
  ]);
  expect(await storedTokens(page)).toEqual({ access: 'access-old', refresh: 'refresh-old' });
});

test('validates the form before calling the backend', async ({ page, backend }) => {
  const login = loginPage(page);
  await page.goto('/login');

  await login.submit.click();
  await expect(page.getByText('Introduce tu correo')).toBeVisible();
  await expect(page.getByText('Introduce tu contraseña')).toBeVisible();

  await login.signIn('staff.example.com', 'secret');
  await expect(page.getByText('Introduce un correo válido')).toBeVisible();
  expect(backend.calls).toEqual([]);
});

const failures = [
  {
    name: 'wrong credentials',
    reply: { status: 401, text: 'invalid credentials' },
    copy: 'Credenciales inválidas.',
  },
  {
    name: 'a blocked account',
    reply: { status: 403, text: 'user is blocked' },
    copy: 'No se ha podido iniciar sesión.',
  },
  {
    name: 'a server error',
    reply: { status: 500, text: 'internal error' },
    copy: 'Ha ocurrido un error en el servidor.',
  },
  {
    name: 'a customer account',
    reply: { json: { ...OLD_TOKENS, user: CUSTOMER_USER } },
    copy: 'No tienes permisos para acceder al panel de administración.',
  },
  {
    name: 'an unreachable backend',
    reply: 'network-error' as const,
    copy: 'No se ha podido conectar con el servidor.',
  },
];

for (const { name, reply, copy } of failures) {
  test(`stays on the login screen after ${name}`, async ({ page, backend }) => {
    backend.on('POST', '/auth/login', reply);
    const login = loginPage(page);
    await page.goto('/login');

    await login.signIn();

    await expect(login.alert).toHaveText(copy);
    await expect(page).toHaveURL('/login');
    await expect(login.submit).toBeEnabled();
    expect(await storedTokens(page)).toEqual({ access: null, refresh: null });
  });
}

test('sends a deep link without a session to the login screen, and opens it after sign-in', async ({
  page,
  backend,
}) => {
  backend.on('POST', '/auth/login', { json: { ...OLD_TOKENS, user: STAFF_USER } });
  mockServices(backend);
  mockHome(backend);
  const login = loginPage(page);

  await page.goto('/services?status=active&page=2');

  await expect(login.heading).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/login');
  expect(new URL(page.url()).searchParams.get('redirect')).toBe('/services?status=active&page=2');
  await expect(login.expiredNotice).toHaveCount(0);

  await login.signIn();

  await expect(page).toHaveURL('/services?status=active&page=2');
  await expect(signedInShell(page)).toBeVisible();
});

test('Back after sign-in never shows the login screen again', async ({ page, backend }) => {
  // The clients list asks for its rows. Back can also land on the dashboard.
  mockUsers(backend);
  mockHome(backend);
  backend.on('POST', '/auth/login', { json: { ...OLD_TOKENS, user: STAFF_USER } });
  backend.on('GET', '/auth/me', { json: STAFF_USER });
  const login = loginPage(page);
  await page.goto('/login');
  await page.goto('/clients');
  await login.signIn();
  await expect(page).toHaveURL('/clients');

  // Every login entry left in the history skips to the panel while the session lasts.
  await page.goBack();
  await expect(signedInShell(page)).toBeVisible();
  expect(new URL(page.url()).pathname).not.toBe('/login');
  await expect(login.heading).toHaveCount(0);
});

for (const redirect of ['https://evil.example/phish', '//evil.example/phish', '/login']) {
  test(`ignores the redirect ${redirect} and opens the dashboard`, async ({ page, backend }) => {
    backend.on('POST', '/auth/login', { json: { ...OLD_TOKENS, user: STAFF_USER } });
    mockHome(backend);
    await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`);

    await loginPage(page).signIn();

    await expect(page).toHaveURL('/');
  });
}

test('skips the login screen and the old auth gate with a session', async ({ page, backend }) => {
  // The clients list asks for its rows.
  mockUsers(backend);
  mockHome(backend);
  backend.on('GET', '/auth/me', { json: STAFF_USER });
  await seedSession(page, OLD_TOKENS);

  await page.goto('/login?redirect=%2Fclients');
  await expect(page).toHaveURL('/clients');

  await page.goto('/auth-gate');
  await expect(page).toHaveURL('/');
  await expect(signedInShell(page)).toBeVisible();
});
