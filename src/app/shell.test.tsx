import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { session } from '@/shared/api';
import { useLocaleStore } from '@/shared/i18n';
import { useThemeStore } from '@/shared/ui';
import { setViewport } from '@/test/match-media';
import { meAs, STAFF_USER, TOKENS } from '@/test/msw/auth';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/render-app';

let app: ReturnType<typeof renderApp> | undefined;

beforeEach(() => {
  session.setTokens(TOKENS);
  server.use(meAs(STAFF_USER));
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  session.clear();
  useThemeStore.setState({ mode: 'system' });
  useLocaleStore.setState({ locale: 'es' });
});

const navigation = () => screen.getByRole('navigation', { name: 'Menú de navegación' });
const highlighted = () =>
  within(navigation())
    .getAllByRole('link')
    .filter((link) => link.getAttribute('aria-current') === 'page')
    .map((link) => link.getAttribute('aria-label') ?? link.textContent);

describe('signed-in shell', () => {
  it('lists the 11 sections in the Flutter order and highlights the one of the path', async () => {
    app = renderApp('/clients/c-1');
    await screen.findByRole('heading', { name: 'Ficha de cliente' });

    expect(
      within(navigation())
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([
      'Dashboard',
      'Disponibilidad',
      'Citas',
      'Agenda del día',
      'Avisos de hueco',
      'Bloqueos',
      'Horarios',
      'Servicios',
      'Clientes',
      'Administradores',
      'Negocio',
    ]);
    expect(highlighted()).toEqual(['Clientes']);
  });

  it('highlights the section named by ?sidebar=', async () => {
    app = renderApp('/clients/form?sidebar=%2Fappointments');
    await screen.findByRole('heading', { name: 'Formulario de cliente' });

    expect(highlighted()).toEqual(['Citas']);
  });

  it('collapses the full sidebar and remembers it', async () => {
    const user = userEvent.setup();
    app = renderApp('/');
    await screen.findByRole('heading', { name: 'Dashboard' });

    await user.click(screen.getByRole('button', { name: 'Contraer menú' }));

    expect(within(navigation()).getByRole('link', { name: 'Clientes' })).not.toHaveTextContent('Clientes');
    expect(screen.getByRole('button', { name: 'Expandir menú' })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('hj_admin.sidebar_collapsed') ?? '{}')).toMatchObject({
      state: { collapsed: true },
    });

    await user.click(screen.getByRole('button', { name: 'Expandir menú' }));
    expect(within(navigation()).getByRole('link', { name: 'Clientes' })).toHaveTextContent('Clientes');
  });

  it('shows the compact sidebar without a collapse button between 700 and 1099px', async () => {
    setViewport({ width: 900 });
    app = renderApp('/');
    await screen.findByRole('heading', { name: 'Dashboard' });

    expect(within(navigation()).getByRole('link', { name: 'Clientes' })).not.toHaveTextContent('Clientes');
    expect(screen.queryByRole('button', { name: /Contraer menú|Expandir menú/ })).not.toBeInTheDocument();
  });

  it('under 700px shows the mobile header and opens the sidebar in a drawer', async () => {
    setViewport({ width: 390 });
    const user = userEvent.setup();
    app = renderApp('/appointments/a-1');

    const banner = await screen.findByRole('banner');
    expect(within(banner).getByText('Hidalgo Junior Admin')).toBeInTheDocument();
    expect(within(banner).getByRole('list')).toHaveTextContent('CitasDetalle');
    expect(within(banner).getByText('Detalle de cita')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    const drawer = await screen.findByRole('dialog', { name: 'Menú de navegación' });
    await user.click(within(drawer).getByRole('link', { name: 'Servicios' }));

    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/services');
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('switches layout when the window is resized', async () => {
    app = renderApp('/');
    await screen.findByRole('heading', { name: 'Dashboard' });

    act(() => {
      setViewport({ width: 390 });
    });

    expect(screen.getByRole('button', { name: 'Abrir menú' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('chooses the language and the theme from the footer sheets', async () => {
    const user = userEvent.setup();
    app = renderApp('/');
    await screen.findByRole('heading', { name: 'Dashboard' });

    await user.click(screen.getByRole('button', { name: 'Español' }));
    const languages = await screen.findByRole('dialog', { name: 'Idioma' });
    expect(within(languages).getByRole('radio', { name: 'Español' })).toBeChecked();
    await user.click(within(languages).getByRole('radio', { name: 'Català' }));
    expect(useLocaleStore.getState().locale).toBe('ca');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Sistema' }));
    const themes = await screen.findByRole('dialog', { name: 'Apariencia' });
    await user.click(within(themes).getByRole('radio', { name: 'Oscuro' }));
    expect(useThemeStore.getState().mode).toBe('dark');
    expect(screen.getByRole('button', { name: 'Oscuro' })).toBeInTheDocument();
  });

  it('signs out to the login screen with no expiry notice', async () => {
    const user = userEvent.setup();
    app = renderApp('/services');
    await screen.findByRole('heading', { name: 'Servicios' });

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    await screen.findByRole('heading', { name: 'Accede con tu cuenta de administrador' });
    expect(app.router.state.location.href).toBe('/login');
    expect(session.tokens()).toBeNull();
    expect(screen.queryByText('Tu sesión ha expirado. Vuelve a iniciar sesión.')).not.toBeInTheDocument();
  });

  it('shows an unknown signed-in path as a 404 inside the shell', async () => {
    const user = userEvent.setup();
    app = renderApp('/nope/here');

    await screen.findByRole('heading', { name: 'Página no encontrada' });
    expect(navigation()).toBeInTheDocument();
    expect(highlighted()).toEqual(['Dashboard']);

    await user.click(screen.getByRole('link', { name: 'Ir al dashboard' }));
    await screen.findByRole('heading', { name: 'Dashboard' });
  });

  it.each([
    ['/appointments/detail', '/appointments'],
    ['/schedule/recurring-blocked-slots', '/schedule/blocked-slots?tab=recurring'],
  ])('redirects the legacy path %s to %s', async (from, to) => {
    app = renderApp(from);
    await waitFor(() => {
      expect(app?.router.state.location.href).toBe(to);
    });
  });
});
