import { bearerOf, expect, NEW_TOKENS, STAFF_USER, storedTokens, test } from '../support/backend';
import { loginPage } from '../support/login-page';
import { mockServices } from '../support/services';
import { signedIn } from '../support/shell';

// Services, the reference feature (ServicesManagementScreen, ServiceDetailScreen, ServiceFormScreen).

const EMPTY_LIST = {
  items: [],
  pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 },
  summary: { totalServices: 0, activeServices: 0, inactiveServices: 0, totalCategories: 0 },
};

test('main journey: filter and search in the URL, edit a service, create a new version', async ({
  page,
  backend,
}) => {
  await signedIn(page, backend);
  mockServices(backend);
  await page.goto('/services');

  const table = page.getByRole('table', { name: 'Servicios' });
  await expect(table.getByRole('row')).toHaveCount(3);

  // Search, debounced into the URL.
  await page.getByRole('searchbox', { name: 'Buscar por nombre o categoría' }).fill('barba');
  await expect(page).toHaveURL('/services?search=barba');
  await expect(table.getByRole('row')).toHaveCount(2);
  await page.getByRole('button', { name: 'Limpiar búsqueda' }).click();
  await expect(page).toHaveURL('/services');

  // Filter by category from the panel; the filter survives a reload and clears from its chip.
  await page.getByRole('button', { name: 'Todos los servicios' }).click();
  await page.getByRole('radio', { name: 'Cabello' }).click();
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await expect(page).toHaveURL('/services?category=hair');
  await page.reload();
  await expect(table.getByRole('row')).toHaveCount(2);
  await page.getByRole('button', { name: 'Quitar filtro: Cabello' }).click();
  await expect(table.getByRole('row')).toHaveCount(3);

  // Detail: catalog order, web visibility, deactivation.
  await table.getByRole('button', { name: 'Corte de Pelo' }).click();
  await expect(page).toHaveURL('/services/svc-1');
  const order = page.getByLabel('Prioridad');
  await order.fill('5');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Prioridad actualizada.')).toBeVisible();
  await page.getByRole('switch', { name: 'Página de precios del sitio web' }).click();
  await expect(page.getByText('No visible en la web')).toBeVisible();
  await page.getByRole('button', { name: 'Desactivar servicio' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Desactivar' }).click();
  await expect(page.getByRole('button', { name: 'Activar servicio' })).toBeVisible();

  // New version, prefilled; the saved one opens its detail.
  await page.getByRole('button', { name: 'Crear nueva versión' }).click();
  await expect(page).toHaveURL('/services/svc-1/form');
  await expect(page.getByLabel('Nombre (ES)')).toHaveValue('Corte de Pelo');
  await page.getByLabel('Precio (€)').fill('18');
  await page.getByRole('button', { name: 'Crear nueva versión' }).click();
  await expect(page).toHaveURL('/services/svc-3');
  await expect(page.getByText('Nueva versión creada.')).toBeVisible();
  expect(backend.callsTo('POST', '/admin/services').map((call) => call.body)).toEqual([
    expect.objectContaining({ priceCents: 1800, displayOrder: 5, isActive: false, showOnPublicSite: false }),
  ]);

  // The new detail replaced the form in the history: back is the base service, then the list,
  // which shows the changes.
  await page.getByRole('button', { name: 'Volver a servicios' }).click();
  await expect(page).toHaveURL('/services/svc-1');
  await page.getByRole('button', { name: 'Volver a servicios' }).click();
  await expect(page).toHaveURL('/services');
  await expect(table.getByRole('row')).toHaveCount(4);
});

test('asks before leaving a form with unsaved changes', async ({ page, backend }) => {
  await signedIn(page, backend);
  mockServices(backend);
  await page.goto('/services');
  await page.getByRole('button', { name: 'Nuevo servicio' }).click();

  await page.getByLabel('Nombre (ES)').fill('Afeitado');
  await page.goBack();
  const dialog = page.getByRole('dialog', { name: 'Cambios sin guardar' });
  await dialog.getByRole('button', { name: 'Seguir editando' }).click();
  await expect(page).toHaveURL('/services/form');
  await expect(page.getByLabel('Nombre (ES)')).toHaveValue('Afeitado');

  await page.getByRole('link', { name: 'Clientes' }).click();
  await dialog.getByRole('button', { name: 'Descartar' }).click();
  await expect(page).toHaveURL('/clients');
});

test('reloads the backend-localized names on a language change', async ({ page, backend }) => {
  await signedIn(page, backend);
  mockServices(backend);
  await page.goto('/services');
  const table = page.getByRole('table');
  await expect(table.getByText('Corte de Pelo')).toBeVisible();

  await page.getByRole('button', { name: 'Español' }).click();
  await page.getByRole('dialog', { name: 'Idioma' }).getByRole('radio', { name: 'Català' }).click();

  await expect(table.getByText('Tall de cabell')).toBeVisible();
  await expect(page.getByText('Cabell, Barberia')).toBeVisible();
  const languages = backend.callsTo('GET', '/admin/services').map((call) => call.acceptLanguage);
  expect(languages.at(0)).toMatch(/^es/);
  expect(languages.at(-1)).toMatch(/^ca/);
});

test('refreshes an expired token once for the concurrent requests of a screen', async ({ page, backend }) => {
  await signedIn(page, backend);
  mockServices(backend);
  await page.goto('/services');
  await expect(page.getByRole('table')).toBeVisible();

  // The access token expires. A language change refetches the list and the categories together:
  // both get a 401, and one refresh serves both retries.
  backend.on('POST', '/auth/refresh', { json: { ...NEW_TOKENS, user: STAFF_USER } });
  for (const path of ['/admin/services', '/admin/services/categories']) {
    backend.on('GET', path, (request) =>
      bearerOf(request) === NEW_TOKENS.accessToken
        ? { json: path === '/admin/services' ? EMPTY_LIST : { items: [] } }
        : { status: 401, text: 'unauthorized' },
    );
  }
  await page.getByRole('button', { name: 'Español' }).click();
  await page.getByRole('dialog', { name: 'Idioma' }).getByRole('radio', { name: 'English' }).click();

  await expect(page.getByText('No services configured')).toBeVisible();
  expect(backend.callsTo('POST', '/auth/refresh')).toHaveLength(1);
  for (const path of ['/admin/services', '/admin/services/categories']) {
    expect(
      backend
        .callsTo('GET', path)
        .slice(-2)
        .map((call) => call.authorization),
    ).toEqual(['Bearer access-old', 'Bearer access-new']);
  }
  expect(await storedTokens(page)).toEqual({ access: 'access-new', refresh: 'refresh-new' });
});

test('a session that expires on a data screen goes to the login screen and back', async ({
  page,
  backend,
}) => {
  await signedIn(page, backend);
  mockServices(backend);
  await page.goto('/services?status=active');
  await expect(page.getByRole('table')).toBeVisible();

  backend.on('GET', '/admin/services', { status: 401, text: 'unauthorized' });
  backend.on('POST', '/auth/refresh', { status: 401, text: 'invalid refresh token' });
  await page.getByRole('button', { name: 'Activos', exact: true }).click();
  await page.getByRole('radio', { name: 'Inactivos' }).click();
  await page.getByRole('button', { name: 'Aplicar' }).click();

  await expect(loginPage(page).expiredNotice).toBeVisible();
  expect(new URL(page.url()).searchParams.get('redirect')).toBe('/services?status=inactive');
  expect(backend.callsTo('POST', '/auth/refresh')).toHaveLength(1);
  expect(await storedTokens(page)).toEqual({ access: null, refresh: null });

  // Signing in again opens the screen it left.
  backend.on('POST', '/auth/login', { json: { ...NEW_TOKENS, user: STAFF_USER } });
  mockServices(backend);
  await loginPage(page).signIn();
  await expect(page).toHaveURL('/services?status=inactive');
});
