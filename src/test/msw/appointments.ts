import { http, HttpResponse } from 'msw';

import { API } from './auth';

export function appointmentDto(overrides: Record<string, unknown> = {}) {
  return {
    id: 'apt-1',
    userId: 'cli-1',
    appointmentStart: '2026-10-12T08:00:00Z',
    appointmentEnd: '2026-10-12T08:30:00Z',
    status: 'confirmed',
    customerNotes: '',
    internalNotes: 'Pagó por Bizum',
    cancellationReason: '',
    cancelledBy: '',
    replacesAppointmentId: '',
    rootAppointmentId: '',
    rescheduleChainLength: 1,
    service: {
      id: 'svc-1',
      name: 'Corte',
      description: 'Corte de pelo',
      durationMinutes: 30,
      priceCents: 1500,
    },
    user: {
      id: 'cli-1',
      fullName: 'María Pérez',
      firstName: 'María',
      lastName: 'Pérez',
      phone: '+34600111222',
      email: 'maria@example.com',
      avatarUrl: '',
    },
    ...overrides,
  };
}

export function appointmentsSummary(overrides: Record<string, number> = {}) {
  return {
    totalToday: 3,
    pendingAppointments: 1,
    completedAppointments: 1,
    cancelledAppointments: 0,
    noShowAppointments: 0,
    rescheduledAppointments: 0,
    freeSlots: 4,
    ...overrides,
  };
}

export function appointmentsListResponse(items: unknown[], { page = 1, totalItems = items.length } = {}) {
  return {
    items,
    pagination: { page, pageSize: 10, totalItems, totalPages: Math.ceil(totalItems / 10) || 1 },
    summary: appointmentsSummary({ totalToday: totalItems }),
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

export function appointmentDetail(dto = appointmentDto()) {
  return http.get(`${API}/admin/appointments/:id`, () => HttpResponse.json(dto));
}

export function appointmentCreate(
  reply: (body: unknown) => Record<string, unknown> = () => appointmentDto({ id: 'apt-new' }),
) {
  const bodies: unknown[] = [];
  const handler = http.post(`${API}/admin/appointments`, async ({ request }) => {
    const body: unknown = await request.json();
    bodies.push(body);
    return HttpResponse.json(reply(body));
  });
  return { handler, bodies };
}

export function appointmentReschedule(id = 'apt-1') {
  const bodies: unknown[] = [];
  const handler = http.patch(`${API}/admin/appointments/${id}/reschedule`, async ({ request }) => {
    const body: unknown = await request.json();
    bodies.push(body);
    return HttpResponse.json(appointmentDto({ id, ...(body as object) }));
  });
  return { handler, bodies };
}

/** `PATCH /admin/appointments/{id}/status`, answering `status` with `body`; records the bodies sent. */
export function appointmentStatusChange(id = 'apt-1', status = 200, body: unknown = appointmentDto()) {
  const bodies: unknown[] = [];
  const handler = http.patch(`${API}/admin/appointments/${id}/status`, async ({ request }) => {
    bodies.push(await request.json());
    return HttpResponse.json(body as Record<string, unknown>, { status });
  });
  return { handler, bodies };
}

export function customerPushMessages(items: unknown[] = []) {
  return http.get(`${API}/admin/appointments/:id/customer-push-messages`, () => HttpResponse.json({ items }));
}

export function customerPushSend(id = 'apt-1') {
  const bodies: unknown[] = [];
  const handler = http.post(`${API}/admin/appointments/${id}/customer-push`, async ({ request }) => {
    const body: unknown = await request.json();
    bodies.push(body);
    return HttpResponse.json({
      id: 'push-1',
      appointmentId: id,
      recipientUserId: 'cli-1',
      title: 'Hidalgo Junior',
      body: (body as { body?: string }).body ?? '',
      deliveryStatus: 'sent',
      fcmSuccessCount: 1,
      fcmFailureCount: 0,
      readAt: '',
      createdAt: '2026-10-12T10:00:00Z',
    });
  });
  return { handler, bodies };
}

export function availableDates(dates: string[] = ['2026-10-12', '2026-10-13']) {
  return http.get(`${API}/availability/dates`, () => HttpResponse.json(dates.map((date) => ({ date }))));
}

export function availableSlots(
  slots: { time: string; isAvailable: boolean }[] = [
    { time: '10:00', isAvailable: true },
    { time: '10:30', isAvailable: true },
  ],
) {
  return http.get(`${API}/availability/slots`, () => HttpResponse.json(slots));
}
