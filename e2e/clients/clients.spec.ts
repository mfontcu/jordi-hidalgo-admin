import { expect, test } from '../support/backend';
import { signedIn } from '../support/shell';

// Clients (ClientsScreen, ClientDetailScreen, ClientFormScreen).

test('main journey: filter, create with a prefix, edit, block, and act on an appointment', async ({
  page,
  backend,
}) => {
  await signedIn(page, backend);
  await page.goto('/clients');

  const table = page.getByRole('table', { name: 'Cliente' });
  await expect(table.getByRole('row')).toHaveCount(3);
  await expect(table.getByText('Mari', { exact: true })).toBeVisible();

  // Status filter in the URL, kept on reload, cleared from its chip.
  await page.getByRole('button', { name: 'Todos los clientes' }).click();
  await page.getByRole('radio', { name: 'Sin verificar' }).click();
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await expect(page).toHaveURL('/clients?status=inactive');
  await page.reload();
  await expect(table.getByRole('row')).toHaveCount(2);
  await page.getByRole('button', { name: 'Quitar filtro: Sin verificar' }).click();
  await expect(table.getByRole('row')).toHaveCount(3);

  // Create: a French number with its prefix, saved as E.164 after the duplicate check.
  await page.getByRole('button', { name: 'Nuevo cliente' }).click();
  await expect(page).toHaveURL('/clients/form');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('Introduce un teléfono', { exact: true })).toBeVisible();
  await page.getByLabel('Nombre', { exact: true }).fill('Claire');
  await page.getByLabel('Apellidos').fill('Martin');
  await page.getByRole('button', { name: 'Cambiar prefijo: España +34' }).click();
  const sheet = page.getByRole('dialog', { name: 'Selecciona país' });
  await sheet.getByRole('searchbox', { name: 'Buscar' }).fill('fr');
  await sheet.getByRole('button', { name: '+33 Francia' }).click();
  await page.getByLabel('Teléfono').fill('6 12 34 56 78');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page).toHaveURL('/clients/c-3');
  await expect(page.getByText('Cliente creado.')).toBeVisible();
  expect(backend.callsTo('POST', '/admin/users').map((call) => call.body)).toEqual([
    expect.objectContaining({ firstName: 'Claire', phone: '+33612345678', role: 'customer' }),
  ]);

  // Edit without an email: the profile stays editable; save goes back to the detail.
  await page.getByRole('button', { name: 'Editar cliente' }).click();
  await expect(page).toHaveURL('/clients/c-3/form');
  await expect(page.getByLabel('Teléfono')).toHaveValue('6 12 34 56 78');
  await page.getByLabel('Nombre alternativo (solo admin)').fill('Claire (francesa)');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page).toHaveURL('/clients/c-3');
  await expect(page.getByText('Cliente actualizado.')).toBeVisible();
  await expect(page.getByText('En la app: Claire Martin').first()).toBeVisible();

  // Block with a reason, then unblock.
  await page.getByRole('button', { name: 'Bloquear cliente' }).click();
  const block = page.getByRole('dialog', { name: 'Bloquear cliente' });
  await block.getByLabel('Motivo del bloqueo').fill('No se presenta');
  await block.getByRole('button', { name: 'Bloquear' }).click();
  await expect(page.getByText('No se presenta')).toBeVisible();
  await page.getByRole('button', { name: 'Desbloquear cliente' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Desbloquear' }).click();
  await expect(page.getByRole('button', { name: 'Bloquear cliente' })).toBeVisible();

  // Another client's appointment: complete it, its internal notes kept.
  await page.goto('/clients/c-1');
  const appointments = page.getByRole('table', { name: 'Citas del cliente' });
  await expect(appointments.getByRole('row')).toHaveCount(3);
  await appointments.getByRole('row').nth(1).getByRole('button', { name: 'Marcar completada' }).click();
  await expect(page.getByText('Cita marcada como completada.')).toBeVisible();
  await expect(appointments.getByRole('row').nth(1).getByText('Completada')).toBeVisible();
  expect(backend.callsTo('PATCH', '/admin/appointments/apt-1/status').map((call) => call.body)).toEqual([
    { status: 'completed', internalNotes: 'Pagó por Bizum', cancellationReason: '' },
  ]);
});

test('a client created from the appointment form goes back to it, chosen', async ({ page, backend }) => {
  await signedIn(page, backend);
  const appointment = encodeURIComponent(JSON.stringify({ prefillServiceId: 'svc-1' }));
  await page.goto('/appointments');
  await page.goto(`/clients/form?returnTo=appointmentForm&appointment=${appointment}`);

  await expect(page.getByRole('button', { name: 'Volver a la cita' })).toBeVisible();
  await page.getByLabel('Nombre', { exact: true }).fill('Pau');
  await page.getByLabel('Apellidos').fill('Serra');
  await page.getByLabel('Teléfono').fill('611 222 333');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();

  await expect(page).toHaveURL(/\/appointments\/form\?/);
  const search = new URL(page.url()).searchParams;
  expect(search.get('clientId')).toBe('c-3');
  expect(search.get('prefillServiceId')).toBe('svc-1');
});

test('deleting a client goes back to the list', async ({ page, backend }) => {
  await signedIn(page, backend);
  await page.goto('/clients');
  await page
    .getByRole('table', { name: 'Cliente' })
    .getByRole('row', { name: /Luis Gómez/ })
    .click();
  await expect(page).toHaveURL('/clients/c-2');

  await page.getByRole('button', { name: 'Eliminar cliente' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar permanentemente' }).click();
  await expect(page).toHaveURL('/clients');
  await expect(page.getByText('El cliente se ha eliminado.')).toBeVisible();
  await expect(page.getByRole('table', { name: 'Cliente' }).getByRole('row')).toHaveCount(2);
});
