import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { businessToday, instantAt } from '@/shared/lib/business-time';
import { appointmentDto, appointmentsList, appointmentsListResponse } from '@/test/msw/appointments';
import { API, meAs, STAFF_USER, TOKENS } from '@/test/msw/auth';
import { blockedSlotDetail, blockedSlotDto, blockedSlotsList } from '@/test/msw/schedule';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/render-app';
import { testSession as session } from '@/test/session';

let app: ReturnType<typeof renderApp> | undefined;

beforeEach(() => {
  session.setTokens(TOKENS);
  server.use(meAs(STAFF_USER), blockedSlotsList().handler);
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  session.clear();
});

const path = () => app?.router.state.location.pathname;

/** `POST` and `PUT /admin/blocked-slots`, recording the bodies; they answer with the saved block. */
function saveHandlers() {
  const bodies: { method: string; body: Record<string, unknown> }[] = [];
  server.use(
    http.post(`${API}/admin/blocked-slots`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      bodies.push({ method: 'POST', body });
      return HttpResponse.json(blockedSlotDto({ ...body, id: 'blk-new' }), { status: 201 });
    }),
    http.put(`${API}/admin/blocked-slots/blk-1`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      bodies.push({ method: 'PUT', body });
      return HttpResponse.json(blockedSlotDto(body));
    }),
    blockedSlotDetail(blockedSlotDto({ id: 'blk-new' })),
  );
  return bodies;
}

/** Opens a time field's picker, types the time in input mode (a mouse's default), and confirms. */
async function pickTime(
  user: ReturnType<typeof userEvent.setup>,
  field: string,
  hour: string,
  minute: string,
) {
  await user.click(screen.getByRole('button', { name: field }));
  const dialog = await screen.findByRole('dialog');
  await user.clear(within(dialog).getByLabelText('Hora'));
  await user.type(within(dialog).getByLabelText('Hora'), hour);
  await user.clear(within(dialog).getByLabelText('Minuto'));
  await user.type(within(dialog).getByLabelText('Minuto'), minute);
  await user.click(within(dialog).getByRole('button', { name: 'Seleccionar' }));
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
}

