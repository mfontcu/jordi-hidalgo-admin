import { http, HttpResponse } from 'msw';

import { API } from './auth';

export function slotWatchDto(overrides: Record<string, unknown> = {}) {
  return {
    id: 'w-1',
    userId: 'cli-1',
    userDisplayName: 'Ana Ruiz',
    userEmail: 'ana@example.com',
    serviceId: 'svc-1',
    serviceName: 'Corte',
    status: 'active',
    dates: ['2026-10-12', '2026-10-13'],
    timeFrom: '10:00',
    timeTo: '14:00',
    notifyCount: 1,
    expiresAt: '2026-10-20T10:00:00Z',
    createdAt: '2026-10-01T08:00:00Z',
    ...overrides,
  };
}

export const SLOT_WATCHES = [
  slotWatchDto(),
  slotWatchDto({
    id: 'w-2',
    userId: 'cli-2',
    userDisplayName: 'Luis Gómez',
    userEmail: 'luis@example.com',
    serviceId: 'svc-2',
    serviceName: 'Barba',
    status: 'held',
    dates: ['2026-10-14'],
    timeFrom: '',
    timeTo: '',
    linkedAppointmentId: 'apt-1',
    heldSlotStart: '2026-10-14T08:00:00Z',
    holdExpiresAt: '2026-10-12T08:12:00Z',
    notifyCount: 2,
  }),
];

/** `GET /admin/slot-watches`, recording each request's query. */
export function slotWatchesList(items = SLOT_WATCHES) {
  const queries: URLSearchParams[] = [];
  const handler = http.get(`${API}/admin/slot-watches`, ({ request }) => {
    queries.push(new URL(request.url).searchParams);
    return HttpResponse.json({ items });
  });
  return { handler, queries };
}

export function slotWatchCancel(watchId = 'w-1') {
  const calls: string[] = [];
  const handler = http.post(`${API}/admin/slot-watches/${watchId}/cancel`, () => {
    calls.push(watchId);
    return HttpResponse.json(slotWatchDto({ id: watchId, status: 'cancelled' }));
  });
  return { handler, calls };
}
