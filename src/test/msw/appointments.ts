import { http, HttpResponse } from 'msw';

import { API } from './auth';

export function appointmentDto(overrides: Record<string, unknown> = {}) {
  return {
    id: 'apt-1',
    userId: 'cli-1',
    appointmentStart: '2026-10-01T08:00:00Z',
    appointmentEnd: '2026-10-01T08:30:00Z',
    status: 'confirmed',
    customerNotes: '',
    internalNotes: 'Pagó por Bizum',
    service: { id: 'svc-1', name: 'Corte', durationMinutes: 30, priceCents: 1500 },
    user: { id: 'cli-1', fullName: 'María Pérez', avatarUrl: '' },
    ...overrides,
  };
}

export function appointmentsListResponse(items: unknown[], { page = 1, totalItems = items.length } = {}) {
  return {
    items,
    pagination: { page, pageSize: 10, totalItems, totalPages: Math.ceil(totalItems / 10) },
    summary: {},
  };
}

/** `GET /admin/appointments`, recording each request's query. */
export function appointmentsList(
  reply: (query: URLSearchParams) => ReturnType<typeof appointmentsListResponse> = () =>
    appointmentsListResponse([]),
) {
  const queries: URLSearchParams[] = [];
  const handler = http.get(`${API}/admin/appointments`, ({ request }) => {
    const query = new URL(request.url).searchParams;
    queries.push(query);
    return HttpResponse.json(reply(query));
  });
  return { handler, queries };
}
