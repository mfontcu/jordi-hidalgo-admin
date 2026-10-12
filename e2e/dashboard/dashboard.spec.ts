import { expect, test } from '../support/backend';
import { signedIn } from '../support/shell';

const SUMMARY = {
  appointments_today: 4,
  pending_appointments: 1,
  free_slots_today: 2,
  clients_this_week: 3,
  next_appointment: {
    id: 'apt-1',
    start_at: '2026-10-12T08:00:00Z',
    service_name: 'Corte',
    customer_name: 'Ana Ruiz',
    customer_avatar_url: '',
  },
};

test('main journey: the day summary and a quick action that opens the appointments', async ({
  page,
  backend,
}) => {
  await page.clock.install({ time: new Date('2026-10-12T08:00:00Z') });
  await signedIn(page, backend);
  backend.on('GET', '/admin/dashboard/summary', { json: SUMMARY });
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
  await expect(page.getByText('Hoy tienes 4 citas programadas y 2 huecos libres.')).toBeVisible();
  await expect(page.getByText('Próxima 10:00')).toBeVisible();
  await expect(page.getByText('Corte · Ana Ruiz')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Hoy tienes 4 citas programadas y 2 huecos libres.')).toBeVisible();

  await page.getByRole('heading', { name: 'Acciones rápidas' }).scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Abrir' }).first().click();
  await expect(page).toHaveURL('/appointments');
  await expect(page.getByRole('heading', { level: 1, name: 'Citas' })).toBeVisible();
});
