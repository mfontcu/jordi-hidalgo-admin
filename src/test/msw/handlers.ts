import { http, HttpResponse } from 'msw';
import type { RequestHandler } from 'msw';

import { API } from './auth';

/**
 * Default handlers shared by every test. The dashboard and the slot-watch list load on their own
 * routes, which older tests open without caring about the payload. Tests replace them with
 * `server.use(...)`.
 */
export const handlers: RequestHandler[] = [
  http.get(`${API}/admin/dashboard/summary`, () =>
    HttpResponse.json({
      appointments_today: 0,
      pending_appointments: 0,
      free_slots_today: 0,
      clients_this_week: 0,
      next_appointment: null,
    }),
  ),
  http.get(`${API}/admin/slot-watches`, () => HttpResponse.json({ items: [] })),
];
