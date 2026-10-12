import { expect, test } from '../support/backend';
import { signedIn } from '../support/shell';

// Day agenda and availability overview (phase 9).

const NOW = new Date('2026-10-12T08:00:00Z');

test('day agenda shows today and opens an appointment', async ({ page, backend }) => {
  await page.clock.install({ time: NOW });
  await signedIn(page, backend);

  await page.goto('/schedule/day-agenda');
  await expect(page.getByRole('heading', { level: 1, name: 'Agenda del día' })).toBeVisible();
  await expect(page.getByText('Ana López').first()).toBeVisible();

  await page
    .getByRole('button', { name: /Ana López/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/appointments\/(a-1|apt-today)/);
});

test('availability overview opens the appointment form from a free slot', async ({ page, backend }) => {
  await page.clock.install({ time: NOW });
  await signedIn(page, backend);

  await page.goto('/schedule/availability');
  await expect(page.getByRole('heading', { level: 1, name: 'Disponibilidad' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Servicio' })).toHaveValue('Corte de Pelo');

  await page.getByRole('button', { name: '10:30', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Crear cita' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Crear cita' }).click();

  await expect(page).toHaveURL(/\/appointments\/form/);
  await expect(page).toHaveURL(/prefillServiceId=svc-1/);
  await expect(page).toHaveURL(/prefillDate=2026-10-12/);
  await expect(page).toHaveURL(/prefillTime=10%3A30/);
});
