import { expect, test } from '../support/backend';
import { shell, signedIn } from '../support/shell';

// admin_shell.dart: under 700px a drawer and the mobile header; 700–1099px the compact sidebar
// without a collapse button; from 1100px the full sidebar, which can collapse.

test.beforeEach(async ({ page, backend }) => {
  await signedIn(page, backend);
});

test('at 1440px the full sidebar collapses, and stays collapsed after a reload', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const ui = shell(page);
  await page.goto('/services');
  await expect(ui.section('Servicios')).toHaveText('Servicios');
  await expect(ui.navigation).toHaveJSProperty('offsetWidth', 240);

  await ui.collapse.click();
  await expect(ui.expand).toBeVisible();
  await expect(ui.navigation).toHaveJSProperty('offsetWidth', 60);
  await expect(ui.section('Servicios')).toHaveText('');

  await page.reload();
  await expect(ui.expand).toBeVisible();
  await expect(ui.navigation).toHaveJSProperty('offsetWidth', 60);

  await ui.expand.click();
  await expect(ui.collapse).toBeVisible();
  await expect(ui.section('Servicios')).toHaveText('Servicios');
});

test('at 900px the sidebar is compact and cannot expand', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  const ui = shell(page);
  await page.goto('/services');

  await expect(ui.heading('Servicios')).toBeVisible();
  await expect(ui.navigation).toHaveJSProperty('offsetWidth', 60);
  await expect(ui.expand).toHaveCount(0);
  await expect(ui.collapse).toHaveCount(0);

  // The compact footer keeps sign-out, language, and theme as icon buttons.
  await expect(ui.signOut).toBeVisible();
  await expect(page.getByRole('button', { name: 'Idioma' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Apariencia' })).toBeVisible();
});

test('at 390px the mobile header shows the screen and the menu opens a drawer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const ui = shell(page);
  await page.goto('/schedule/recurring-blocked-slots/r-1');

  const header = page.getByRole('banner');
  await expect(header.getByText('Hidalgo Junior Admin')).toBeVisible();
  await expect(header.getByRole('listitem')).toHaveText(['Bloqueos', 'Recurrentes', 'Detalle']);
  await expect(header.getByText('Detalle de bloqueo recurrente')).toBeVisible();
  await expect(ui.navigation).toHaveCount(0);

  await ui.menuButton.click();
  const drawer = page.getByRole('dialog', { name: 'Menú de navegación' });
  await expect(drawer).toBeVisible();
  await expect(ui.highlighted).toHaveText('Bloqueos');

  await ui.section('Clientes').click();
  await expect(drawer).toHaveCount(0);
  await expect(page).toHaveURL('/clients');
  await expect(header.getByText('Consulta el listado de clientes y accede a su ficha.')).toBeVisible();
});

test('resizing across a breakpoint switches the layout in place', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const ui = shell(page);
  await page.goto('/clients');
  await expect(ui.navigation).toBeVisible();

  await page.setViewportSize({ width: 600, height: 800 });
  await expect(ui.menuButton).toBeVisible();
  await expect(ui.navigation).toHaveCount(0);

  await page.setViewportSize({ width: 800, height: 800 });
  await expect(ui.navigation).toHaveJSProperty('offsetWidth', 60);
});
