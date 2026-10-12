import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { testSession as session } from '@/test/session';
import { API, meAs, STAFF_USER, TOKENS } from '@/test/msw/auth';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/render-app';

let app: ReturnType<typeof renderApp> | undefined;

const SALON_NOW = 1_791_799_200_000;

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(SALON_NOW);
  session.setTokens(TOKENS);
  server.use(meAs(STAFF_USER));
  server.use(
    http.get(`${API}/services`, () =>
      HttpResponse.json([
        {
          id: 'svc-1',
          name: 'Corte de Pelo',
          durationMinutes: 30,
          displayOrder: 1,
          isActive: true,
          categoryCode: 'hair',
          categoryDisplayName: 'Cabello',
        },
      ]),
    ),
    http.get(`${API}/availability/dates`, () => HttpResponse.json([{ date: '2026-10-12' }])),
    http.get(`${API}/availability/slots`, () =>
      HttpResponse.json([
        { time: '10:00', isAvailable: true },
        { time: '10:30', isAvailable: false },
      ]),
    ),
  );
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  session.clear();
  vi.useRealTimers();
});

describe('availability overview', () => {
  it('loads the first public service and opens the form from a free slot', async () => {
    app = renderApp('/schedule/availability');
    const user = userEvent.setup();

    expect(await screen.findByRole('heading', { level: 1, name: 'Disponibilidad' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Servicio' })).toHaveValue('Corte de Pelo');
    });
    expect(screen.getByRole('button', { name: '10:00' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: '10:30' })).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: /10:30/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '10:00' }));
    const dialog = await screen.findByRole('dialog', { name: 'Crear cita' });
    await user.click(within(dialog).getByRole('button', { name: 'Crear cita' }));

    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/appointments/form');
    });
    expect(app.router.state.location.search).toMatchObject({
      prefillServiceId: 'svc-1',
      prefillDate: '2026-10-12',
      prefillTime: '10:00',
    });
  });
});
