import { http, HttpResponse } from 'msw';
import type { RequestHandler } from 'msw';

import { API } from './auth';

/**
 * Default handlers shared by every test. The dashboard and the slot-watch list load on their own
 * routes, which older tests open without caring about the payload. Tests replace them with
 * `server.use(...)`.
 */
export const handlers: RequestHandler[] = [
  http.get(`${API}/admin/activity`, () => HttpResponse.json({ items: [] })),
  http.post(`${API}/admin/activity/read`, () => new HttpResponse(null, { status: 204 })),
  http.get(`${API}/admin/activity/stream`, () => {
    const stream = new ReadableStream({
      start() {
        // Stays open until the test aborts the request, so the shell does not reconnect in a loop.
      },
    });
    return new HttpResponse(stream, { headers: { 'Content-Type': 'text/event-stream' } });
  }),
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
