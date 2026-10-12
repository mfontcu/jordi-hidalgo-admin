import { expect, test } from '../support/backend';
import { signedIn } from '../support/shell';

// Business content (phase 10): info, booking, notifications, legal, web, gallery.

test('main journey: tabs in the URL, save info and booking, edit legal, create a gallery slide', async ({
  page,
  backend,
}) => {
  await signedIn(page, backend);
  await page.goto('/business');

  await expect(page.getByLabel('Email')).toHaveValue('hola@hidalgojunior.com');
  await page.getByLabel('Email').fill('contacto@hidalgojunior.com');
  await page.getByRole('button', { name: 'Guardar información' }).click();
  await expect(page.getByText('Información del negocio actualizada.')).toBeVisible();
  expect(backend.callsTo('PUT', '/admin/business/info').at(-1)?.body).toEqual(
    expect.objectContaining({ email: 'contacto@hidalgojunior.com' }),
  );

  await page.getByRole('tab', { name: /Reservas/ }).click();
  await expect(page).toHaveURL('/business?tab=booking');
  await expect(page.getByText('Configuración de reservas')).toBeVisible();
  await page.getByLabel('Intervalo de slots (minutos)').fill('15');
  await page.getByRole('button', { name: 'Guardar configuración' }).click();
  await expect(page.getByText('Configuración de reservas actualizada.')).toBeVisible();
  expect(backend.callsTo('PUT', '/admin/business/booking-settings').at(-1)?.body).toEqual(
    expect.objectContaining({ slotIntervalMinutes: 15 }),
  );

  await page.getByRole('tab', { name: /Notificaciones/ }).click();
  await expect(page).toHaveURL('/business?tab=notifications');
  await expect(page.getByText('Recordatorio de cita')).toBeVisible();

  await page.getByRole('tab', { name: /Legal/ }).click();
  await expect(page).toHaveURL(/tab=legal/);
  await expect(page).toHaveURL(/doc=privacy_policy/);
  await expect(page.getByLabel('Título')).toHaveValue('Privacidad');
  await page.getByLabel('Título').fill('Política de privacidad');
  await page.getByRole('button', { name: 'Guardar traducción' }).click();
  await expect(page.getByText(/Traducción/)).toBeVisible();
  expect(backend.callsTo('PUT', '/admin/business/legal/privacy_policy/translations').at(-1)?.body).toEqual(
    expect.objectContaining({ locale: 'es', title: 'Política de privacidad' }),
  );

  await page.getByRole('tab', { name: /Galería/ }).click();
  await expect(page).toHaveURL('/business?tab=gallery');
  await page.getByRole('button', { name: 'Nueva slide' }).click();
  await expect(page.getByText('Slide creada.')).toBeVisible();
  expect(backend.callsTo('POST', '/admin/home-gallery/slides')).toHaveLength(1);

  await page.getByRole('tab', { name: /Información/ }).click();
  await expect(page).toHaveURL('/business');
});
