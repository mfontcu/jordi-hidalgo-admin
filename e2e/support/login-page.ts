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

/** The signed-in shell: its sidebar navigation is there on every signed-in path. */
export const signedInShell = (page: Page) => page.getByRole('navigation', { name: 'Menú de navegación' });
