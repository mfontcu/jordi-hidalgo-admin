import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { appointmentDto, appointmentsList, appointmentsListResponse } from '@/test/msw/appointments';
import { API, meAs, STAFF_USER, TOKENS } from '@/test/msw/auth';
import { server } from '@/test/msw/server';
import { clientDto, userDetail } from '@/test/msw/users';
import { nth } from '@/test/nth';
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

const PAST = appointmentDto({
  id: 'apt-1',
  appointmentStart: '2026-01-15T09:00:00Z',
  customerNotes: 'Llego  tarde',
});
const FUTURE = appointmentDto({ id: 'apt-2', appointmentStart: '2099-01-15T09:00:00Z', status: 'pending' });
const DONE = appointmentDto({ id: 'apt-3', appointmentStart: '2026-01-10T09:00:00Z', status: 'completed' });

function withAppointments(items: unknown[] = [PAST, FUTURE, DONE]) {
  const list = appointmentsList(() => appointmentsListResponse(items));
  server.use(list.handler);
  return list;
}

const actions = () => {
  const section = screen.getByRole('heading', { name: 'Acciones' }).closest('section');
  if (!section) throw new Error('No actions section');
  return section;
};
const appointmentsTable = () => screen.findByRole('table', { name: 'Citas del cliente' });

