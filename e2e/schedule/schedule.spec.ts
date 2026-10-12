import { expect, test } from '../support/backend';
import { mockSchedule } from '../support/schedule';
import { signedIn } from '../support/shell';

// Schedule (WorkingHoursScreen, BlockedSlotsScreen, BlockedSlotFormScreen,
// RecurringBlockedSlotFormScreen, RecurringBlockedSlotDetailScreen).

// Monday 12 October 2026, 10:00 in the salon (UTC+2): the calendars open on this day.
const NOW = new Date('2026-10-12T08:00:00Z');

test('main journey: a block over an appointment, a rule with an exception, and a shift edit', async ({
  page,
  backend,
}) => {
  await page.clock.install({ time: NOW });
  await signedIn(page, backend);
  // Mari's appointment, 10:30–11:00 today in salon time (overrides the shared appointments list).
  mockSchedule(backend, { start: '2026-10-12T08:30:00Z', end: '2026-10-12T09:00:00Z' });

  // A punctual block from 10:00 to 12:00 today runs into the appointment, which is cancelled.
  await page.goto('/schedule/blocked-slots');
  await page.getByRole('button', { name: 'Nuevo bloqueo' }).first().click();
  await expect(page).toHaveURL('/schedule/blocked-slots/form');
  await page.getByRole('button', { name: 'Fecha' }).click();
  await page.getByRole('button', { name: 'Aplicar fecha' }).click();
  await expect(page.getByRole('button', { name: 'Fecha' })).toHaveText('12/10/2026');
  for (const [field, hour] of [
    ['Inicio', '10'],
    ['Fin', '12'],
  ] as const) {
    await page.getByRole('button', { name: field, exact: true }).click();
    const picker = page.getByRole('dialog');
    await picker.getByRole('textbox', { name: 'Hora', exact: true }).fill(hour);
    await picker.getByRole('textbox', { name: 'Minuto', exact: true }).fill('00');
    await picker.getByRole('button', { name: 'Seleccionar' }).click();
  }
  await page.getByLabel('Motivo').fill('Formación');
  await page.getByRole('button', { name: 'Crear bloqueo' }).click();

  const conflicts = page.getByRole('dialog', { name: 'Citas afectadas por el bloqueo' });
  await expect(conflicts.getByText(/Mari Puig/)).toBeVisible();
  await conflicts.getByRole('checkbox', { name: 'Cancelar las citas afectadas' }).check();
  await conflicts.getByRole('button', { name: 'Crear bloqueo' }).click();
  await expect(page).toHaveURL('/schedule/blocked-slots/blk-new');
  await expect(page.getByText('Bloqueo creado correctamente.')).toBeVisible();
  await expect(page.getByText('Se canceló 1 cita afectada.')).toBeVisible();
  expect(backend.callsTo('POST', '/admin/blocked-slots').map((call) => call.body)).toEqual([
    {
      start_at: '2026-10-12T08:00:00.000Z',
      end_at: '2026-10-12T10:00:00.000Z',
      reason: 'Formación',
      show_on_public_site: true,
    },
  ]);
  expect(backend.callsTo('PATCH', '/admin/appointments/apt-blk/cancel').map((call) => call.body)).toEqual([
    { internalNotes: 'Viene con su hijo', cancellationReason: 'Formación' },
  ]);

  // A recurring rule on Tuesdays, then an exception that opens next Tuesday.
  await page.goto('/schedule/blocked-slots?tab=recurring');
  await page.getByRole('button', { name: 'Nuevo bloqueo recurrente' }).first().click();
  await page.getByRole('radio', { name: 'mar' }).click();
  await page.getByRole('textbox', { name: 'Motivo' }).fill('Descanso');
  await page.getByRole('button', { name: 'Crear bloqueo recurrente' }).click();
  await expect(page).toHaveURL('/schedule/recurring-blocked-slots/rule-new');
  await expect(page.getByText('Bloqueo recurrente creado correctamente.')).toBeVisible();

  await page.getByRole('button', { name: 'Añadir excepción' }).click();
  const sheet = page.getByRole('dialog', { name: 'Añadir excepción puntual' });
  await expect(sheet.getByRole('button', { name: /13 oct 2026/ })).toBeVisible();
  await sheet.getByLabel('Motivo de la excepción').fill('Puente');
  await sheet.getByRole('button', { name: 'Guardar excepción' }).click();
  await expect(page.getByText('Excepción guardada correctamente.')).toBeVisible();
  await expect(page.locator('p', { hasText: /^Puente$/ })).toBeVisible();
  expect(
    backend.callsTo('POST', '/admin/recurring-blocked-slots/rule-new/exceptions').map((call) => call.body),
  ).toEqual([{ date: '2026-10-13', action: 'unblock', reason: 'Puente' }]);

  // Monday's morning shift ends at 14:00.
  await page.goto('/schedule/working-hours');
  await page.getByRole('button', { name: 'Editar' }).first().click();
  await page.getByRole('button', { name: /Fin/ }).click();
  const picker = page.getByRole('dialog', { name: /Selecciona hora/ });
  await picker.getByRole('textbox', { name: 'Hora', exact: true }).fill('14');
  await picker.getByRole('button', { name: 'Seleccionar' }).click();
  await page.getByRole('button', { name: 'Guardar franja' }).click();
  await expect(page.getByText('09:00 - 14:00').first()).toBeVisible();
  expect(backend.callsTo('PATCH', '/admin/business-hours/slots/m-1').map((call) => call.body)).toEqual([
    { startTime: '09:00', endTime: '14:00', isActive: true },
  ]);
});
