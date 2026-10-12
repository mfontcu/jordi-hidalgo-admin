import { queryOptions } from '@tanstack/react-query';

import { apiClient, unwrap } from '@/shared/api';

import type { UserAppointmentsParams } from '../model/appointment';
import { appointmentsKeys } from './appointments.keys';
import { toAppointmentPage } from './appointments.mappers';

// The backend localizes the service names from `Accept-Language` (`meta.localized`).

/** Short, as in the other features: a later visit refetches, as the Flutter screens do on entry. */
const STALE_TIME = 10_000;

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
