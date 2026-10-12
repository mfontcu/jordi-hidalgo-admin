import { queryOptions } from '@tanstack/react-query';

import { apiClient, unwrap } from '@/shared/api';

import type { AppointmentItem, UserAppointmentsParams } from '../model/appointment';
import type { AppointmentListParams } from '../model/appointments-search';
import { appointmentsKeys } from './appointments.keys';
import {
  toAppointmentDetail,
  toAppointmentPage,
  toAvailableDate,
  toCustomerPushMessage,
  toRescheduleChainEntry,
  toTimeSlot,
} from './appointments.mappers';

// The backend localizes the service names from `Accept-Language` (`meta.localized`).

/** Short, as in the other features: a later visit refetches, as the Flutter screens do on entry. */
const STALE_TIME = 10_000;

/** One page of `GET /admin/appointments` with the catalog summary. */
export function appointmentsListQueryOptions(params: AppointmentListParams) {
  return queryOptions({
    queryKey: appointmentsKeys.list(params),
    queryFn: async ({ signal }) => {
      const query = {
        page: params.page,
        pageSize: params.pageSize,
        status: params.status,
        ...(params.search ? { search: params.search } : {}),
        ...(params.dateFrom ? { dateFrom: params.dateFrom } : {}),
        ...(params.dateTo ? { dateTo: params.dateTo } : {}),
      };
      return toAppointmentPage(
        unwrap(await apiClient.GET('/admin/appointments', { params: { query }, signal })),
      );
    },
    meta: { localized: true },
    staleTime: STALE_TIME,
  });
}

/** One page of an account's appointments, every status, the newest first as the backend sorts them. */
export function userAppointmentsQueryOptions(params: UserAppointmentsParams) {
  return queryOptions({
    queryKey: appointmentsKeys.userList(params),
    queryFn: async ({ signal }) => {
      const query = { userId: params.userId, status: 'all', page: params.page, pageSize: params.pageSize };
      return toAppointmentPage(
        unwrap(await apiClient.GET('/admin/appointments', { params: { query }, signal })),
      );
    },
    meta: { localized: true },
    staleTime: STALE_TIME,
  });
}

/** The page size Flutter loads the appointments of a blocked range with. */
const RANGE_PAGE_SIZE = 200;

/**
 * Every appointment between two instants (loadAppointmentsOverlappingBlockedRange): every status,
 * page after page. Flutter reads one page of 200; the panel reads them all. Always fresh: it
 * decides what a new block cancels.
 */
export function rangeAppointmentsQueryOptions(dateFrom: string, dateTo: string) {
  return queryOptions({
    queryKey: appointmentsKeys.range(dateFrom, dateTo),
    queryFn: async ({ signal }) => {
      const items: AppointmentItem[] = [];
      for (let page = 1; ; page += 1) {
        const query = { status: 'all', dateFrom, dateTo, page, pageSize: RANGE_PAGE_SIZE };
        const result = toAppointmentPage(
          unwrap(await apiClient.GET('/admin/appointments', { params: { query }, signal })),
        );
        items.push(...result.items);
        if (result.items.length === 0 || items.length >= result.totalItems) return items;
      }
    },
    meta: { localized: true },
    staleTime: 0,
  });
}

export function appointmentDetailQueryOptions(appointmentId: string) {
  return queryOptions({
    queryKey: appointmentsKeys.detail(appointmentId),
    queryFn: async ({ signal }) =>
      toAppointmentDetail(
        unwrap(
          await apiClient.GET('/admin/appointments/{appointmentID}', {
            params: { path: { appointmentID: appointmentId } },
            signal,
          }),
        ),
      ),
    meta: { localized: true },
    staleTime: STALE_TIME,
  });
}

export function customerPushMessagesQueryOptions(appointmentId: string) {
  return queryOptions({
    queryKey: appointmentsKeys.pushMessages(appointmentId),
    queryFn: async ({ signal }) => {
      const result = unwrap(
        await apiClient.GET('/admin/appointments/{appointmentID}/customer-push-messages', {
          params: { path: { appointmentID: appointmentId } },
          signal,
        }),
      );
      return (result.items ?? []).map(toCustomerPushMessage);
    },
    staleTime: STALE_TIME,
  });
}

