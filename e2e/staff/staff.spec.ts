import { expect, test } from '../support/backend';
import { signedIn } from '../support/shell';

// Staff (StaffAdminsScreen, StaffAdminDetailScreen, StaffAdminFormScreen).

test('main journey: filter in the URL, create an account, edit it, deactivate it', async ({
  page,
  backend,
}) => {
  await signedIn(page, backend);
  await page.goto('/admins');

  const table = page.getByRole('table', { name: 'Administrador' });
  await expect(table.getByRole('row')).toHaveCount(3);

  // Status filter from the panel; it survives a reload and clears from its chip.
  await page.getByRole('button', { name: 'Todos los administradores' }).click();
  await page.getByRole('radio', { name: 'Activos', exact: true }).click();
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await expect(page).toHaveURL('/admins?status=active');
  await page.reload();
  await expect(table.getByRole('row')).toHaveCount(2);
  await page.getByRole('button', { name: 'Quitar filtro: Activos' }).click();
  await expect(table.getByRole('row')).toHaveCount(3);

  // Date filter: this month, in the URL and as a chip.
  await page.getByRole('button', { name: 'Todo el historial' }).click();
  await page.getByRole('button', { name: 'Este mes' }).click();
  await expect(page).toHaveURL('/admins?date=month');
  await page.getByRole('button', { name: 'Quitar filtro: Este mes' }).click();
  await expect(page).toHaveURL('/admins');

  // Create: validation on submit, then the new detail replaces the form.
  await page.getByRole('button', { name: 'Nuevo administrador' }).click();
  await expect(page).toHaveURL('/admins/form');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('Introduce un nombre')).toBeVisible();
  await page.getByLabel('Nombre', { exact: true }).fill('Marta');
  await page.getByLabel('Apellidos').fill('Puig');
  await page.getByLabel('Teléfono').fill('+34 600 000 003');
  await page.getByLabel('Email').fill('marta@example.com');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page).toHaveURL('/admins/usr-3');
  await expect(page.getByText('Administrador creado.')).toBeVisible();
  expect(backend.callsTo('POST', '/admin/users').map((call) => call.body)).toEqual([
    expect.objectContaining({ firstName: 'Marta', role: 'admin', isActive: true }),
  ]);

  // Edit status and notes; the profile is read-only; save goes back to the detail.
  await page.getByRole('button', { name: 'Editar datos' }).click();
  await expect(page).toHaveURL('/admins/usr-3/form');
  await expect(page.getByLabel('Nombre', { exact: true })).toHaveAttribute('readonly', '');
  await page.getByLabel('Notas internas').fill('Turno de mañana');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page).toHaveURL('/admins/usr-3');
  await expect(page.getByText('Administrador actualizado.')).toBeVisible();
  await expect(page.getByText('Turno de mañana')).toBeVisible();

  // Password email and deactivation, each confirmed.
  await page.getByRole('button', { name: 'Enviar correo para contraseña' }).click();
  await expect(
    page.getByText('Se ha enviado un correo con el enlace para establecer la contraseña.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Desactivar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Desactivar' }).click();
  await expect(page.getByText('Administrador desactivado.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Activar' })).toBeVisible();

  // Back from the detail is the list, which shows the new account.
  await page.getByRole('button', { name: 'Volver a administradores' }).click();
  await expect(page).toHaveURL('/admins');
  await expect(table.getByRole('row')).toHaveCount(4);
});

test("the browser's back asks before leaving the form with changes", async ({ page, backend }) => {
  await signedIn(page, backend);
  await page.goto('/admins/usr-1');
  await page.getByRole('button', { name: 'Editar datos' }).click();
  await page.getByLabel('Notas internas').fill('Cambio');

  await page.goBack();
  const dialog = page.getByRole('dialog', { name: 'Cambios sin guardar' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Seguir editando' }).click();
  await expect(page).toHaveURL('/admins/usr-1/form');
  await expect(page.getByLabel('Notas internas')).toHaveValue('Cambio');
});
