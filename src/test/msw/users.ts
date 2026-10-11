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