describe('client detail', () => {
  it('shows the summary, personal data, activity, and notes', async () => {
    server.use(userDetail(clientDto()));
    withAppointments([]);
    app = renderApp('/clients/cli-1');

    expect(await screen.findByText('En la app: María Pérez', { selector: 'p.mt-1\\.5' })).toBeInTheDocument();
    expect(screen.getByText('Cliente registrado · Última visita 1 oct 2026')).toBeInTheDocument();
    expect(screen.getByText('7 citas realizadas')).toBeInTheDocument();
    expect(screen.getByText('Próxima: 20 oct 2026 · 16:30')).toBeInTheDocument();
    // Two no-shows in 90 days: a risk.
    expect(screen.getByText('Cliente en riesgo')).toBeInTheDocument();
    expect(screen.getByText('Verificado')).toBeInTheDocument();
    expect(screen.getByText('Corte, Barba')).toBeInTheDocument();
    expect(screen.getByText('Alérgica al tinte')).toBeInTheDocument();
    // The display name appears once: the personal card no longer repeats it.
    expect(screen.getAllByText('Mari')).toHaveLength(2);
    expect(await screen.findByText('Este cliente todavía no tiene citas registradas.')).toBeInTheDocument();
  });

  it('shows the email actions to an unverified client with an email', async () => {
    server.use(userDetail(clientDto({ isActive: false })));
    withAppointments([]);
    app = renderApp('/clients/cli-1');
    await screen.findByText('Sin verificar');

    const panel = within(actions());
    expect(panel.getByRole('button', { name: 'Nueva cita' })).toBeDisabled();
    expect(panel.getByRole('button', { name: 'Reenviar correo de activación' })).toBeInTheDocument();
    expect(panel.getByRole('button', { name: 'Verificar cuenta manualmente' })).toBeInTheDocument();
    expect(panel.getByRole('button', { name: 'Enviar correo para contraseña' })).toBeInTheDocument();
  });

  it('hides the email actions from a client without an email', async () => {
    server.use(userDetail(clientDto({ email: '', isActive: false })));
    withAppointments([]);
    app = renderApp('/clients/cli-1');
    await screen.findByText('Sin verificar');

    const panel = within(actions());
    expect(panel.queryByRole('button', { name: 'Reenviar correo de activación' })).not.toBeInTheDocument();
    expect(panel.queryByRole('button', { name: 'Enviar correo para contraseña' })).not.toBeInTheDocument();
    expect(panel.getByRole('button', { name: 'Verificar cuenta manualmente' })).toBeInTheDocument();
  });

  it('verifies after confirming and shows the new status', async () => {
    server.use(
      userDetail(clientDto({ isActive: false })),
      http.post(`${API}/admin/users/cli-1/verify-account`, () => HttpResponse.json(clientDto())),
    );
    withAppointments([]);
    app = renderApp('/clients/cli-1');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Verificar cuenta manualmente' }));
    const dialog = await screen.findByRole('dialog', { name: 'Verificar cuenta manualmente' });
    await user.click(within(dialog).getByRole('button', { name: 'Verificar' }));

    expect(await screen.findByText('La cuenta del cliente ha quedado verificada.')).toBeInTheDocument();
    expect(await screen.findByText('Verificado')).toBeInTheDocument();
  });

  it('blocks with a reason, sending the stored account with its alias and notes', async () => {
    const bodies: unknown[] = [];
    server.use(
      userDetail(clientDto()),
      http.patch(`${API}/admin/users/cli-1`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        bodies.push(body);
        return HttpResponse.json(
          clientDto({
            isBlocked: true,
            blockedReason: body.blockedReason,
            blockedAt: '2026-10-12T08:00:00Z',
          }),
        );
      }),
    );
    withAppointments([]);
    app = renderApp('/clients/cli-1');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Bloquear cliente' }));
    const dialog = await screen.findByRole('dialog', { name: 'Bloquear cliente' });
    expect(
      within(dialog).getByText(
        'El cliente no podrá iniciar sesión, reservar ni usar el conector. No podrá desbloquearse por sí mismo.',
      ),
    ).toBeInTheDocument();
    const confirm = within(dialog).getByRole('button', { name: 'Bloquear' });
    // The reason is required.
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByLabelText('Motivo del bloqueo'), '  No se presenta ');
    await user.click(confirm);

    expect(await screen.findByText('Cliente bloqueado.')).toBeInTheDocument();
    expect(screen.getByText('Bloqueado')).toBeInTheDocument();
    expect(bodies).toEqual([
      {
        firstName: 'María',
        lastName: 'Pérez',
        phone: '+34600111222',
        email: 'maria@example.com',
        isActive: true,
        isBlocked: true,
        blockedReason: 'No se presenta',
        internalNotes: 'Alérgica al tinte',
        adminAlias: 'Mari',
      },
    ]);
    expect(screen.getByText('12 oct 2026 · 10:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Desbloquear cliente' })).toBeInTheDocument();
  });

  it('names the account when unblocking fails', async () => {
    server.use(
      userDetail(clientDto({ isBlocked: true, blockedReason: 'Impagos' })),
      http.patch(`${API}/admin/users/cli-1`, () => new HttpResponse('boom\n', { status: 500 })),
    );
    withAppointments([]);
    app = renderApp('/clients/cli-1');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Desbloquear cliente' }));
    const dialog = await screen.findByRole('dialog', { name: 'Desbloquear cliente' });
    expect(
      within(dialog).getByText(
        'El cliente volverá a poder iniciar sesión, reservar y usar el conector. ¿Quieres continuar?',
      ),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Desbloquear' }));

    expect(await screen.findByText(/^No se pudo desbloquear el cliente\./)).toBeInTheDocument();
  });

  it('deletes after confirming and goes back to the list with a toast', async () => {
    let deleted = false;
    server.use(
      userDetail(clientDto()),
      http.delete(`${API}/admin/users/cli-1`, () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
      http.get(`${API}/admin/users`, () =>
        HttpResponse.json({ items: [], pagination: { page: 1, pageSize: 10, totalItems: 0 }, summary: {} }),
      ),
    );
    withAppointments([]);
    app = renderApp('/clients/cli-1');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Eliminar cliente' }));
    const dialog = await screen.findByRole('dialog', { name: 'Eliminar cliente' });
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar permanentemente' }));

    expect(await screen.findByText('El cliente se ha eliminado.')).toBeInTheDocument();
    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/clients');
    });
    expect(deleted).toBe(true);
  });

  it('opens the appointment form with the client locked, and the edit form', async () => {
    server.use(userDetail(clientDto()));
    withAppointments([]);
    app = renderApp('/clients/cli-1');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Nueva cita' }));
    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/appointments/form');
    });
    expect(app.router.state.location.search).toEqual({
      clientId: 'cli-1',
      clientLabel: 'Mari',
      backLabel: 'Volver a cliente',
      lockInitialUser: true,
    });

    app.router.history.back();
    await user.click(await screen.findByRole('button', { name: 'Editar cliente' }));
    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/clients/cli-1/form');
    });
  });

  it('shows the back label of the screen that opened it', async () => {
    server.use(userDetail(clientDto()));
    withAppointments([]);
    app = renderApp('/clients/cli-1?backLabel=Volver%20a%20la%20cita');

    expect(await screen.findByRole('button', { name: 'Volver a la cita' })).toBeInTheDocument();
  });
});