describe('blocked slot form', () => {
  it('validates on submit and sends nothing', async () => {
    const bodies = saveHandlers();
    app = renderApp('/schedule/blocked-slots/form');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Crear bloqueo' }));

    expect(await screen.findByText('Introduce una fecha')).toBeInTheDocument();
    expect(screen.getAllByText('Introduce la hora')).toHaveLength(2);
    expect(screen.getByText('Introduce un motivo')).toBeInTheDocument();

    // A full day needs no hours.
    await user.click(screen.getByRole('switch', { name: 'Bloquear día completo' }));
    await user.click(screen.getByRole('button', { name: 'Crear bloqueo' }));
    await waitFor(() => {
      expect(screen.queryByText('Introduce la hora')).not.toBeInTheDocument();
    });
    expect(bodies).toEqual([]);
  });

  it('creates a block over appointments and cancels them with its reason', async () => {
    const bodies = saveHandlers();
    const today = businessToday();
    const covered = appointmentDto({
      id: 'apt-in',
      appointmentStart: instantAt(today, '10:30'),
      appointmentEnd: instantAt(today, '11:00'),
      internalNotes: 'Pagó por Bizum',
    });
    const outside = appointmentDto({
      id: 'apt-out',
      appointmentStart: instantAt(today, '13:00'),
      appointmentEnd: instantAt(today, '13:30'),
      user: { id: 'cli-2', fullName: 'Pau Soler', avatarUrl: '' },
    });
    const appointments = appointmentsList(() => appointmentsListResponse([covered, outside]));
    const cancellations: { id: string; body: unknown }[] = [];
    server.use(
      appointments.handler,
      http.patch(`${API}/admin/appointments/:id/cancel`, async ({ params, request }) => {
        cancellations.push({ id: String(params.id), body: await request.json() });
        return HttpResponse.json(appointmentDto({ id: params.id, status: 'cancelled' }));
      }),
    );
    app = renderApp('/schedule/blocked-slots/form');
    const user = userEvent.setup();

    // The calendar opens on today.
    await user.click(await screen.findByRole('button', { name: 'Fecha' }));
    await user.click(await screen.findByRole('button', { name: 'Aplicar fecha' }));
    await pickTime(user, 'Inicio', '10', '00');
    await pickTime(user, 'Fin', '12', '00');
    await user.type(screen.getByLabelText('Motivo'), '  Formación  ');
    await user.click(screen.getByRole('button', { name: 'Crear bloqueo' }));

    const dialog = await screen.findByRole('dialog', { name: 'Citas afectadas por el bloqueo' });
    expect(within(dialog).getByText(/María Pérez/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/Pau Soler/)).not.toBeInTheDocument();
    expect(bodies).toEqual([]);
    await user.click(within(dialog).getByRole('checkbox', { name: 'Cancelar las citas afectadas' }));
    await user.click(within(dialog).getByRole('button', { name: 'Crear bloqueo' }));

    await waitFor(() => {
      expect(path()).toBe('/schedule/blocked-slots/blk-new');
    });
    expect(bodies).toEqual([
      {
        method: 'POST',
        body: {
          start_at: instantAt(today, '10:00'),
          end_at: instantAt(today, '12:00'),
          reason: 'Formación',
          show_on_public_site: true,
        },
      },
    ]);
    expect(cancellations).toEqual([
      { id: 'apt-in', body: { internalNotes: 'Pagó por Bizum', cancellationReason: 'Formación' } },
    ]);
    // The check reads every appointment of the block's salon days.
    expect(appointments.queries[0]?.get('status')).toBe('all');
    expect(await screen.findByText('Bloqueo creado correctamente.')).toBeInTheDocument();
    expect(await screen.findByText('Se canceló 1 cita afectada.')).toBeInTheDocument();
  });

  it('goes back to the form, unsaved, when the conflicts dialog is cancelled', async () => {
    const bodies = saveHandlers();
    const today = businessToday();
    server.use(
      appointmentsList(() =>
        appointmentsListResponse([
          appointmentDto({
            appointmentStart: instantAt(today, '10:30'),
            appointmentEnd: instantAt(today, '11:00'),
          }),
        ]),
      ).handler,
    );
    app = renderApp('/schedule/blocked-slots/form');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Fecha' }));
    await user.click(await screen.findByRole('button', { name: 'Aplicar fecha' }));
    await user.click(screen.getByRole('switch', { name: 'Bloquear día completo' }));
    await user.type(screen.getByLabelText('Motivo'), 'Cierre');
    await user.click(screen.getByRole('button', { name: 'Crear bloqueo' }));
    const dialog = await screen.findByRole('dialog', { name: 'Citas afectadas por el bloqueo' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(path()).toBe('/schedule/blocked-slots/form');
    expect(bodies).toEqual([]);
  });

  it('saves an edit that keeps the range without checking the agenda', async () => {
    const bodies = saveHandlers();
    const appointments = appointmentsList();
    server.use(appointments.handler, blockedSlotDetail());
    app = renderApp('/schedule/blocked-slots/blk-1/form');
    const user = userEvent.setup();

    const reason = await screen.findByLabelText('Motivo');
    expect(screen.getByRole('button', { name: 'Inicio' })).toHaveTextContent('12:14');
    await user.clear(reason);
    await user.type(reason, 'Formación interna');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(bodies).toHaveLength(1);
    });
    expect(bodies[0]).toEqual({
      method: 'PUT',
      body: {
        start_at: '2026-10-13T10:14:00.000Z',
        end_at: '2026-10-13T12:14:00.000Z',
        reason: 'Formación interna',
        show_on_public_site: false,
      },
    });
    expect(appointments.queries).toEqual([]);
    expect(await screen.findByText('Bloqueo actualizado correctamente.')).toBeInTheDocument();
  });

  it('checks the agenda again when an edit moves the block', async () => {
    const bodies = saveHandlers();
    const appointments = appointmentsList();
    server.use(appointments.handler, blockedSlotDetail());
    app = renderApp('/schedule/blocked-slots/blk-1/form');
    const user = userEvent.setup();

    await screen.findByLabelText('Motivo');
    await pickTime(user, 'Fin', '15', '00');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(bodies).toHaveLength(1);
    });
    expect(appointments.queries).toHaveLength(1);
    expect(bodies[0]?.body.end_at).toBe('2026-10-13T13:00:00.000Z');
  });
});
