import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { Toaster } from '@/shared/ui';
import { API, loginAs, plainError, STAFF_USER } from '@/test/msw/auth';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';
import { testSession } from '@/test/session';

import { LoginScreen } from './login-screen';

function renderLogin(onSignedIn = vi.fn()) {
  renderWithProviders(
    <>
      <LoginScreen onSignedIn={onSignedIn} />
      <Toaster />
    </>,
  );
  return onSignedIn;
}

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByLabelText('Correo electrónico'), email);
  if (password) await user.type(screen.getByLabelText('Contraseña'), password);
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
}

afterEach(() => {
  testSession.clear();
});

describe('LoginScreen', () => {
  it('validates the form on submit, without calling the backend', async () => {
    let called = false;
    server.use(
      http.post(`${API}/auth/login`, () => {
        called = true;
        return HttpResponse.json({});
      }),
    );
    renderLogin();

    await fillAndSubmit('', '');

    expect(screen.getByText('Introduce tu correo')).toBeInTheDocument();
    expect(screen.getByText('Introduce tu contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Correo electrónico')).toHaveAccessibleDescription('Introduce tu correo');
    expect(called).toBe(false);
  });

  it('rejects an email without @', async () => {
    renderLogin();

    await fillAndSubmit('staff.example.com', 'secret');

    expect(screen.getByText('Introduce un correo válido')).toBeInTheDocument();
  });

  it('signs in and opens the requested path', async () => {
    server.use(loginAs(STAFF_USER));
    const onSignedIn = renderLogin();

    await fillAndSubmit('staff@example.com', 'secret');

    await waitFor(() => {
      expect(onSignedIn).toHaveBeenCalledOnce();
    });
  });

  it.each([
    [401, 'invalid credentials', 'Credenciales inválidas.'],
    [403, 'user is blocked', 'No se ha podido iniciar sesión.'],
    [500, 'internal error', 'Ha ocurrido un error en el servidor.'],
  ])('shows a %i above the form', async (status, message, copy) => {
    server.use(plainError('post', '/auth/login', status, message));
    const onSignedIn = renderLogin();

    await fillAndSubmit('staff@example.com', 'wrong');

    expect(await screen.findByRole('alert')).toHaveTextContent(copy);
    expect(onSignedIn).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
  });

  it('shows and hides the password', async () => {
    const user = userEvent.setup();
    renderLogin();
    const password = screen.getByLabelText('Contraseña');

    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(password).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('tells the staff member once that the session expired', async () => {
    testSession.setTokens({ accessToken: 'a', refreshToken: 'r' });
    testSession.expire();
    renderLogin();

    expect(await screen.findByText('Tu sesión ha expirado. Vuelve a iniciar sesión.')).toBeInTheDocument();
    expect(testSession.consumeExpired()).toBe(false);
  });

  it('shows no notice after a normal sign-out', () => {
    testSession.setTokens({ accessToken: 'a', refreshToken: 'r' });
    testSession.clear();
    renderLogin();

    expect(screen.queryByText('Tu sesión ha expirado. Vuelve a iniciar sesión.')).not.toBeInTheDocument();
  });
});
