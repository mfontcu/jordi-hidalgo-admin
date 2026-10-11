import type { UserListParams } from '../model/admin-user';

/**
 * Query keys of the users feature (staff and clients share `/admin/users`). Writes invalidate
 * `lists()` (every role, page, and filter) and store or invalidate the `detail(id)` they change.
 */
export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (params: UserListParams) => [...usersKeys.lists(), params] as const,
  details: () => [...usersKeys.all, 'detail'] as const,
  detail: (userId: string) => [...usersKeys.details(), userId] as const,
};
