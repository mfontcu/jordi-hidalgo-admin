import type { MockBackend } from './backend';

type AppointmentUser = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  avatarUrl: string;
};

type StoredAppointment = {
  id: string;
  userId: string;
  appointmentStart: string;
  appointmentEnd: string;
  status: string;
  internalNotes: string;
  customerNotes: string;
  cancellationReason: string;
  cancelledBy: string;
  replacesAppointmentId: string;
  rootAppointmentId: string;
  rescheduleChainLength: number;
  service: {
    id: string;
    name: string;
    description: string;
    durationMinutes: number;
    priceCents: number;
  };
  user: AppointmentUser | null;
};

const USERS: Record<string, AppointmentUser> = {
  'c-1': {
    id: 'c-1',
    fullName: 'María Pérez',
    firstName: 'María',
    lastName: 'Pérez',
    phone: '+34600111222',
    email: 'maria@example.com',
    avatarUrl: '',
  },
};

const AVAILABLE_DATES = ['2026-10-12', '2026-10-13'];
const SLOTS_BY_DAY: Record<string, { time: string; isAvailable: boolean }[]> = {
  '2026-10-12': [
    { time: '10:00', isAvailable: true },
    { time: '10:30', isAvailable: true },
    { time: '11:00', isAvailable: true },
  ],
  '2026-10-13': [{ time: '10:00', isAvailable: true }],
};

function dayOfInstant(iso: string): string {
  return iso.slice(0, 10);
}

function matchesSearch(appointment: StoredAppointment, search: string): boolean {
  const q = search.toLowerCase();
  const user = appointment.user;
  if (!user) return false;
  return [user.fullName, user.email, user.phone].some((value) => value.toLowerCase().includes(q));
}

