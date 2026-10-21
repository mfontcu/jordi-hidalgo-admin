import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { testSession as session } from '@/test/session';
import { API, meAs, STAFF_USER, TOKENS } from '@/test/msw/auth';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/render-app';

import { setActivityConnection, type ActivityConnection, type ActivityStreamEvent } from '..';

let app: ReturnType<typeof renderApp> | undefined;

function fakeStream() {
  let listener: ((event: ActivityStreamEvent) => void) | null = null;
  const queued: ActivityStreamEvent[] = [];
  const connection: ActivityConnection = {
    open({ signal, onEvent }) {
      listener = onEvent;
      for (const event of queued) onEvent(event);
      queued.length = 0;
      return new Promise((resolve) => {
        signal.addEventListener('abort', () => {
          resolve();
        });
      });
    },
  };
  return {
    connection,
    emit(event: ActivityStreamEvent) {
      if (listener) listener(event);
      else queued.push(event);
    },
  };
}

const summary = {
  appointmentsToday: 0,
  pendingAppointments: 0,
  freeSlotsToday: 0,
  clientsThisWeek: 0,
  nextAppointment: null,
};

function activity(id: number, kind: string, announce: boolean, replay: boolean): ActivityStreamEvent {
  return {
    type: 'activity',
    replay,
    row: {
      id,
      kind,
      announce,
      payload: {
        customerName: 'Ana Ruiz',
        appointmentPublicId: 'apt-1',
        serviceId: 'svc-1',
        nextStart: '2026-10-21T08:30:00Z',
      },
    },
  };
}

beforeEach(() => {
  HTMLElement.prototype.setPointerCapture = () => undefined;
  HTMLElement.prototype.releasePointerCapture = () => undefined;
  session.setTokens(TOKENS);
  server.use(meAs(STAFF_USER));
});

afterEach(() => {
  setActivityConnection(null);
  app?.unmount();
  app = undefined;
  session.clear();
});

