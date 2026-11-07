import type { QueryClient } from '@tanstack/react-query';

import { apiClient, isApiException, unwrap } from '@/shared/api';

import type { AdminUser } from '../model/admin-user';
import type { CreateUserInput, UpdateUserInput } from '../model/staff-form';
import { usersKeys } from './users.keys';
import { toAdminUser } from './users.mappers';

// Writes of the users feature. Each one names the queries it changes next to the call; the hooks
// run them as TanStack Query mutations.

const path = (userId: string) => ({ params: { path: { userID: userId } } });

/** Lists hold the summary counts, so every write refreshes them. */
function refreshLists(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
}

/** Keeps the account the backend answered with, and refreshes the lists. */
function storeUser(queryClient: QueryClient, user: AdminUser) {
  queryClient.setQueryData(usersKeys.detail(user.id), user);
  return refreshLists(queryClient);
}

/** `POST /admin/users`. */
export async function createUser(queryClient: QueryClient, input: CreateUserInput): Promise<AdminUser> {
  const user = toAdminUser(unwrap(await apiClient.POST('/admin/users', { body: input })));
  await storeUser(queryClient, user);
  return user;
}

/** `PATCH /admin/users/{id}`: also activates and deactivates an account. */
export async function updateUser(
  queryClient: QueryClient,
  userId: string,
  input: UpdateUserInput,
): Promise<AdminUser> {
  const user = toAdminUser(
    unwrap(await apiClient.PATCH('/admin/users/{userID}', { ...path(userId), body: input })),
  );
  await storeUser(queryClient, user);
  return user;
}

/** `POST /admin/users/{id}/password-setup-email`: changes nothing the panel shows. */
export async function sendPasswordSetupEmail(userId: string) {
  unwrap(await apiClient.POST('/admin/users/{userID}/password-setup-email', path(userId)));
}

/** `POST /admin/users/{id}/activation-email`: changes nothing the panel shows. */
export async function sendActivationEmail(userId: string) {
  unwrap(await apiClient.POST('/admin/users/{userID}/activation-email', path(userId)));
}

/** `POST /admin/users/{id}/verify-account`: activates a client without the email link. */
export async function verifyAccount(queryClient: QueryClient, userId: string): Promise<AdminUser> {
  const user = toAdminUser(
    unwrap(await apiClient.POST('/admin/users/{userID}/verify-account', path(userId))),
  );
  await storeUser(queryClient, user);
  return user;
}

/**
 * A 404 `user_not_found` on a deletion: the client is already gone, deleted by an earlier attempt
 * whose answer was lost or by another session (AA-04). A 404 without the code is still a failure.
 */
function isAlreadyDeleted(error: unknown): boolean {
  return isApiException(error) && error.error.kind === 'notFound' && error.error.code === 'user_not_found';
}

/**
 * `DELETE /admin/users/{id}` (clients only): forgets the account and refreshes the lists. A client
 * that no longer exists counts as deleted, so a retry after a lost answer succeeds.
 */
export async function deleteUser(queryClient: QueryClient, userId: string) {
  try {
    unwrap(await apiClient.DELETE('/admin/users/{userID}', path(userId)));
  } catch (error) {
    if (!isAlreadyDeleted(error)) throw error;
  }
  queryClient.removeQueries({ queryKey: usersKeys.detail(userId), exact: true });
  await refreshLists(queryClient);
}

/**
 * `GET /admin/users/phone-matches`: how many other clients have the phone, asked right before a
 * save, so it is a request and not a cached query.
 */
export async function countPhoneMatches(phone: string, excludeUserId: string | null): Promise<number> {
  const query = { phone, ...(excludeUserId ? { excludeUserId } : {}) };
  return unwrap(await apiClient.GET('/admin/users/phone-matches', { params: { query } })).count ?? 0;
}
