import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { API, meAs, STAFF_USER, TOKENS } from '@/test/msw/auth';
import { server } from '@/test/msw/server';
import { clientDto, userDetail } from '@/test/msw/users';
import { setViewport } from '@/test/match-media';
import { renderApp } from '@/test/render-app';
import { testSession as session } from '@/test/session';

let app: ReturnType<typeof renderApp> | undefined;

beforeEach(() => {
  session.setTokens(TOKENS);
  server.use(
    meAs(STAFF_USER),
    http.get(`${API}/admin/appointments`, () => HttpResponse.json({ items: [] })),
  );
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  session.clear();
});

/** `POST /admin/users` and `GET /admin/users/phone-matches`, recording what they receive. */
function mockSave(matches = 0) {
  const created: Record<string, unknown>[] = [];
  const phoneQueries: URLSearchParams[] = [];
  server.use(
    http.get(`${API}/admin/users/phone-matches`, ({ request }) => {
      phoneQueries.push(new URL(request.url).searchParams);
      return HttpResponse.json({ count: matches });
    }),
    http.post(`${API}/admin/users`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      created.push(body);
      return HttpResponse.json(clientDto({ ...body, id: 'cli-9', adminAlias: body.adminAlias }), {
        status: 201,
      });
    }),
    userDetail(clientDto({ id: 'cli-9' })),
  );
  return { created, phoneQueries };
}

const save = () => screen.getByRole('button', { name: 'Guardar cambios' });

async function fillNewClient(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText('Nombre'), 'Ana');
  await user.type(screen.getByLabelText('Apellidos'), 'López');
  await user.type(screen.getByLabelText('Nombre alternativo (solo admin)'), 'Anita');
  await user.type(screen.getByLabelText('Teléfono'), '600 111 222');
}

describe('client form: new client', () => {
  it('validates on submit: both names and the phone', async () => {
    app = renderApp('/clients/form');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Introduce un nombre')).toBeInTheDocument();
    expect(screen.getByText('Introduce los apellidos')).toBeInTheDocument();
    expect(screen.getByText('Introduce un teléfono')).toBeInTheDocument();
    expect(screen.getByLabelText('Teléfono')).toHaveAttribute('aria-invalid', 'true');
  });

  it('rejects a phone that is not valid for its prefix, and an email without "@"', async () => {
    app = renderApp('/clients/form');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Teléfono'), '12');
    await user.type(screen.getByLabelText('Email (opcional)'), 'ana');
    await user.click(save());

    expect(await screen.findByText('Introduce un teléfono válido')).toBeInTheDocument();
    expect(screen.getByText('Introduce un email válido')).toBeInTheDocument();
  });

  it('creates the client with the E.164 phone after checking it, and opens its detail', async () => {
    const { created, phoneQueries } = mockSave(0);
    app = renderApp('/clients/form');
    const user = userEvent.setup();

    await fillNewClient(user);
    await user.click(save());

    expect(await screen.findByText('Cliente creado.')).toBeInTheDocument();
    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/clients/cli-9');
    });
    expect(Object.fromEntries(phoneQueries[0] ?? [])).toEqual({ phone: '+34600111222' });
    expect(created).toEqual([
      {
        firstName: 'Ana',
        lastName: 'López',
        phone: '+34600111222',
        email: '',
        isActive: true,
        internalNotes: '',
        adminAlias: 'Anita',
        role: 'customer',
      },
    ]);
  });

  it('asks before saving a phone other clients have', async () => {
    const { created } = mockSave(2);
    app = renderApp('/clients/form');
    const user = userEvent.setup();

    await fillNewClient(user);
    await user.click(save());
    let dialog = await screen.findByRole('dialog', { name: 'Teléfono ya registrado' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(created).toEqual([]);

    await user.click(save());
    dialog = await screen.findByRole('dialog', { name: 'Teléfono ya registrado' });
    await user.click(within(dialog).getByRole('button', { name: 'Guardar igualmente' }));
    await waitFor(() => {
      expect(created).toHaveLength(1);
    });
  });

  it('takes a national number of the chosen prefix', async () => {
    const { created } = mockSave(0);
    app = renderApp('/clients/form');
    const user = userEvent.setup();

    await fillNewClient(user);
    await user.clear(screen.getByLabelText('Teléfono'));
    await user.type(screen.getByLabelText('Teléfono'), '06 12 34 56 78');
    await user.click(screen.getByRole('button', { name: 'Cambiar prefijo: España +34' }));
    const sheet = await screen.findByRole('dialog', { name: 'Selecciona país' });
    await user.type(within(sheet).getByRole('searchbox', { name: 'Buscar' }), 'franc');
    await user.click(within(sheet).getByRole('button', { name: '+33 Francia' }));
    expect(await screen.findByRole('button', { name: 'Cambiar prefijo: Francia +33' })).toBeInTheDocument();

    await user.click(save());
    await waitFor(() => {
      expect(created[0]?.phone).toBe('+33612345678');
    });
  });

  it('opens the countries as a bottom sheet on narrow screens', async () => {
    setViewport({ width: 390 });
    app = renderApp('/clients/form');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Cambiar prefijo: España +34' }));
    const sheet = await screen.findByRole('dialog', { name: 'Selecciona país' });
    await user.click(within(sheet).getByRole('button', { name: 'Cerrar' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Selecciona país' })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Cambiar prefijo: España +34' })).toBeInTheDocument();
  });

  it('goes back to the appointment form that opened it, with the new client chosen', async () => {
    mockSave(0);
    const appointment = encodeURIComponent(
      JSON.stringify({ prefillServiceId: 'svc-1', prefillDate: '2026-10-20' }),
    );
    app = renderApp(`/clients/form?returnTo=appointmentForm&appointment=${appointment}`);
    const user = userEvent.setup();

    expect(await screen.findByRole('button', { name: 'Volver a la cita' })).toBeInTheDocument();
    await fillNewClient(user);
    await user.click(save());

    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/appointments/form');
    });
    expect(app.router.state.location.search).toEqual({
      prefillServiceId: 'svc-1',
      prefillDate: '2026-10-20',
      clientId: 'cli-9',
      clientLabel: 'Anita',
    });
  });
});