function inDateRange(iso: string, from: string, to: string): boolean {
  const day = dayOfInstant(iso);
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

/**
 * Appointments, availability, and customer push, mocked with state. The list answers `userId`,
 * `status`, `search`, and `dateFrom`/`dateTo`; writes update later reads.
 */
export function mockAppointments(backend: MockBackend) {
  const pushByAppointment = new Map<string, unknown[]>();
  let nextId = 1;

  const appointments: StoredAppointment[] = [
    {
      id: 'apt-1',
      userId: 'c-1',
      appointmentStart: '2026-01-15T09:00:00Z',
      appointmentEnd: '2026-01-15T09:30:00Z',
      status: 'confirmed',
      internalNotes: 'Pagó por Bizum',
      customerNotes: 'Llego tarde',
      cancellationReason: '',
      cancelledBy: '',
      replacesAppointmentId: '',
      rootAppointmentId: '',
      rescheduleChainLength: 1,
      service: {
        id: 'svc-1',
        name: 'Corte',
        description: '',
        durationMinutes: 30,
        priceCents: 1500,
      },
      user: USERS['c-1'] ?? null,
    },
    {
      id: 'apt-2',
      userId: 'c-1',
      appointmentStart: '2099-01-15T09:00:00Z',
      appointmentEnd: '2099-01-15T09:30:00Z',
      status: 'pending',
      internalNotes: '',
      customerNotes: '',
      cancellationReason: '',
      cancelledBy: '',
      replacesAppointmentId: '',
      rootAppointmentId: '',
      rescheduleChainLength: 1,
      service: {
        id: 'svc-2',
        name: 'Barba',
        description: '',
        durationMinutes: 15,
        priceCents: 1000,
      },
      user: USERS['c-1'] ?? null,
    },
    // Shell deep links and the appointments journey use these ids; they stay off c-1 so the
    // client detail list (apt-1 + apt-2) keeps its count.
    {
      id: 'a-1',
      userId: 'c-2',
      appointmentStart: '2026-10-12T08:00:00Z',
      appointmentEnd: '2026-10-12T08:30:00Z',
      status: 'confirmed',
      internalNotes: '',
      customerNotes: '',
      cancellationReason: '',
      cancelledBy: '',
      replacesAppointmentId: '',
      rootAppointmentId: '',
      rescheduleChainLength: 1,
      service: {
        id: 'svc-1',
        name: 'Corte de Pelo',
        description: 'Corte clásico',
        durationMinutes: 30,
        priceCents: 1600,
      },
      user: {
        id: 'c-2',
        fullName: 'Ana López',
        firstName: 'Ana',
        lastName: 'López',
        phone: '+34600999888',
        email: 'ana@example.com',
        avatarUrl: '',
      },
    },
    {
      id: 'apt-today',
      userId: 'c-2',
      appointmentStart: '2026-10-12T08:00:00Z',
      appointmentEnd: '2026-10-12T08:30:00Z',
      status: 'confirmed',
      internalNotes: 'Pagó por Bizum',
      customerNotes: '',
      cancellationReason: '',
      cancelledBy: '',
      replacesAppointmentId: '',
      rootAppointmentId: '',
      rescheduleChainLength: 1,
      service: {
        id: 'svc-1',
        name: 'Corte de Pelo',
        description: 'Corte clásico',
        durationMinutes: 30,
        priceCents: 1600,
      },
      user: {
        id: 'c-2',
        fullName: 'María Pérez',
        firstName: 'María',
        lastName: 'Pérez',
        phone: '+34600111222',
        email: 'maria@example.com',
        avatarUrl: '',
      },
    },
    {
      id: 'apt-pending-today',
      userId: 'c-2',
      appointmentStart: '2026-10-12T10:00:00Z',
      appointmentEnd: '2026-10-12T10:30:00Z',
      status: 'pending',
      internalNotes: '',
      customerNotes: '',
      cancellationReason: '',
      cancelledBy: '',
      replacesAppointmentId: '',
      rootAppointmentId: '',
      rescheduleChainLength: 1,
      service: {
        id: 'svc-1',
        name: 'Corte de Pelo',
        description: '',
        durationMinutes: 30,
        priceCents: 1600,
      },
      user: {
        id: 'c-2',
        fullName: 'María Pérez',
        firstName: 'María',
        lastName: 'Pérez',
        phone: '+34600111222',
        email: 'maria@example.com',
        avatarUrl: '',
      },
    },
  ];

  const summaryOf = (items: StoredAppointment[]) => ({
    totalToday: items.filter((item) => dayOfInstant(item.appointmentStart) === '2026-10-12').length,
    pendingAppointments: items.filter((item) => item.status === 'pending').length,
    completedAppointments: items.filter((item) => item.status === 'completed').length,
    cancelledAppointments: items.filter((item) => item.status === 'cancelled').length,
    noShowAppointments: items.filter((item) => item.status === 'no_show').length,
    rescheduledAppointments: items.filter((item) => item.status === 'rescheduled').length,
    freeSlots: 4,
  });

  backend.on('GET', '/admin/appointments', (request) => {
    const query = new URL(request.url()).searchParams;
    const userId = query.get('userId');
    const status = query.get('status') ?? 'all';
    const search = query.get('search') ?? '';
    const dateFrom = query.get('dateFrom') ?? '';
    const dateTo = query.get('dateTo') ?? '';
    const page = Number(query.get('page') ?? '1');
    const pageSize = Number(query.get('pageSize') ?? '10');

    let items = [...appointments];
    if (userId) items = items.filter((item) => item.userId === userId);
    if (status !== 'all') items = items.filter((item) => item.status === status);
    if (search) items = items.filter((item) => matchesSearch(item, search));
    if (dateFrom || dateTo)
      items = items.filter((item) => inDateRange(item.appointmentStart, dateFrom, dateTo));

    const totalItems = items.length;
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);

    return {
      json: {
        items: pageItems,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
        },
        summary: summaryOf(items),
      },
    };
  });

  backend.on('GET', '/availability/dates', () => ({
    json: AVAILABLE_DATES.map((date) => ({ date })),
  }));

  backend.on('GET', '/availability/slots', (request) => {
    const date = new URL(request.url()).searchParams.get('date') ?? '';
    return { json: SLOTS_BY_DAY[date] ?? [{ time: '10:00', isAvailable: true }] };
  });

  backend.on('POST', '/admin/appointments', (request) => {
    const body = request.postDataJSON() as {
      userId?: string;
      serviceId?: string;
      appointmentStart?: string;
      status?: string;
      customerNotes?: string;
      internalNotes?: string;
    };
    const id = `apt-new-${nextId++}`;
    const user = body.userId ? (USERS[body.userId] ?? null) : null;
    const created: StoredAppointment = {
      id,
      userId: body.userId ?? '',
      appointmentStart: body.appointmentStart ?? '2026-10-12T08:30:00Z',
      appointmentEnd: '2026-10-12T09:00:00Z',
      status: body.status ?? 'confirmed',
      internalNotes: body.internalNotes ?? '',
      customerNotes: body.customerNotes ?? '',
      cancellationReason: '',
      cancelledBy: '',
      replacesAppointmentId: '',
      rootAppointmentId: '',
      rescheduleChainLength: 1,
      service: {
        id: body.serviceId ?? 'svc-1',
        name: 'Corte de Pelo',
        description: '',
        durationMinutes: 30,
        priceCents: 1600,
      },
      user,
    };
    appointments.push(created);
    registerAppointment(backend, created, pushByAppointment);
    return { status: 201, json: created };
  });

  for (const appointment of appointments) {
    registerAppointment(backend, appointment, pushByAppointment);
  }

  return appointments;
}

