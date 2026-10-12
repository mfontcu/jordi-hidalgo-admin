import { expect, test } from '../support/backend';
import { shell, signedIn } from '../support/shell';

// Every path of the parity checklist, with the header title its placeholder shows and the
// sidebar section it highlights (AdminRouter.sidebarRouteFor).
const CHECKLIST: [path: string, title: string, section: string][] = [
  ['/', 'Dashboard', 'Dashboard'],
  ['/services', 'Servicios', 'Servicios'],
  ['/services/svc-1', 'Detalle de servicio', 'Servicios'],
  ['/services/form', 'Nuevo servicio', 'Servicios'],
  ['/services/svc-1/form', 'Nueva versión de servicio', 'Servicios'],
  ['/admins', 'Administradores', 'Administradores'],
  ['/admins/usr-1', 'Cuenta de administrador', 'Administradores'],
  ['/admins/form', 'Nuevo administrador', 'Administradores'],
  ['/admins/usr-1/form', 'Editar administrador', 'Administradores'],
  ['/clients', 'Clientes', 'Clientes'],
  ['/clients/c-1?backLabel=Cita', 'Ficha de cliente', 'Clientes'],
  ['/clients/form', 'Nuevo cliente', 'Clientes'],
  ['/clients/c-1/form', 'Editar cliente', 'Clientes'],
  ['/schedule/working-hours', 'Horarios de trabajo', 'Horarios'],
  ['/schedule/blocked-slots?tab=recurring', 'Bloqueos recurrentes', 'Bloqueos'],
  ['/schedule/blocked-slots/form', 'Nuevo bloqueo', 'Bloqueos'],
  ['/schedule/blocked-slots/b-1', 'Detalle del bloqueo', 'Bloqueos'],
  ['/schedule/blocked-slots/b-1/form', 'Editar bloqueo', 'Bloqueos'],
  ['/schedule/recurring-blocked-slots/form', 'Nuevo bloqueo recurrente', 'Bloqueos'],
  ['/schedule/recurring-blocked-slots/r-1', 'Detalle de bloqueo recurrente', 'Bloqueos'],
  ['/schedule/recurring-blocked-slots/r-1/form', 'Editar bloqueo recurrente', 'Bloqueos'],
  ['/appointments', 'Citas', 'Citas'],
  ['/appointments/a-1', 'Detalle de cita', 'Citas'],
  ['/appointments/a-1/reschedule', 'Reprogramar cita', 'Citas'],
  [
    '/appointments/form?clientId=c-1&clientLabel=Ana&lockInitialUser=true&prefillServiceId=s-1&prefillDate=2026-10-12&prefillTime=10%3A30',
    'Nueva cita',
    'Citas',
  ],
  ['/schedule/day-agenda', 'Agenda del día', 'Agenda del día'],
  ['/schedule/availability', 'Disponibilidad', 'Disponibilidad'],
  ['/business?tab=legal', 'Configuración del negocio', 'Negocio'],
  ['/schedule/slot-watches', 'Avisos de hueco', 'Avisos de hueco'],
];

test.beforeEach(async ({ page, backend }) => {
  await signedIn(page, backend);
});

for (const [path, title, section] of CHECKLIST) {
  test(`deep link and reload: ${path}`, async ({ page }) => {
    const ui = shell(page);

    await page.goto(path);
    await expect(ui.heading(title)).toBeVisible();
    await expect(ui.highlighted).toHaveText(section);

    await page.reload();
    await expect(ui.heading(title)).toBeVisible();
    await expect(ui.highlighted).toHaveText(section);
    await expect(page).toHaveURL(path);
  });
}

test('sidebar navigation, back, and forward', async ({ page }) => {
  const ui = shell(page);
  await page.goto('/');
  await expect(ui.heading('Dashboard')).toBeVisible();

  await ui.section('Citas').click();
  await expect(ui.heading('Citas')).toBeVisible();
  await expect(page).toHaveURL('/appointments');
  await ui.section('Bloqueos').click();
  await expect(ui.heading('Bloqueos de agenda')).toBeVisible();
  await expect(page).toHaveURL('/schedule/blocked-slots');

  await page.goBack();
  await expect(ui.heading('Citas')).toBeVisible();
  await expect(ui.highlighted).toHaveText('Citas');
  await expect(page).toHaveURL('/appointments');

  await page.goBack();
  await expect(ui.heading('Dashboard')).toBeVisible();
  await expect(page).toHaveURL('/');

  await page.goForward();
  await expect(ui.heading('Citas')).toBeVisible();
  await page.goForward();
  await expect(ui.heading('Bloqueos de agenda')).toBeVisible();
  await expect(ui.highlighted).toHaveText('Bloqueos');
});

test('the sidebar parameter keeps the opening section highlighted, also after a reload', async ({ page }) => {
  const ui = shell(page);
  await page.goto('/clients/form?sidebar=%2Fappointments');

  await expect(ui.heading('Nuevo cliente')).toBeVisible();
  await expect(ui.highlighted).toHaveText('Citas');
  await page.reload();
  await expect(ui.highlighted).toHaveText('Citas');

  // A value that is not a section falls back to the path prefix.
  await page.goto('/clients/form?sidebar=%2Fnope');
  await expect(ui.highlighted).toHaveText('Clientes');
});

const ALIASES: [from: string, to: string, title: string][] = [
  ['/appointments/detail', '/appointments', 'Citas'],
  ['/appointments/reschedule', '/appointments', 'Citas'],
  ['/services/detail', '/services', 'Servicios'],
  ['/clients/detail', '/clients', 'Clientes'],
  ['/admins/detail', '/admins', 'Administradores'],
  ['/schedule/blocked-slots/detail', '/schedule/blocked-slots', 'Bloqueos de agenda'],
  ['/schedule/recurring-blocked-slots', '/schedule/blocked-slots?tab=recurring', 'Bloqueos recurrentes'],
  [
    '/schedule/recurring-blocked-slots/detail',
    '/schedule/blocked-slots?tab=recurring',
    'Bloqueos recurrentes',
  ],
];

for (const [from, to, title] of ALIASES) {
  test(`legacy path ${from} opens ${to}, replacing it in history`, async ({ page }) => {
    const ui = shell(page);
    await page.goto('/');
    await expect(ui.heading('Dashboard')).toBeVisible();

    await page.goto(from);
    await expect(ui.heading(title)).toBeVisible();
    await expect(page).toHaveURL(to);

    await page.goBack();
    await expect(ui.heading('Dashboard')).toBeVisible();
  });
}

test('an unknown path shows the not-found screen inside the shell, linking to the dashboard', async ({
  page,
}) => {
  const ui = shell(page);
  await page.goto('/schedule/nope');

  await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible();
  await expect(ui.navigation).toBeVisible();
  await expect(page).toHaveURL('/schedule/nope');

  await page.getByRole('link', { name: 'Ir al dashboard' }).click();
  await expect(ui.heading('Dashboard')).toBeVisible();
  await expect(page).toHaveURL('/');
});

test('an unknown path without a session still goes through sign-in', async ({ page, backend }) => {
  backend.on('GET', '/auth/me', { status: 401, text: 'unauthorized' });
  backend.on('POST', '/auth/refresh', { status: 401, text: 'unauthorized' });
  await page.goto('/schedule/nope');

  await expect(page.getByRole('heading', { name: 'Accede con tu cuenta de administrador' })).toBeVisible();
  expect(new URL(page.url()).searchParams.get('redirect')).toBe('/schedule/nope');
});
