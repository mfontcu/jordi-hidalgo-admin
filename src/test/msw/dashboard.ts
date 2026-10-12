import { http, HttpResponse } from 'msw';

import { API } from './auth';

export function dashboardSummaryDto(overrides: Record<string, unknown> = {}) {
  return {
    appointments_today: 4,
    pending_appointments: 1,
    free_slots_today: 2,
    clients_this_week: 3,
    next_appointment: {
      id: 'apt-1',
      start_at: '2026-10-12T08:00:00Z',
      service_name: 'Corte',
      customer_name: 'Ana Ruiz',
      customer_avatar_url: '',
    },
    ...overrides,
  };
}

/** `GET /admin/dashboard/summary`, recording each request. */
export function dashboardSummary(dto = dashboardSummaryDto()) {
  const calls: string[] = [];
  const handler = http.get(`${API}/admin/dashboard/summary`, ({ request }) => {
    calls.push(new URL(request.url).search);
    return HttpResponse.json(dto);
  });
  return { handler, calls };
}
