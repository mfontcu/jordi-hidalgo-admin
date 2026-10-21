import type { MockBackend } from './backend';

const EMPTY_SUMMARY = {
  appointments_today: 0,
  pending_appointments: 0,
  free_slots_today: 0,
  clients_this_week: 0,
  next_appointment: null,
};

/** Dashboard, slot-watch demand, and the live-notices stream. Every signed-in shell opens them. */
export function mockHome(backend: MockBackend) {
  backend.on('GET', '/admin/dashboard/summary', { json: EMPTY_SUMMARY });
  backend.on('GET', '/admin/slot-watches', { json: { items: [] } });
  backend.on('GET', '/admin/activity', { json: { items: [] } });
  backend.on('GET', '/admin/activity/stream', { status: 200, text: '' });
  backend.on('POST', '/admin/activity/read', { status: 204, text: '' });
}
