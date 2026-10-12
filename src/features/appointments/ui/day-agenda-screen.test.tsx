import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { testSession as session } from '@/test/session';
import { meAs, STAFF_USER, TOKENS } from '@/test/msw/auth';
import { appointmentDto, appointmentsList, appointmentsListResponse } from '@/test/msw/appointments';
import {
  blockedSlotDto,
  blockedSlotsList,
  blockedSlotsListResponse,
  liveBusinessHours,
} from '@/test/msw/schedule';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/render-app';
import { http, HttpResponse } from 'msw';
import { API } from '@/test/msw/auth';

let app: ReturnType<typeof renderApp> | undefined;

const SALON_NOW = 1_791_799_200_000; // 2026-10-12 morning in the salon

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(SALON_NOW);
  session.setTokens(TOKENS);
  server.use(meAs(STAFF_USER));
  server.use(...liveBusinessHours().handlers);
  server.use(
    http.get(`${API}/admin/recurring-blocked-slots`, () =>
      HttpResponse.json({
        items: [],
        summary: { active_rules: 0, affected_days: 0, weekly_blocked_ranges: 0 },
      }),
    ),
  );
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  session.clear();
  vi.useRealTimers();
});

describe('day agenda', () => {
  it('shows appointments on the timeline and opens the detail', async () => {
    const list = appointmentsList(() =>
      appointmentsListResponse([
        appointmentDto({
          id: 'apt-agenda',
          appointmentStart: '2026-10-12T08:00:00Z',
          appointmentEnd: '2026-10-12T08:30:00Z',
          status: 'confirmed',
          user: {
            id: 'cli-1',
            fullName: 'María Pérez',
            firstName: 'María',
            lastName: 'Pérez',
            phone: '+34600111222',
            email: 'maria@example.com',
            avatarUrl: '',
          },
        }),
      ]),
    );
    const blocked = blockedSlotsList(() =>
      blockedSlotsListResponse([
        blockedSlotDto({
          id: 'blk-agenda',
          start_at: '2026-10-12T10:00:00Z',
          end_at: '2026-10-12T11:00:00Z',
          reason: 'Formación',
        }),
      ]),
    );
    server.use(list.handler, blocked.handler);
    app = renderApp('/schedule/day-agenda');
    const user = userEvent.setup();

    expect(await screen.findByRole('heading', { level: 1, name: 'Agenda del día' })).toBeInTheDocument();
    expect(await screen.findByText('María Pérez')).toBeInTheDocument();
    expect(screen.getByText('Formación')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /María Pérez/ }));
    await waitFor(() => {
      expect(app?.router.state.location.pathname).toBe('/appointments/apt-agenda');
    });
  });
});
