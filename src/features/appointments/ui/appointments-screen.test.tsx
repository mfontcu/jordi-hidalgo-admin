import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { testSession as session } from '@/test/session';
import { API, meAs, STAFF_USER, TOKENS } from '@/test/msw/auth';
import {
  appointmentDto,
  appointmentsList,
  appointmentsListResponse,
  appointmentsSummary,
} from '@/test/msw/appointments';
import { server } from '@/test/msw/server';
import { nth } from '@/test/nth';
import { renderApp } from '@/test/render-app';

let app: ReturnType<typeof renderApp> | undefined;

// 2026-10-12T10:00:00.000Z — salon morning so complete/no-show actions are allowed.
const SALON_NOW = 1_791_799_200_000;

const TODAY_STARTED = appointmentDto({
  appointmentStart: '2026-10-12T08:00:00Z',
  status: 'confirmed',
});
const TODAY_PENDING = appointmentDto({
  id: 'apt-2',
  appointmentStart: '2026-10-12T14:00:00Z',
  status: 'pending',
  internalNotes: '',
});

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(SALON_NOW);
  session.setTokens(TOKENS);
  server.use(meAs(STAFF_USER));
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  session.clear();
  vi.useRealTimers();
});

const table = () => screen.findByRole('table', { name: 'Citas' });
const search = () => app?.router.state.location.search;

function withList(items: unknown[] = [TODAY_STARTED, TODAY_PENDING]) {
  const list = appointmentsList(() =>
    appointmentsListResponse(items, {
      totalItems: items.length,
    }),
  );
  server.use(list.handler);
  return list;
}

describe('appointments list', () => {
  it('shows the summary and a row per appointment', async () => {
    const list = appointmentsList(() => ({
      items: [TODAY_STARTED, TODAY_PENDING],
      pagination: { page: 1, pageSize: 10, totalItems: 2, totalPages: 1 },
      summary: appointmentsSummary({
        totalToday: 2,
        pendingAppointments: 1,
        completedAppointments: 0,
        freeSlots: 4,
      }),
    }));
    server.use(list.handler);
    app = renderApp('/appointments');

    const rows = within(await table()).getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(within(nth(rows, 1)).getByText('María Pérez')).toBeInTheDocument();
    expect(within(nth(rows, 1)).getByText('12/10/2026 · 10:00')).toBeInTheDocument();
    expect(within(nth(rows, 1)).getByText('Corte')).toBeInTheDocument();
    expect(within(nth(rows, 2)).getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('stores a status filter in the URL', async () => {
    const list = withList();
    app = renderApp('/appointments');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Todas las citas' }));
    await user.click(await screen.findByRole('radio', { name: 'Pendientes' }));
    await user.click(screen.getByRole('button', { name: 'Aplicar' }));
    await waitFor(() => {
      expect(search()).toEqual({ status: 'pending' });
    });
    await waitFor(() => {
      expect(list.queries.at(-1)?.get('status')).toBe('pending');
    });
  });

  it('opens an appointment from its row', async () => {
    withList();
    server.use(http.get(`${API}/admin/appointments/apt-1`, () => HttpResponse.json(TODAY_STARTED)));
    app = renderApp('/appointments');
    const user = userEvent.setup();

    const rows = within(await table()).getAllByRole('row');
    await user.click(within(nth(rows, 1)).getByRole('button', { name: 'Ver' }));
    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/appointments/apt-1');
    });
  });

  it('explains that today hides other days, and opens this week', async () => {
    withList([]);
    app = renderApp('/appointments');
    const user = userEvent.setup();

    expect(await screen.findByText('No hay citas para hoy')).toBeInTheDocument();
    expect(
      screen.getByText(
        'El listado abre en el día de hoy, así que las citas de otros días no aparecen. Cambia la fecha para verlas.',
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ver esta semana' }));
    await waitFor(() => {
      expect(search()).toEqual({ date: 'thisWeek' });
    });
  });

  it('keeps the generic empty state when a filter other than today hides the rows', async () => {
    withList([]);
    app = renderApp('/appointments?status=pending');

    expect(await screen.findByText('No hay citas para este día')).toBeInTheDocument();
    expect(screen.queryByText('No hay citas para hoy')).not.toBeInTheDocument();
  });

  it('completes from the list keeping internal notes', async () => {
    const bodies: unknown[] = [];
    withList();
    server.use(
      http.patch(`${API}/admin/appointments/apt-1/status`, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(appointmentDto({ status: 'completed' }));
      }),
    );
    app = renderApp('/appointments');
    const user = userEvent.setup();

    const rows = within(await table()).getAllByRole('row');
    await user.click(within(nth(rows, 1)).getByRole('button', { name: 'Marcar completada' }));
    const dialog = await screen.findByRole('dialog', { name: 'Marcar como completada' });
    await user.click(within(dialog).getByRole('button', { name: 'Marcar completada' }));

    expect(await screen.findByText('Cita marcada como completada.')).toBeInTheDocument();
    expect(bodies).toEqual([
      { status: 'completed', internalNotes: 'Pagó por Bizum', cancellationReason: '' },
    ]);
  });
});
