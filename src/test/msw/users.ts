import { http, HttpResponse } from 'msw';

import { API } from './auth';

export function userDto(overrides: Record<string, unknown> = {}) {
  return {
    id: 'usr-1',
    firstName: 'Jordi',
    lastName: 'Hidalgo',
    fullName: 'Jordi Hidalgo',
    displayName: 'Jordi Hidalgo',
    adminAlias: '',
    phone: '+34 600 000 001',
    email: 'jordi@example.com',
    avatarUrl: '',
    isActive: true,
    isBlocked: false,
    internalNotes: 'Dueño del salón',
    createdAt: '2026-01-10T10:00:00Z',
    ...overrides,
  };
}

export const STAFF = [
  userDto(),
  userDto({
    id: 'usr-2',
    firstName: 'Ana',
    lastName: 'López',
    fullName: 'Ana López',
    phone: '',
    email: 'ana@example.com',
    isActive: false,
    internalNotes: '',
    createdAt: '2026-09-15T08:00:00Z',
  }),
];

export function usersListResponse(items = STAFF, { page = 1, totalItems = items.length } = {}) {
  return {
    items,
    pagination: { page, pageSize: 10, totalItems, totalPages: Math.ceil(totalItems / 10) },
    summary: {
      totalUsers: 7,
      inactiveUsers: 2,
      newThisMonth: 1,
      blockedUsers: 0,
      withUpcomingAppointment: 0,
    },
  };
}

/** `GET /admin/users`, recording each request's query. */
export function usersList(
  reply: (query: URLSearchParams) => ReturnType<typeof usersListResponse> = () => usersListResponse(),
) {
  const queries: URLSearchParams[] = [];
  const handler = http.get(`${API}/admin/users`, ({ request }) => {
    const query = new URL(request.url).searchParams;
    queries.push(query);
    return HttpResponse.json(reply(query));
  });
  return { handler, queries };
}

export function userDetail(user = userDto()) {
  return http.get(`${API}/admin/users/${user.id}`, () => HttpResponse.json(user));
}

/** A client as the detail returns it: the list fields and the activity counts. */
export function clientDto(overrides: Record<string, unknown> = {}) {
  return userDto({
    id: 'cli-1',
    firstName: 'María',
    lastName: 'Pérez',
    fullName: 'María Pérez',
    displayName: 'Mari',
    adminAlias: 'Mari',
    phone: '+34600111222',
    email: 'maria@example.com',
    internalNotes: 'Alérgica al tinte',
    createdAt: '2026-02-03T10:00:00Z',
    lastAppointmentAt: '2026-10-01T08:00:00Z',
    nextAppointmentAt: '2026-10-20T14:30:00Z',
    blockedAt: '',
    blockedReason: '',
    frequentServices: ['Corte', 'Barba'],
    noShowCountLast90Days: 2,
    rescheduleCountLast90Days: 1,
    totalAppointments: 7,
    ...overrides,
  });
}

export const CLIENTS = [
  clientDto(),
  clientDto({
    id: 'cli-2',
    firstName: 'Luis',
    lastName: 'Gómez',
    fullName: 'Luis Gómez',
    displayName: 'Luis Gómez',
    adminAlias: '',
    phone: '+34600333444',
    email: '',
    isActive: false,
    lastAppointmentAt: '',
    nextAppointmentAt: '',
  }),
];
