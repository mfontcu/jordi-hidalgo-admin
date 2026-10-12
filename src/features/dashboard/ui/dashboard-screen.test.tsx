import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { appointmentsList, appointmentsListResponse } from '@/test/msw/appointments';
import { API, meAs, STAFF_USER, TOKENS } from '@/test/msw/auth';
import { dashboardSummary, dashboardSummaryDto } from '@/test/msw/dashboard';
import { server } from '@/test/msw/server';
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

describe('dashboard', () => {
  it('shows the day summary and the next appointment in salon time', async () => {
    const summary = dashboardSummary();
    server.use(summary.handler);
    app = renderApp('/');

    expect(await screen.findByText('Hoy tienes 4 citas programadas y 2 huecos libres.')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Próxima cita a las 10:00. Puedes revisar la agenda o bloquear nuevas franjas desde aquí.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Próxima 10:00')).toBeInTheDocument();
    expect(screen.getByText('1 pendientes de empezar')).toBeInTheDocument();
    expect(screen.getByText('Corte · Ana Ruiz')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(summary.calls).toEqual(['']);
  });

  it('says there is no next appointment when the summary has none', async () => {
    server.use(dashboardSummary(dashboardSummaryDto({ next_appointment: null })).handler);
    app = renderApp('/');

    expect(await screen.findByText('Sin próxima cita')).toBeInTheDocument();
    expect(screen.getByText('No hay próximas citas')).toBeInTheDocument();
  });

  it('shows the load error and retries', async () => {
    server.use(
      http.get(`${API}/admin/dashboard/summary`, () => HttpResponse.text('internal error', { status: 500 })),
    );
    app = renderApp('/');

    expect(await screen.findByText('No se ha podido cargar el resumen del dashboard.')).toBeInTheDocument();

    server.use(dashboardSummary().handler);
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Hoy tienes 4 citas programadas y 2 huecos libres.')).toBeInTheDocument();
  });

  it('opens the appointments list from a quick action', async () => {
    server.use(dashboardSummary().handler, appointmentsList(() => appointmentsListResponse([])).handler);
    app = renderApp('/');
    const user = userEvent.setup();

    await screen.findByRole('heading', { name: 'Acciones rápidas' });
    const [openAppointments] = screen.getAllByRole('button', { name: 'Abrir' });
    if (!openAppointments) throw new Error('missing quick action');
    await user.click(openAppointments);

    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/appointments');
    });
    expect(await screen.findByRole('heading', { name: 'Citas' })).toBeInTheDocument();
  });
});