describe('activity stream in the shell', () => {
  it('refreshes the open screen and keeps an announced row, and skips a silent one', async () => {
    const user = userEvent.setup();
    const stream = fakeStream();
    setActivityConnection(stream.connection);
    let summaries = 0;
    server.use(
      http.get(`${API}/admin/dashboard/summary`, () => {
        summaries += 1;
        return HttpResponse.json(summary);
      }),
    );

    app = renderApp('/');
    app.queryClient.setQueryData(['services', 'detail', 'svc-1'], { id: 'svc-1', name: 'Corte' });
    await screen.findByRole('heading', { name: 'Dashboard' });
    await waitFor(() => {
      expect(app?.queryClient.getQueryData(['activity', 'unread'])).toEqual([]);
    });
    const loaded = summaries;

    stream.emit(activity(8, 'appointment.booked', true, false));

    await waitFor(() => {
      expect(summaries).toBeGreaterThan(loaded);
    });
    const bell = screen.getByRole('button', { name: 'Avisos, 1 sin leer' });
    await user.click(bell);
    expect(
      screen.getByRole('button', { name: /Ana Ruiz ha reservado Corte .+10:30/ }),
    ).toBeInTheDocument();

    const afterBooked = summaries;
    stream.emit(activity(9, 'appointment.created', false, false));
    await waitFor(() => {
      expect(summaries).toBeGreaterThan(afterBooked);
    });
    expect(screen.getByRole('button', { name: 'Avisos, 1 sin leer' })).toBeInTheDocument();
    expect(screen.queryByText(/ha creado|appointment.created/)).not.toBeInTheDocument();
  });

  it('does not toast a reconnect burst, and does toast a later visible event', async () => {
    const user = userEvent.setup();
    const stream = fakeStream();
    setActivityConnection(stream.connection);
    const reads: unknown[] = [];
    server.use(
      http.post(`${API}/admin/activity/read`, async ({ request }) => {
        reads.push(await request.json());
        return new HttpResponse(null, { status: 204 });
      }),
      http.get(`${API}/admin/appointments/:appointmentID/customer-push-messages`, () =>
        HttpResponse.json({ items: [] }),
      ),
      http.get(`${API}/admin/appointments/:appointmentID/reschedule-chain`, () =>
        HttpResponse.json({ items: [] }),
      ),
      http.get(
        `${API}/admin/appointments/:appointmentID`,
        () => new HttpResponse('not found\n', { status: 404 }),
      ),
    );
    app = renderApp('/');
    await screen.findByRole('heading', { name: 'Dashboard' });
    await waitFor(() => {
      expect(app?.queryClient.getQueryData(['activity', 'unread'])).toEqual([]);
    });

    stream.emit(activity(3, 'appointment.booked', true, true));
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(screen.queryByText(/Ana Ruiz ha reservado .+10:30/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Avisos$/ })).toBeInTheDocument();

    stream.emit(activity(4, 'appointment.booked', true, false));
    const notice = await screen.findByText(
      (_, element) =>
        element?.tagName === 'SPAN' &&
        element.classList.contains('min-w-0') &&
        /Ana Ruiz ha reservado .+10:30/.test(element.textContent ?? ''),
    );
    const toast = notice.closest('[data-sonner-toast]');
    expect(toast).not.toBeNull();
    await user.click(within(toast as HTMLElement).getByRole('button', { name: 'Abrir aviso' }));
    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/appointments/apt-1');
    });
    expect(reads).toEqual([]);
  });

  it('marks one row when it is opened, the selection, or every row', async () => {
    const user = userEvent.setup();
    const stream = fakeStream();
    setActivityConnection(stream.connection);
    const reads: unknown[] = [];
    server.use(
      http.post(`${API}/admin/activity/read`, async ({ request }) => {
        reads.push(await request.json());
        return new HttpResponse(null, { status: 204 });
      }),
      http.get(`${API}/admin/appointments/:appointmentID/customer-push-messages`, () =>
        HttpResponse.json({ items: [] }),
      ),
      http.get(`${API}/admin/appointments/:appointmentID/reschedule-chain`, () =>
        HttpResponse.json({ items: [] }),
      ),
      http.get(
        `${API}/admin/appointments/:appointmentID`,
        () => new HttpResponse('not found\n', { status: 404 }),
      ),
    );
    app = renderApp('/');
    await screen.findByRole('heading', { name: 'Dashboard' });
    await waitFor(() => {
      expect(app?.queryClient.getQueryData(['activity', 'unread'])).toEqual([]);
    });

    stream.emit(activity(8, 'appointment.booked', true, false));
    stream.emit({
      type: 'activity',
      replay: false,
      row: {
        id: 11,
        kind: 'client.registered',
        announce: true,
        payload: { customerName: 'Luis Costa', userId: 'user-9' },
      },
    });
    await screen.findByRole('button', { name: 'Avisos, 2 sin leer' });
    await user.click(screen.getByRole('button', { name: 'Avisos, 2 sin leer' }));

    const list = screen.getByRole('list', { name: 'Avisos' });
    await user.click(within(list).getByRole('checkbox', { name: 'Seleccionar el aviso de Luis Costa' }));
    await user.click(screen.getByRole('button', { name: 'Marcar seleccionados' }));
    await waitFor(() => {
      expect(reads).toContainEqual({ ids: [11] });
    });

    await user.click(within(list).getByRole('button', { name: /Ana Ruiz ha reservado .+10:30/ }));
    await waitFor(() => {
      expect(reads).toContainEqual({ ids: [8] });
    });
    expect(app.router.state.location.pathname).toBe('/appointments/apt-1');

    stream.emit(activity(12, 'appointment.cancelled', true, false));
    await screen.findByRole('button', { name: 'Avisos, 1 sin leer' });
    await user.click(screen.getByRole('button', { name: 'Avisos, 1 sin leer' }));
    await user.click(screen.getByRole('button', { name: 'Marcar todos' }));
    await waitFor(() => {
      expect(reads).toContainEqual({ all: true });
    });
    expect(screen.getByText('No hay avisos sin leer')).toBeInTheDocument();
  });
});
