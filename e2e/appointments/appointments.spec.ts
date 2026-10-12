import { expect, test } from '../support/backend';
import { signedIn } from '../support/shell';

// Appointments (AppointmentsScreen, AppointmentDetailScreen, AppointmentFormScreen,
// AppointmentRescheduleScreen).

const NOW = new Date('2026-10-12T08:00:00Z');

test('main journey: list, filter, push, create, and reschedule', async ({ page, backend }) => {
  await page.clock.install({ time: NOW });
  await signedIn(page, backend);

  await page.goto('/appointments');
  const table = page.getByRole('table', { name: 'Citas' });
  await expect(table.getByRole('row')).toHaveCount(4);
  await expect(table.getByText('María Pérez', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Todas las citas' }).click();
  await page.getByRole('radio', { name: 'Pendientes' }).click();
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await expect(page).toHaveURL('/appointments?status=pending');
  await expect(table.getByRole('row')).toHaveCount(2);

  await table.getByRole('button', { name: 'Ver' }).click();
  await expect(page).toHaveURL('/appointments/apt-pending-today');
  await page.getByPlaceholder('Escribe el mensaje para el cliente…').fill('Llega puntual');
  await page.getByRole('button', { name: 'Enviar push' }).click();
  await page
    .getByRole('dialog', { name: 'Enviar push al cliente' })
    .getByRole('button', { name: 'Enviar push' })
    .click();
  await expect(page.getByText('Push enviado al cliente.')).toBeVisible();
  expect(
    backend.callsTo('POST', '/admin/appointments/apt-pending-today/customer-push').map((call) => call.body),
  ).toEqual([{ body: 'Llega puntual' }]);

  await page.goto('/appointments/form?prefillServiceId=svc-1&prefillDate=2026-10-12&prefillTime=10%3A30');
  await expect(page.getByRole('textbox', { name: 'Servicio' })).toHaveValue('Corte de Pelo');
  await expect(page.getByRole('button', { name: '10:30' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Guardar cita' }).click();
  await expect(page).toHaveURL(/\/appointments\/apt-new-1$/);
  expect(backend.callsTo('POST', '/admin/appointments').map((call) => call.body)).toEqual([
    expect.objectContaining({
      serviceId: 'svc-1',
      status: 'confirmed',
      appointmentStart: '2026-10-12T08:30:00.000Z',
    }),
  ]);

  await page.goto('/appointments/apt-today/reschedule');
  await page.getByRole('button', { name: '11:00' }).click();
  await page.getByRole('button', { name: 'Guardar nueva fecha' }).click();
  await expect(page).toHaveURL('/appointments/apt-today');
  await expect(page.getByText('Estado actualizado correctamente.')).toBeVisible();
  expect(
    backend.callsTo('PATCH', '/admin/appointments/apt-today/reschedule').map((call) => call.body),
  ).toEqual([{ appointmentStart: '2026-10-12T09:00:00.000Z' }]);
});
