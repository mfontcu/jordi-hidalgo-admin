import { isBusinessDay } from '@/shared/lib/business-time';

import type { ActivityPayload } from './refresh';

/** Where an announced notice opens. The panel computes it; the payload has no path. */
export type ActivityDestination =
  | { to: '/appointments/$appointmentId'; params: { appointmentId: string } }
  | { to: '/appointments' }
  | { to: '/schedule/slot-watches'; search: { date: string } }
  | { to: '/schedule/slot-watches' }
  | { to: '/clients/$clientId'; params: { clientId: string } }
  | { to: '/clients' };

/**
 * The screen for a kind. An appointment or client without an id opens its list, which is also
 * where a missing record lands. Kinds the bell does not announce have no destination.
 */
export function destination(kind: string, payload: ActivityPayload): ActivityDestination | null {
  switch (kind) {
    case 'appointment.booked':
    case 'appointment.rescheduled':
    case 'appointment.cancelled': {
      const appointmentId = payload.appointmentPublicId?.trim();
      return appointmentId
        ? { to: '/appointments/$appointmentId', params: { appointmentId } }
        : { to: '/appointments' };
    }
    case 'slot_watch.created':
    case 'slot_watch.cancelled':
    case 'slot_watch.hold_released': {
      const date = payload.businessDay?.trim();
      return date && isBusinessDay(date)
        ? { to: '/schedule/slot-watches', search: { date } }
        : { to: '/schedule/slot-watches' };
    }
    case 'client.registered': {
      const clientId = payload.userId?.trim();
      return clientId ? { to: '/clients/$clientId', params: { clientId } } : { to: '/clients' };
    }
    case 'client.account_deleted':
      return { to: '/clients' };
    default:
      return null;
  }
}