describe('client appointments', () => {
  it("lists the client's appointments with the actions each one allows", async () => {
    server.use(userDetail(clientDto()));
    const list = withAppointments();
    app = renderApp('/clients/cli-1');

    const rows = within(await appointmentsTable()).getAllByRole('row');
    expect(rows).toHaveLength(4);
    expect(Object.fromEntries(list.queries[0] ?? [])).toEqual({
      userId: 'cli-1',
      status: 'all',
      page: '1',
      pageSize: '10',
    });
    // Started and open: complete, no-show, cancel. Every row names the client by the alias.
    const started = within(nth(rows, 1));
    expect(started.getByText('15/01/2026 · 10:00')).toBeInTheDocument();
    expect(started.getByText('Mari')).toBeInTheDocument();
    expect(started.getByText('Llego tarde')).toBeInTheDocument();
    expect(started.getByRole('button', { name: 'Marcar completada' })).toBeInTheDocument();
    expect(started.getByRole('button', { name: 'No presentado' })).toBeInTheDocument();
    expect(started.getByRole('button', { name: 'Cancelar cita' })).toBeInTheDocument();
    // Not started yet: only cancel.
    const upcoming = within(nth(rows, 2));
    expect(upcoming.getByText('Pendiente')).toBeInTheDocument();
    expect(upcoming.queryByRole('button', { name: 'Marcar completada' })).not.toBeInTheDocument();
    expect(upcoming.getByRole('button', { name: 'Cancelar cita' })).toBeInTheDocument();
    // Final: only view.
    const done = within(nth(rows, 3));
    expect(done.getByText('Completada')).toBeInTheDocument();
    expect(done.queryByRole('button', { name: 'Cancelar cita' })).not.toBeInTheDocument();
  });

  it('completes an appointment keeping its internal notes, and refreshes the client', async () => {
    const bodies: unknown[] = [];
    let detailCalls = 0;
    server.use(
      http.get(`${API}/admin/users/cli-1`, () => {
        detailCalls += 1;
        return HttpResponse.json(clientDto());
      }),
      http.patch(`${API}/admin/appointments/apt-1/status`, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(appointmentDto({ status: 'completed' }));
      }),
    );
    withAppointments();
    app = renderApp('/clients/cli-1');
    const user = userEvent.setup();

    const rows = within(await appointmentsTable()).getAllByRole('row');
    const callsBefore = detailCalls;
    await user.click(within(nth(rows, 1)).getByRole('button', { name: 'Marcar completada' }));

    expect(await screen.findByText('Cita marcada como completada.')).toBeInTheDocument();
    expect(bodies).toEqual([
      { status: 'completed', internalNotes: 'Pagó por Bizum', cancellationReason: '' },
    ]);
    await waitFor(() => {
      expect(detailCalls).toBeGreaterThan(callsBefore);
    });
  });

  it('cancels after confirming, keeping the internal notes', async () => {
    const bodies: unknown[] = [];
    server.use(
      userDetail(clientDto()),
      http.patch(`${API}/admin/appointments/apt-2/cancel`, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(appointmentDto({ id: 'apt-2', status: 'cancelled' }));
      }),
    );
    withAppointments();
    app = renderApp('/clients/cli-1');
    const user = userEvent.setup();

    const rows = within(await appointmentsTable()).getAllByRole('row');
    await user.click(within(nth(rows, 2)).getByRole('button', { name: 'Cancelar cita' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancelar cita' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar cita' }));

    expect(await screen.findByText('Cita cancelada correctamente.')).toBeInTheDocument();
    expect(bodies).toEqual([{ internalNotes: 'Pagó por Bizum', cancellationReason: '' }]);
  });

  it('reports a failed no-show by its class', async () => {
    server.use(
      userDetail(clientDto()),
      http.patch(`${API}/admin/appointments/apt-1/status`, () => new HttpResponse('boom\n', { status: 500 })),
    );
    withAppointments();
    app = renderApp('/clients/cli-1');
    const user = userEvent.setup();

    const rows = within(await appointmentsTable()).getAllByRole('row');
    await user.click(within(nth(rows, 1)).getByRole('button', { name: 'No presentado' }));

    expect(await screen.findByText(/^No se pudo actualizar el estado\./)).toBeInTheDocument();
  });

  it('opens an appointment from its row', async () => {
    server.use(userDetail(clientDto()));
    withAppointments();
    app = renderApp('/clients/cli-1');
    const user = userEvent.setup();

    const rows = within(await appointmentsTable()).getAllByRole('row');
    await user.click(within(nth(rows, 3)).getByRole('button', { name: 'Ver' }));
    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/appointments/apt-3');
    });
  });
});
