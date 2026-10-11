import type { Page } from '@playwright/test';

/** The login screen, in Spanish (the default locale). */
export function loginPage(page: Page) {
  return {
    heading: page.getByRole('heading', { name: 'Accede con tu cuenta de administrador' }),
    email: page.getByLabel('Correo electrónico'),
    password: page.getByLabel('Contraseña', { exact: true }),
    submit: page.getByRole('button', { name: 'Entrar' }),
    alert: page.getByRole('alert'),
    expiredNotice: page.getByText('Tu sesión ha expirado. Vuelve a iniciar sesión.'),
    async signIn(email = 'staff@example.com', password = 'secret') {
      await this.email.fill(email);
      await this.password.fill(password);
      await this.submit.click();
    },
  };
}

/** The placeholder screen every signed-in path shows until phase 3. */
export const signedInHeading = (page: Page) => page.getByRole('heading', { name: 'Hidalgo Junior' });
