import type { Page } from '@playwright/test';

import { type MockBackend, OLD_TOKENS, seedSession, STAFF_USER } from './backend';
import { mockAppointments } from './appointments';
import { mockBusiness } from './business';
import { mockSchedule } from './schedule';
import { mockServices } from './services';
import { mockUsers } from './users';

/**
 * Signs in through stored tokens: the panel restores the session on load. The screens built so far
 * get their data from the mocked backend.
 */
export async function signedIn(page: Page, backend: MockBackend) {
  backend.on('GET', '/auth/me', { json: STAFF_USER });
  mockServices(backend);
  mockUsers(backend);
  mockAppointments(backend);
  mockSchedule(backend);
  mockBusiness(backend);
  await seedSession(page, OLD_TOKENS);
}

/** The signed-in shell, in Spanish. */
export function shell(page: Page) {
  const navigation = page.getByRole('navigation', { name: 'Menú de navegación' });
  return {
    navigation,
    /** The highlighted sidebar section. */
    highlighted: navigation.locator('a[aria-current="page"]'),
    section: (name: string) => navigation.getByRole('link', { name, exact: true }),
    heading: (name: string) => page.getByRole('heading', { level: 1, name, exact: true }),
    signOut: page.getByRole('button', { name: 'Cerrar sesión' }),
    menuButton: page.getByRole('button', { name: 'Abrir menú' }),
    collapse: page.getByRole('button', { name: 'Contraer menú' }),
    expand: page.getByRole('button', { name: 'Expandir menú' }),
  };
}
