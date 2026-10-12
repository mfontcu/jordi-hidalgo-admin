import type { MockBackend } from './backend';

const EMPTY_SUMMARY = {
  appointments_today: 0,
  pending_appointments: 0,
  free_slots_today: 0,
  clients_this_week: 0,
  next_appointment: null,
};

/** Dashboard and slot-watch demand. Every signed-in shell can open either route. */
export function mockHome(backend: MockBackend) {
  backend.on('GET', '/admin/dashboard/summary', { json: EMPTY_SUMMARY });
  backend.on('GET', '/admin/slot-watches', { json: { items: [] } });
}
