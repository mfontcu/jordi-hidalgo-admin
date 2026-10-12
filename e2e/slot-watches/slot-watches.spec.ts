import { expect, test } from '../support/backend';
import { signedIn } from '../support/shell';

const WATCHES = [
  {
    id: 'w-1',
    userId: 'c-1',
    userDisplayName: 'María Pérez',
    userEmail: 'maria@example.com',
    serviceId: 'svc-1',
    serviceName: 'Corte',
    status: 'active',
    dates: ['2026-10-12', '2026-10-13'],
    timeFrom: '10:00',
    timeTo: '14:00',
    notifyCount: 1,
    expiresAt: '2026-10-20T10:00:00Z',
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'w-2',
    userId: 'c-2',
    userDisplayName: 'Luis Gómez',
    userEmail: 'luis@example.com',
    serviceId: 'svc-2',
    serviceName: 'Barba',
    status: 'held',
    dates: ['2026-10-14'],
    timeFrom: '',
    timeTo: '',
    notifyCount: 0,
    expiresAt: '2026-10-20T10:00:00Z',
    createdAt: '2026-10-01T08:00:00Z',
  },
];

test('main journey: search and status stay in the URL, the detail opens, and a cancel drops the watch', async ({
  page,
  backend,
}) => {
  await page.clock.install({ time: new Date('2026-10-12T08:00:00Z') });
  await signedIn(page, backend);
  backend.on('GET', '/admin/slot-watches', { json: { items: WATCHES } });
  backend.on('POST', '/admin/slot-watches/w-1/cancel', { json: { ...WATCHES[0], status: 'cancelled' } });
  await page.goto('/schedule/slot-watches');

  const table = page.getByRole('table', { name: 'Avisos de hueco' });
  await expect(table.getByRole('row')).toHaveCount(3);
  await expect(page.getByText('Activos')).toBeVisible();

  await page.getByRole('searchbox', { name: 'Buscar cliente por nombre o email' }).fill('luis');
  await expect(page).toHaveURL('/schedule/slot-watches?search=luis');
  await expect(table.getByRole('row')).toHaveCount(2);
  await page.getByRole('button', { name: 'Limpiar búsqueda' }).click();
  await expect(page).toHaveURL('/schedule/slot-watches');

  await page.getByRole('button', { name: 'Todos los estados' }).click();
  await page.getByRole('radio', { name: 'Hold' }).click();
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await expect(page).toHaveURL('/schedule/slot-watches?status=held');
  await page.reload();
  await expect(table.getByRole('row')).toHaveCount(2);
  await page.getByRole('button', { name: 'Quitar filtro: Hold' }).click();
  await expect(table.getByRole('row')).toHaveCount(3);

  await table.getByRole('button', { name: 'Ver detalle' }).first().click();
  const sheet = page.getByRole('dialog', { name: 'María Pérez' });
  await expect(sheet.getByText('maria@example.com')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);

  await table.getByRole('row').nth(1).getByRole('button', { name: 'Cancelar aviso' }).click();
  const dialog = page.getByRole('dialog', { name: '¿Cancelar este aviso?' });
  await dialog.getByRole('button', { name: 'Cancelar aviso' }).click();
  await expect(page.getByText('Aviso cancelado')).toBeVisible();
  await expect(table.getByText('María Pérez')).toHaveCount(0);
  expect(backend.callsTo('POST', '/admin/slot-watches/w-1/cancel')).toHaveLength(1);
});
