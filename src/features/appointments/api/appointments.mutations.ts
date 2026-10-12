import type { QueryClient } from '@tanstack/react-query';

import { apiClient, unwrap } from '@/shared/api';

import {
  bulkCancellationOf,
  cancellationOf,
  rangeCancellationOf,
  statusChangeOf,
  type AppointmentItem,
} from '../model/appointment';
import type { CreateAppointmentInput } from '../model/appointment-form';
import { appointmentsKeys } from './appointments.keys';
import { toAppointmentDetail, toCustomerPushMessage } from './appointments.mappers';

// Writes of the appointments feature. Each one refreshes the lists, where the row changes.

const path = (appointmentId: string) => ({ params: { path: { appointmentID: appointmentId } } });

async function invalidateLists(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: appointmentsKeys.lists() });
}

async function invalidateDetail(queryClient: QueryClient, appointmentId: string) {
  await queryClient.invalidateQueries({ queryKey: appointmentsKeys.detail(appointmentId) });
  await invalidateLists(queryClient);
}

/** `PATCH /admin/appointments/{id}/status`: the internal notes kept. */
export async function changeAppointmentStatus(
  queryClient: QueryClient,
  item: AppointmentItem,
  status: 'completed' | 'no_show' | 'pending' | 'confirmed',
) {
  unwrap(
    await apiClient.PATCH('/admin/appointments/{appointmentID}/status', {
      ...path(item.id),
      body:
        status === 'completed' || status === 'no_show'
          ? statusChangeOf(item, status)
          : { status, internalNotes: item.internalNotes, cancellationReason: '' },
    }),
  );
  await invalidateDetail(queryClient, item.id);
}

/** `PATCH /admin/appointments/{id}/cancel`: without a reason, the internal notes kept. */
export async function cancelAppointment(queryClient: QueryClient, item: AppointmentItem) {
  unwrap(
    await apiClient.PATCH('/admin/appointments/{appointmentID}/cancel', {
      ...path(item.id),
      body: cancellationOf(item),
    }),
  );
  await invalidateDetail(queryClient, item.id);
}

/**
 * Cancels the appointments a new block covers, each with the block's reason and its internal
 * notes (cancelConflictingAppointments). Flutter sends no notes, which clears them, and ignores
 * the ones that fail; the panel counts them.
 */
export async function cancelRangeAppointments(
  queryClient: QueryClient,
  items: readonly AppointmentItem[],
  reason: string,
): Promise<{ cancelled: number; failed: number }> {
  const results = await Promise.allSettled(
    items.map(async (item) =>
      unwrap(
        await apiClient.PATCH('/admin/appointments/{appointmentID}/cancel', {
          ...path(item.id),
          body: rangeCancellationOf(item, reason),
        }),
      ),
    ),
  );
  await invalidateLists(queryClient);
  const failed = results.filter((result) => result.status === 'rejected').length;
  return { cancelled: results.length - failed, failed };
}

/** Bulk complete or no-show: each appointment's internal notes kept. */
export async function bulkChangeStatus(
  queryClient: QueryClient,
  items: readonly AppointmentItem[],
  status: 'completed' | 'no_show',
): Promise<{ ok: number; failed: { id: string; error: unknown }[] }> {
  const failed: { id: string; error: unknown }[] = [];
  let ok = 0;
  const results = await Promise.allSettled(
    items.map(async (item) =>
      unwrap(
        await apiClient.PATCH('/admin/appointments/{appointmentID}/status', {
          ...path(item.id),
          body: statusChangeOf(item, status),
        }),
      ),
    ),
  );
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') ok += 1;
    else failed.push({ id: items[index]?.id ?? '', error: result.reason });
  });
  await invalidateLists(queryClient);
  return { ok, failed };
}

/** Bulk cancel with a shared reason; each appointment's internal notes kept. */
export async function bulkCancelAppointments(
  queryClient: QueryClient,
  items: readonly AppointmentItem[],
  reason: string,
): Promise<{ ok: number; failed: { id: string; error: unknown }[] }> {
  const failed: { id: string; error: unknown }[] = [];
  let ok = 0;
  const results = await Promise.allSettled(
    items.map(async (item) =>
      unwrap(
        await apiClient.PATCH('/admin/appointments/{appointmentID}/cancel', {
          ...path(item.id),
          body: bulkCancellationOf(item, reason),
        }),
      ),
    ),
  );
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') ok += 1;
    else failed.push({ id: items[index]?.id ?? '', error: result.reason });
  });
  await invalidateLists(queryClient);
  return { ok, failed };
}

/** `POST /admin/appointments`: creates one appointment and returns its detail. */
export async function createAppointment(queryClient: QueryClient, input: CreateAppointmentInput) {
  const created = toAppointmentDetail(
    unwrap(
      await apiClient.POST('/admin/appointments', {
        body: {
          userId: input.userId,
          serviceId: input.serviceId,
          appointmentStart: input.appointmentStart,
          status: input.status,
          customerNotes: input.customerNotes,
          internalNotes: input.internalNotes,
        },
      }),
    ),
  );
  await invalidateLists(queryClient);
  return created;
}

/** `PATCH /admin/appointments/{id}/reschedule`. */
export async function rescheduleAppointment(
  queryClient: QueryClient,
  appointmentId: string,
  appointmentStart: string,
) {
  const updated = toAppointmentDetail(
    unwrap(
      await apiClient.PATCH('/admin/appointments/{appointmentID}/reschedule', {
        ...path(appointmentId),
        body: { appointmentStart },
      }),
    ),
  );
  await invalidateDetail(queryClient, appointmentId);
  await queryClient.invalidateQueries({ queryKey: appointmentsKeys.rescheduleChain(appointmentId) });
  return updated;
}

/** `POST /admin/appointments/{id}/customer-push`. */
export async function sendCustomerPush(queryClient: QueryClient, appointmentId: string, body: string) {
  const message = toCustomerPushMessage(
    unwrap(
      await apiClient.POST('/admin/appointments/{appointmentID}/customer-push', {
        ...path(appointmentId),
        body: { body },
      }),
    ),
  );
  await queryClient.invalidateQueries({ queryKey: appointmentsKeys.pushMessages(appointmentId) });
  return message;
}
