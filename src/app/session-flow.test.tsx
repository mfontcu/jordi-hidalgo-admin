import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { apiClient, session, useSessionStore } from '@/shared/api';
import { API, loginAs, meAs, plainError, STAFF_USER, TOKENS } from '@/test/msw/auth';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/render-app';

const EXPIRED_NOTICE = 'Tu sesión ha expirado. Vuelve a iniciar sesión.';

let app: ReturnType<typeof renderApp> | undefined;

afterEach(() => {
  app?.unmount();
  app = undefined;
  session.clear();
});

const currentHref = () => app?.router.state.location.href;

describe('session flow (route guard and expiry wiring)', () => {
  it('sends a deep link without a session to the login screen, and back after sign-in', async () => {
    server.use(loginAs(STAFF_USER));
    app = renderApp('/services?x=1');

    await screen.findByRole('heading', { name: 'Accede con tu cuenta de administrador' });
    expect(app.router.state.location.pathname).toBe('/login');
    expect(app.router.state.location.search).toEqual({ redirect: '/services?x=1' });

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Correo electrónico'), 'staff@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(currentHref()).toBe('/services?x=1');
    });
  });

  it.each([
    [
      'the refresh is rejected',
      [
        plainError('get', '/admin/business-hours', 401, 'unauthorized'),
        plainError('post', '/auth/refresh', 401, 'unauthorized'),
      ],
      1,
    ],
    ['the user is blocked', [plainError('get', '/admin/business-hours', 403, 'user is blocked')], 0],
  ] as const)(
    'expires a live session when %s: at most one refresh, one trip to the login screen',
    async (_, handlers, expectedRefreshes) => {
      session.setTokens(TOKENS);
      server.use(meAs(STAFF_USER));
      app = renderApp('/services?x=1');
      await screen.findByRole('heading', { name: 'Hidalgo Junior' });
      app.queryClient.setQueryData(['clients'], ['cached']);

      let refreshes = 0;
      server.use(
        http.post(`${API}/auth/refresh`, () => {
          refreshes += 1;
          return undefined;
        }),
        ...handlers,
      );
      const navigate = vi.spyOn(app.router, 'navigate');

      await Promise.all([1, 2, 3].map(() => apiClient.GET('/admin/business-hours')));

      expect(await screen.findByText(EXPIRED_NOTICE)).toBeInTheDocument();
      expect(app.router.state.location.pathname).toBe('/login');
      expect(app.router.state.location.search).toEqual({ redirect: '/services?x=1' });
      expect(navigate).toHaveBeenCalledOnce();
      expect(refreshes).toBe(expectedRefreshes);
      expect(useSessionStore.getState()).toMatchObject({ accessToken: null, refreshToken: null });
      expect(app.queryClient.getQueryData(['clients'])).toBeUndefined();
    },
  );

  it('skips the login screen with a session', async () => {
    session.setTokens(TOKENS);
    server.use(meAs(STAFF_USER));
    app = renderApp('/login?redirect=%2Fclients');

    await waitFor(() => {
      expect(currentHref()).toBe('/clients');
    });
  });

  it('sends the old auth gate to the dashboard', async () => {
    session.setTokens(TOKENS);
    server.use(meAs(STAFF_USER));
    app = renderApp('/auth-gate');

    await waitFor(() => {
      expect(currentHref()).toBe('/');
    });
  });

  it('shows the restore spinner, not the login screen, while the session is restored', async () => {
    session.setTokens(TOKENS);
    server.use(
      http.get(`${API}/auth/me`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json(STAFF_USER);
      }),
    );
    app = renderApp('/');

    expect(await screen.findByRole('status')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Hidalgo Junior' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Entrar' })).not.toBeInTheDocument();
  });
});