export function rescheduleChainQueryOptions(appointmentId: string) {
  return queryOptions({
    queryKey: appointmentsKeys.rescheduleChain(appointmentId),
    queryFn: async ({ signal }) => {
      const result = unwrap(
        await apiClient.GET('/admin/appointments/{appointmentID}/reschedule-chain', {
          params: { path: { appointmentID: appointmentId } },
          signal,
        }),
      );
      return (result.items ?? []).map(toRescheduleChainEntry);
    },
    staleTime: STALE_TIME,
  });
}

/** Available days for a service; always fresh while picking a slot. */
export function availableDatesQueryOptions(serviceId: string, excludeAppointmentId = '') {
  return queryOptions({
    queryKey: appointmentsKeys.availableDates(serviceId, excludeAppointmentId),
    queryFn: async ({ signal }) => {
      const result = unwrap(
        await apiClient.GET('/availability/dates', {
          params: {
            query: {
              serviceId,
              ...(excludeAppointmentId ? { excludeAppointmentId } : {}),
            },
          },
          signal,
        }),
      );
      return result.map(toAvailableDate).filter(Boolean);
    },
    staleTime: 0,
    enabled: serviceId.trim() !== '',
  });
}

/** Clock slots for a salon day; always fresh while picking a slot. */
export function availableSlotsQueryOptions(serviceId: string, date: string, excludeAppointmentId = '') {
  return queryOptions({
    queryKey: appointmentsKeys.availableSlots(serviceId, date, excludeAppointmentId),
    queryFn: async ({ signal }) => {
      const result = unwrap(
        await apiClient.GET('/availability/slots', {
          params: {
            query: {
              serviceId,
              date,
              ...(excludeAppointmentId ? { excludeAppointmentId } : {}),
            },
          },
          signal,
        }),
      );
      return result.map(toTimeSlot);
    },
    staleTime: 0,
    enabled: serviceId.trim() !== '' && date.trim() !== '',
  });
}

/** Active services for the create form's lookup (Flutter pageSize 100). */
export function formServicesQueryOptions() {
  return queryOptions({
    queryKey: appointmentsKeys.formServices(),
    queryFn: async ({ signal }) => {
      const result = unwrap(
        await apiClient.GET('/admin/services', {
          params: { query: { page: 1, pageSize: 100, status: 'active' } },
          signal,
        }),
      );
      return (result.items ?? []).map((item) => ({
        id: item.id ?? '',
        name: item.name ?? '',
        durationMinutes: item.durationMinutes ?? 0,
      }));
    },
    meta: { localized: true },
    staleTime: STALE_TIME,
  });
}

/** Active accounts of one role for the client lookup (clients and staff, merged in the hook). */
export function formUsersQueryOptions(role: 'customer' | 'admin', search: string) {
  return queryOptions({
    queryKey: appointmentsKeys.formUsers(role, search),
    queryFn: async ({ signal }) => {
      const result = unwrap(
        await apiClient.GET('/admin/users', {
          params: {
            query: {
              role,
              page: 1,
              pageSize: 50,
              status: 'active',
              ...(search ? { search } : {}),
            },
          },
          signal,
        }),
      );
      return (result.items ?? []).map((item) => {
        const alias = item.adminAlias?.trim() ?? '';
        const name = `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim();
        const phone = item.phone?.trim() ?? '';
        const email = item.email?.trim() ?? '';
        return {
          id: item.id ?? '',
          title: alias !== '' ? alias : name !== '' ? name : (item.id ?? ''),
          subtitle: phone !== '' ? phone : email !== '' ? email : undefined,
        };
      });
    },
    staleTime: STALE_TIME,
  });
}

/** Operational profile of the chosen client (no-show risk and internal notes). */
export function formClientQueryOptions(userId: string) {
  return queryOptions({
    queryKey: appointmentsKeys.formClient(userId),
    queryFn: async ({ signal }) => {
      const result = unwrap(
        await apiClient.GET('/admin/users/{userID}', {
          params: { path: { userID: userId } },
          signal,
        }),
      );
      return {
        noShowCountLast90Days: result.noShowCountLast90Days ?? 0,
        internalNotes: result.internalNotes ?? '',
        phone: result.phone ?? '',
      };
    },
    staleTime: STALE_TIME,
    enabled: userId.trim() !== '',
  });
}
