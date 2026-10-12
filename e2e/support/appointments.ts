import type { MockBackend } from './backend';

type StoredAppointment = {
  id: string;
  userId: string;
  appointmentStart: string;
  status: string;
  internalNotes: string;
  customerNotes: string;
  serviceName: string;
};

/**
 * The appointments of `/admin/appointments`, mocked with state: the list answers the `userId` it
 * is asked for, and status changes and cancellations change what it returns.
 */
export function mockAppointments(backend: MockBackend) {
  const appointments: StoredAppointment[] = [
    {
      id: 'apt-1',
      userId: 'c-1',
      appointmentStart: '2026-01-15T09:00:00Z',
      status: 'confirmed',
      internalNotes: 'Pagó por Bizum',
      customerNotes: 'Llego tarde',
      serviceName: 'Corte',
    },
    {
      id: 'apt-2',
      userId: 'c-1',
      appointmentStart: '2099-01-15T09:00:00Z',
      status: 'pending',
      internalNotes: '',
      customerNotes: '',
      serviceName: 'Barba',
    },
  ];

  const dto = (appointment: StoredAppointment) => ({
    ...appointment,
    appointmentEnd: appointment.appointmentStart,
    service: { id: 'svc-1', name: appointment.serviceName, durationMinutes: 30, priceCents: 1500 },
    user: { id: appointment.userId, fullName: '', avatarUrl: '' },
  });

  backend.on('GET', '/admin/appointments', (request) => {
    const userId = new URL(request.url()).searchParams.get('userId');
    const items = appointments.filter((appointment) => !userId || appointment.userId === userId).map(dto);
    return {
      json: {
        items,
        pagination: { page: 1, pageSize: 10, totalItems: items.length, totalPages: 1 },
        summary: {},
      },
    };
  });

  for (const appointment of appointments) {
    backend.on('PATCH', `/admin/appointments/${appointment.id}/status`, (request) => {
      const body = request.postDataJSON() as { status: string; internalNotes: string };
      Object.assign(appointment, { status: body.status, internalNotes: body.internalNotes });
      return { json: dto(appointment) };
    });
    backend.on('PATCH', `/admin/appointments/${appointment.id}/cancel`, (request) => {
      const body = request.postDataJSON() as { internalNotes: string };
      Object.assign(appointment, { status: 'cancelled', internalNotes: body.internalNotes });
      return { json: dto(appointment) };
    });
  }

  return appointments;
}