describe('client form: edit', () => {
  it('locks the profile of a client who uses the app, and saves the alias and notes', async () => {
    const bodies: unknown[] = [];
    let phoneChecks = 0;
    server.use(
      userDetail(clientDto({ isBlocked: true, blockedReason: 'Impagos' })),
      http.get(`${API}/admin/users/phone-matches`, () => {
        phoneChecks += 1;
        return HttpResponse.json({ count: 0 });
      }),
      http.patch(`${API}/admin/users/cli-1`, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(clientDto());
      }),
    );
    app = renderApp('/clients/cli-1');
    await screen.findByText('Bloqueado');
    await app.router.navigate({ to: '/clients/$clientId/form', params: { clientId: 'cli-1' } });
    const user = userEvent.setup();

    expect(await screen.findByLabelText('Nombre')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Teléfono')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Email')).toHaveValue('maria@example.com');
    expect(screen.getByText('Estado de la cuenta')).toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();

    const alias = screen.getByLabelText('Nombre alternativo (solo admin)');
    await user.clear(alias);
    await user.type(alias, 'Mari P.');
    await user.click(save());

    expect(await screen.findByText('Cliente actualizado.')).toBeInTheDocument();
    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/clients/cli-1');
    });
    expect(phoneChecks).toBe(0);
    expect(bodies).toEqual([
      {
        firstName: 'María',
        lastName: 'Pérez',
        phone: '+34600111222',
        email: 'maria@example.com',
        isActive: true,
        isBlocked: true,
        blockedReason: 'Impagos',
        internalNotes: 'Alérgica al tinte',
        adminAlias: 'Mari P.',
      },
    ]);
  });

  it('splits the stored phone of a client without an email into prefix and number', async () => {
    server.use(userDetail(clientDto({ email: '', phone: '+33612345678' })));
    app = renderApp('/clients/cli-1/form');

    expect(await screen.findByLabelText('Teléfono')).toHaveValue('6 12 34 56 78');
    expect(screen.getByRole('button', { name: 'Cambiar prefijo: Francia +33' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).not.toHaveAttribute('readonly');
    expect(screen.getByLabelText('Email (opcional)')).toHaveValue('');
    // An edit keeps the stored status: no switch, as for a client who uses the app.
    expect(screen.getByText('Estado de la cuenta')).toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volver a cliente' })).toBeInTheDocument();
  });
});