function registerAppointment(
  backend: MockBackend,
  appointment: StoredAppointment,
  pushByAppointment: Map<string, unknown[]>,
) {
  const id = appointment.id;

  backend.on('GET', `/admin/appointments/${id}`, () => ({ json: appointment }));

  backend.on('PATCH', `/admin/appointments/${id}/status`, (request) => {
    const body = request.postDataJSON() as {
      status: string;
      internalNotes: string;
      cancellationReason?: string;
    };
    Object.assign(appointment, {
      status: body.status,
      internalNotes: body.internalNotes,
      cancellationReason: body.cancellationReason ?? appointment.cancellationReason,
    });
    return { json: appointment };
  });

  backend.on('PATCH', `/admin/appointments/${id}/cancel`, (request) => {
    const body = request.postDataJSON() as { internalNotes: string; cancellationReason?: string };
    Object.assign(appointment, {
      status: 'cancelled',
      internalNotes: body.internalNotes,
      cancellationReason: body.cancellationReason ?? '',
    });
    return { json: appointment };
  });

  backend.on('PATCH', `/admin/appointments/${id}/reschedule`, (request) => {
    const body = request.postDataJSON() as { appointmentStart: string };
    appointment.appointmentStart = body.appointmentStart;
    appointment.appointmentEnd = body.appointmentStart;
    return { json: appointment };
  });

  backend.on('GET', `/admin/appointments/${id}/customer-push-messages`, () => ({
    json: { items: pushByAppointment.get(id) ?? [] },
  }));

  backend.on('POST', `/admin/appointments/${id}/customer-push`, (request) => {
    const body = request.postDataJSON() as { body?: string };
    const message = {
      id: `push-${id}`,
      appointmentId: id,
      recipientUserId: appointment.userId,
      title: 'Hidalgo Junior',
      body: body.body ?? '',
      deliveryStatus: 'sent',
      fcmSuccessCount: 1,
      fcmFailureCount: 0,
      readAt: '',
      createdAt: '2026-10-12T10:00:00Z',
    };
    const history = pushByAppointment.get(id) ?? [];
    history.unshift(message);
    pushByAppointment.set(id, history);
    return { json: message };
  });

  backend.on('GET', `/admin/appointments/${id}/reschedule-chain`, () => ({
    json: { items: [] },
  }));
}
