import { http, HttpResponse, type JsonBodyType } from 'msw';

import { API } from './auth';

type Slot = { id: string; weekday: number; startTime: string; endTime: string; isActive: boolean };

const slot = (id: string, weekday: number, startTime: string, endTime: string): Slot => ({
  id,
  weekday,
  startTime,
  endTime,
  isActive: true,
});

const LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/** The week of the local backend: Monday off, Tuesday 9–13 and 16–20, Sunday without shifts. */
export function businessHoursDto(
  days: { weekday: number; isActive: boolean; slots: Slot[] }[] = defaultWeek(),
) {
  return {
    summary: { activeDays: 5, activeWeekendDays: 1, usualOpeningTime: '09:00', usualClosingTime: '20:00' },
    days: days.map((day) => ({ ...day, label: LABELS[day.weekday - 1] })),
  };
}

function defaultWeek() {
  return [
    { weekday: 1, isActive: false, slots: [slot('mon-1', 1, '09:00', '15:00')] },
    {
      weekday: 2,
      isActive: true,
      slots: [slot('tue-2', 2, '16:00', '20:00'), slot('tue-1', 2, '09:00', '13:00')],
    },
    { weekday: 3, isActive: true, slots: [slot('wed-1', 3, '09:00', '13:00')] },
    { weekday: 4, isActive: true, slots: [] },
    { weekday: 5, isActive: true, slots: [] },
    { weekday: 6, isActive: true, slots: [slot('sat-1', 6, '09:00', '14:00')] },
    { weekday: 7, isActive: false, slots: [] },
  ];
}

/** The working hours, changed by each write as the backend does; `calls` records the writes. */
export function liveBusinessHours() {
  let week = defaultWeek();
  const calls: { method: string; path: string; body: unknown }[] = [];
  const reply = () => HttpResponse.json(businessHoursDto(week));
  const handlers = [
    http.get(`${API}/admin/business-hours`, reply),
    http.patch(`${API}/admin/business-hours/weekdays/:weekday`, async ({ params, request }) => {
      const body = (await request.json()) as { isActive: boolean };
      calls.push({ method: 'PATCH', path: `weekdays/${String(params.weekday)}`, body });
      week = week.map((day) =>
        day.weekday === Number(params.weekday) ? { ...day, isActive: body.isActive } : day,
      );
      return reply();
    }),
    http.post(`${API}/admin/business-hours/slots`, async ({ request }) => {
      const body = (await request.json()) as Slot;
      calls.push({ method: 'POST', path: 'slots', body });
      week = week.map((day) =>
        day.weekday === body.weekday ? { ...day, slots: [...day.slots, { ...body, id: 'new-slot' }] } : day,
      );
      return HttpResponse.json(businessHoursDto(week), { status: 201 });
    }),
    http.patch(`${API}/admin/business-hours/slots/:id`, async ({ params, request }) => {
      const body = (await request.json()) as Slot;
      calls.push({ method: 'PATCH', path: `slots/${String(params.id)}`, body });
      week = week.map((day) => ({
        ...day,
        slots: day.slots.map((item) => (item.id === params.id ? { ...item, ...body } : item)),
      }));
      return reply();
    }),
    http.delete(`${API}/admin/business-hours/slots/:id`, ({ params }) => {
      calls.push({ method: 'DELETE', path: `slots/${String(params.id)}`, body: null });
      week = week.map((day) => ({ ...day, slots: day.slots.filter((item) => item.id !== params.id) }));
      return reply();
    }),
  ];
  return { handlers, calls };
}

export function blockedSlotDto(overrides: Record<string, unknown> = {}) {
  return {
    id: 'blk-1',
    start_at: '2026-10-13T10:14:00Z',
    end_at: '2026-10-13T12:14:00Z',
    reason: 'Formación',
    show_on_public_site: false,
    created_at: '2026-10-11T10:14:58Z',
    updated_at: '2026-10-11T10:14:58Z',
    ...overrides,
  };
}

export function blockedSlotsListResponse(
  items: unknown[],
  summary: Partial<{ active_blocks: number; full_day_closures: number; partial_blocked_ranges: number }> = {},
) {
  return {
    summary: {
      active_blocks: items.length,
      full_day_closures: 0,
      partial_blocked_ranges: items.length,
      ...summary,
    },
    items,
  };
}

/** `GET /admin/blocked-slots`, recording each request's query. */
export function blockedSlotsList(
  reply: (query: URLSearchParams) => JsonBodyType = () => blockedSlotsListResponse([]),
) {
  const queries: URLSearchParams[] = [];
  const handler = http.get(`${API}/admin/blocked-slots`, ({ request }) => {
    const query = new URL(request.url).searchParams;
    queries.push(query);
    return HttpResponse.json(reply(query));
  });
  return { handler, queries };
}

export function ruleDto(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rule-1',
    weekday: 2,
    start_time: '11:00',
    end_time: '11:30',
    reason: 'Descanso fijo de media mañana',
    is_active: true,
    created_at: '2026-06-15T08:11:10Z',
    updated_at: '2026-06-27T09:07:45Z',
    ...overrides,
  };
}

export function rulesListResponse(items: unknown[]) {
  return {
    summary: { active_rules: items.length, affected_days: items.length, weekly_blocked_ranges: items.length },
    items,
  };
}

export function rulesList(reply: (query: URLSearchParams) => JsonBodyType = () => rulesListResponse([])) {
  const queries: URLSearchParams[] = [];
  const handler = http.get(`${API}/admin/recurring-blocked-slots`, ({ request }) => {
    const query = new URL(request.url).searchParams;
    queries.push(query);
    return HttpResponse.json(reply(query));
  });
  return { handler, queries };
}

/** `GET /admin/blocked-slots/{id}`. */
export function blockedSlotDetail(slot = blockedSlotDto()) {
  return http.get(`${API}/admin/blocked-slots/${slot.id}`, () => HttpResponse.json(slot));
}

/** `GET /admin/recurring-blocked-slots/{id}`. */
export function ruleDetail(rule = ruleDto()) {
  return http.get(`${API}/admin/recurring-blocked-slots/${rule.id}`, () => HttpResponse.json(rule));
}

export function ruleExceptionDto(overrides: Record<string, unknown> = {}) {
  return {
    id: 'exc-1',
    recurring_blocked_slot_id: 'rule-1',
    date: '2026-10-20',
    action: 'unblock',
    reason: 'Puente',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z',
    ...overrides,
  };
}

/** `GET /admin/recurring-blocked-slots/{id}/exceptions`. */
export function ruleExceptions(id = 'rule-1', items: unknown[] = []) {
  return http.get(`${API}/admin/recurring-blocked-slots/${id}/exceptions`, () => HttpResponse.json(items));
}
