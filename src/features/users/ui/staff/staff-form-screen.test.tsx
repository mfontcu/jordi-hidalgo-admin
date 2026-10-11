import { screen, waitFor } from '@testing-library/react';
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

describe('staff form', () => {
  it('validates on submit and reports each field under it', async () => {
    app = renderApp('/admins/form');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Email'), 'ana.example.com');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Introduce un nombre')).toBeInTheDocument();
    expect(screen.getByText('Introduce los apellidos')).toBeInTheDocument();
    expect(screen.getByText('Introduce un teléfono')).toBeInTheDocument();
    expect(screen.getByText('Introduce un email válido')).toBeInTheDocument();
  });

  it('creates an admin account and opens its detail in place of the form', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post(`${API}/admin/users`, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(userDto({ id: 'usr-new', firstName: 'Ana', lastName: 'López' }), {
          status: 201,
        });
      }),
    );
    app = renderApp('/admins/form');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Nombre'), ' Ana ');
    await user.type(screen.getByLabelText('Apellidos'), 'López');
    await user.type(screen.getByLabelText('Teléfono'), '600 111 222');
    await user.type(screen.getByLabelText('Email'), 'ana@example.com');
    await user.type(screen.getByLabelText('Notas internas'), 'Turno de tarde');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/admins/usr-new');
    });
    expect(await screen.findByText('Administrador creado.')).toBeInTheDocument();
    expect(bodies).toEqual([
      {
        firstName: 'Ana',
        lastName: 'López',
        phone: '600 111 222',
        email: 'ana@example.com',
        isActive: true,
        internalNotes: 'Turno de tarde',
        adminAlias: '',
        role: 'admin',
      },
    ]);
  });

  it('edits status and notes with the profile locked, then goes back to the detail', async () => {
    const bodies: Record<string, unknown>[] = [];
    server.use(
      userDetail(),
      http.patch(`${API}/admin/users/usr-1`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        bodies.push(body);
        return HttpResponse.json(userDto(body));
      }),
    );
    app = renderApp('/admins/usr-1');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Editar datos' }));

    const firstName = await screen.findByLabelText('Nombre');
    expect(firstName).toHaveValue('Jordi');
    expect(firstName).toHaveAttribute('readonly');
    expect(
      screen.getByText('Solo lectura: el nombre y los datos de contacto no se editan desde el panel.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Cuenta activa' }));
    await user.clear(screen.getByLabelText('Notas internas'));
    await user.type(screen.getByLabelText('Notas internas'), 'De baja');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/admins/usr-1');
    });
    expect(await screen.findByText('Administrador actualizado.')).toBeInTheDocument();
    expect(bodies[0]).toMatchObject({ firstName: 'Jordi', isActive: false, internalNotes: 'De baja' });
    // Back goes to the list, not to the form again.
    app.router.history.back();
    await waitFor(() => {
      expect(app?.router.state.location.pathname).not.toBe('/admins/usr-1/form');
    });
  });

  it('asks before leaving with changes', async () => {
    // Opened from a link: the back button navigates, which the guard holds. (The memory history of
    // the tests skips blockers on back; Playwright covers the browser's back.)
    server.use(userDetail());
    app = renderApp('/admins/usr-1/form');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Notas internas'), ' más');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(await screen.findByRole('dialog', { name: 'Cambios sin guardar' })).toBeInTheDocument();
    expect(app.router.state.location.pathname).toBe('/admins/usr-1/form');
  });

  it('reports a save failure with what failed and why', async () => {
    server.use(
      http.post(`${API}/admin/users`, () => new HttpResponse('email already exists\n', { status: 400 })),
    );
    app = renderApp('/admins/form');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Nombre'), 'Ana');
    await user.type(screen.getByLabelText('Apellidos'), 'López');
    await user.type(screen.getByLabelText('Teléfono'), '600');
    await user.type(screen.getByLabelText('Email'), 'ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText(/^No se pudo guardar la cuenta de administrador\./)).toBeInTheDocument();
    expect(screen.getByText(/email already exists/)).toBeInTheDocument();
  });
});
