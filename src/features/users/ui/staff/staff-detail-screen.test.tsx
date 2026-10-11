import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { API, meAs, STAFF_USER, TOKENS } from '@/test/msw/auth';
import { server } from '@/test/msw/server';
import { userDetail, userDto } from '@/test/msw/users';
import { renderApp } from '@/test/render-app';
import { testSession as session } from '@/test/session';

let app: ReturnType<typeof renderApp> | undefined;

beforeEach(() => {
  session.setTokens(TOKENS);
  server.use(meAs(STAFF_USER));
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  session.clear();
});

describe('staff detail', () => {
  it('shows the account: summary, contact, account, and notes', async () => {
    server.use(userDetail());
    app = renderApp('/admins/usr-1');

    expect(await screen.findByText('Jordi Hidalgo')).toBeInTheDocument();
    expect(screen.getByText('Administrador · Alta 10 ene 2026')).toBeInTheDocument();
    expect(screen.getByText('Rol: administrador')).toBeInTheDocument();
    expect(screen.getByText('+34 600 000 001')).toBeInTheDocument();
    expect(screen.getByText('jordi@example.com')).toBeInTheDocument();
    expect(screen.getByText('Acceso al panel de administración')).toBeInTheDocument();
    expect(screen.getByText('Dueño del salón')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    // The name appears once: the personal card no longer repeats it.
    expect(screen.getAllByText('Jordi Hidalgo')).toHaveLength(1);
  });

  it('deactivates after confirming, sends the stored profile, and confirms with a toast', async () => {
    const bodies: unknown[] = [];
    server.use(
      userDetail(),
      http.patch(`${API}/admin/users/usr-1`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        bodies.push(body);
        return HttpResponse.json(userDto({ isActive: body.isActive }));
      }),
    );
    app = renderApp('/admins/usr-1');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Desactivar' }));
    const dialog = await screen.findByRole('dialog', { name: 'Desactivar administrador' });
    await user.click(within(dialog).getByRole('button', { name: 'Desactivar' }));

    expect(await screen.findByText('Administrador desactivado.')).toBeInTheDocument();
    expect(bodies).toEqual([
      {
        firstName: 'Jordi',
        lastName: 'Hidalgo',
        phone: '+34 600 000 001',
        email: 'jordi@example.com',
        isActive: false,
        isBlocked: false,
        blockedReason: '',
        internalNotes: 'Dueño del salón',
        adminAlias: '',
      },
    ]);
    expect(await screen.findByText('Inactivo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activar' })).toBeInTheDocument();
  });

  it('activates without asking, and names the account when it fails', async () => {
    server.use(
      userDetail(userDto({ isActive: false })),
      http.patch(`${API}/admin/users/usr-1`, () => new HttpResponse('boom\n', { status: 500 })),
    );
    app = renderApp('/admins/usr-1');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Activar' }));

    expect(
      await screen.findByText(
        'No se pudo actualizar el administrador. Ha ocurrido un error en el servidor. Inténtalo de nuevo más tarde.',
      ),
    ).toBeInTheDocument();
  });

  it('sends the password email', async () => {
    let sent = 0;
    server.use(
      userDetail(),
      http.post(`${API}/admin/users/usr-1/password-setup-email`, () => {
        sent += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    app = renderApp('/admins/usr-1');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Enviar correo para contraseña' }));

    expect(
      await screen.findByText('Se ha enviado un correo con el enlace para establecer la contraseña.'),
    ).toBeInTheDocument();
    expect(sent).toBe(1);
  });

  it('opens the edit form', async () => {
    server.use(userDetail());
    app = renderApp('/admins/usr-1');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Editar datos' }));
    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/admins/usr-1/form');
    });
  });

  it('reports a missing account without a retry', async () => {
    server.use(http.get(`${API}/admin/users/usr-9`, () => new HttpResponse('not found\n', { status: 404 })));
    app = renderApp('/admins/usr-9');

    expect(await screen.findByText('No se pudo cargar el administrador.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
  });
});
