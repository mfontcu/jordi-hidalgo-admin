import type { UserAppointmentsParams } from '../model/appointment';
import type { AppointmentListParams } from '../model/appointments-search';

/** Query keys of the appointments feature. Writes invalidate `lists()` and often `details()`. */
export const appointmentsKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentsKeys.all, 'list'] as const,
  list: (params: AppointmentListParams) => [...appointmentsKeys.lists(), 'admin', params] as const,
  userList: (params: UserAppointmentsParams) => [...appointmentsKeys.lists(), 'user', params] as const,
  range: (dateFrom: string, dateTo: string) =>
    [...appointmentsKeys.lists(), 'range', dateFrom, dateTo] as const,
  details: () => [...appointmentsKeys.all, 'detail'] as const,
  detail: (appointmentId: string) => [...appointmentsKeys.details(), appointmentId] as const,
  pushMessages: (appointmentId: string) => [...appointmentsKeys.detail(appointmentId), 'push'] as const,
  rescheduleChain: (appointmentId: string) => [...appointmentsKeys.detail(appointmentId), 'chain'] as const,
  availability: () => [...appointmentsKeys.all, 'availability'] as const,
  availableDates: (serviceId: string, excludeAppointmentId: string) =>
    [...appointmentsKeys.availability(), 'dates', serviceId, excludeAppointmentId] as const,
  availableSlots: (serviceId: string, date: string, excludeAppointmentId: string) =>
    [...appointmentsKeys.availability(), 'slots', serviceId, date, excludeAppointmentId] as const,
  /** Lookups the create form needs (clients, staff, services, operational profile). */
  formLookups: () => [...appointmentsKeys.all, 'form'] as const,
  formServices: () => [...appointmentsKeys.formLookups(), 'services'] as const,
  formUsers: (role: 'customer' | 'admin', search: string) =>
    [...appointmentsKeys.formLookups(), 'users', role, search] as const,
  formClient: (userId: string) => [...appointmentsKeys.formLookups(), 'client', userId] as const,
};
