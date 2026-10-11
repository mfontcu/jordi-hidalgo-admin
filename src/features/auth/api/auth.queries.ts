import { queryOptions } from '@tanstack/react-query';

import { apiClient, unwrap } from '@/shared/api';

import { authKeys } from './auth.keys';
import { toStaffMember } from './auth.mappers';

/**
 * The signed-in staff member. Fetched once per session: sign-in seeds it, and sign-out or expiry
 * clears the whole cache. No retry, so a failed restore goes to the login screen at once.
 */
export function meQueryOptions() {
  return queryOptions({
    queryKey: authKeys.me(),
    queryFn: async ({ signal }) => toStaffMember(unwrap(await apiClient.GET('/auth/me', { signal }))),
    retry: false,
    staleTime: 'static',
    gcTime: Infinity,
  });
}
