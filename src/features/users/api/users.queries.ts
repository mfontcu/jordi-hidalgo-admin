import { queryOptions } from '@tanstack/react-query';

import { apiClient, unwrap } from '@/shared/api';

import type { UserListParams } from '../model/admin-user';
import { usersKeys } from './users.keys';
import { toAdminUser, toAdminUserPage } from './users.mappers';

// The backend does not localize accounts, so these queries are not refetched on a language change.

/**
 * Long enough for the screen to take over what its route loader fetched without asking again;
 * a later visit refetches, as the Flutter screens reload on entry. Writes invalidate at once.
 */
const STALE_TIME = 10_000;

/** One page of `GET /admin/users` for a role, with the role's summary. */
export function usersListQueryOptions(params: UserListParams) {
  return queryOptions({
    queryKey: usersKeys.list(params),
    queryFn: async ({ signal }) => {
      const query = {
        role: params.role,
        page: params.page,
        pageSize: params.pageSize,
        status: params.status,
        ...(params.search ? { search: params.search } : {}),
        ...(params.dateFrom ? { dateFrom: params.dateFrom } : {}),
        ...(params.dateTo ? { dateTo: params.dateTo } : {}),
      };
      return toAdminUserPage(unwrap(await apiClient.GET('/admin/users', { params: { query }, signal })));
    },
    staleTime: STALE_TIME,
  });
}

export function userDetailQueryOptions(userId: string) {
  return queryOptions({
    queryKey: usersKeys.detail(userId),
    queryFn: async ({ signal }) =>
      toAdminUser(
        unwrap(
          await apiClient.GET('/admin/users/{userID}', { params: { path: { userID: userId } }, signal }),
        ),
      ),
    staleTime: STALE_TIME,
  });
}
