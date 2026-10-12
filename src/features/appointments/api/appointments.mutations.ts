import type { QueryClient } from '@tanstack/react-query';

import { apiClient, unwrap } from '@/shared/api';

import { cancellationOf, statusChangeOf, type AppointmentItem } from '../model/appointment';
import { appointmentsKeys } from './appointments.keys';

// Writes of the appointments feature. Each one refreshes the lists, where the row changes.

const path = (appointmentId: string) => ({ params: { path: { appointmentID: appointmentId } } });

/** `PATCH /admin/appointments/{id}/status`: completed or no-show, the internal notes kept. */
export async function changeAppointmentStatus(
  queryClient: QueryClient,
  item: AppointmentItem,
  status: 'completed' | 'no_show',
) {
  unwrap(
    await apiClient.PATCH('/admin/appointments/{appointmentID}/status', {
      ...path(item.id),
      body: statusChangeOf(item, status),
    }),
  );
  await queryClient.invalidateQueries({ queryKey: appointmentsKeys.lists() });
}

/** `PATCH /admin/appointments/{id}/cancel`: without a reason, the internal notes kept. */
export async function cancelAppointment(queryClient: QueryClient, item: AppointmentItem) {
  unwrap(
    await apiClient.PATCH('/admin/appointments/{appointmentID}/cancel', {
      ...path(item.id),
      body: cancellationOf(item),
    }),
  );
  await queryClient.invalidateQueries({ queryKey: appointmentsKeys.lists() });
}
