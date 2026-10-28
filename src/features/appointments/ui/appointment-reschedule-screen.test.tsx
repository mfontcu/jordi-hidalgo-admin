import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { testSession as session } from '@/test/session';
import { API, meAs, STAFF_USER, TOKENS } from '@/test/msw/auth';
import { appointmentDetail, availableDates } from '@/test/msw/appointments';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/render-app';

let app: ReturnType<typeof renderApp> | undefined;

beforeEach(() => {
  session.setTokens(TOKENS);
  server.use(meAs(STAFF_USER), appointmentDetail(), availableDates());
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  session.clear();
});

describe('appointment reschedule', () => {
  it('reloads the slots when the chosen one was taken meanwhile', async () => {
    let taken = false;
    server.use(
      http.get(`${API}/availability/slots`, () =>
        HttpResponse.json([
          { time: '10:00', isAvailable: true },
          { time: '10:30', isAvailable: !taken },
        ]),
      ),
      http.patch(`${API}/admin/appointments/apt-1/reschedule`, () => {
        taken = true;
        return HttpResponse.text('appointment slot unavailable', { status: 409 });
      }),
    );
    app = renderApp('/appointments/apt-1/reschedule');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: '10:30' }));
    await user.click(screen.getByRole('button', { name: 'Guardar nueva fecha' }));

    expect(
      await screen.findByText('No se pudo reprogramar la cita. Esa hora se acaba de ocupar. Elige otra.'),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '10:30' })).toBeDisabled();
    });
    expect(app.router.state.location.pathname).toBe('/appointments/apt-1/reschedule');
  });
});
