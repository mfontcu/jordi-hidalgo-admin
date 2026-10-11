import type { QueryClient } from '@tanstack/react-query';

import { apiClient, isApiException, session, unwrap } from '@/shared/api';

import type { LoginFailure } from '../model/login-error';
import type { LoginFormValues } from '../model/login-form';
import { canAccessAdmin, type StaffMember } from '../model/staff-member';
import { authKeys } from './auth.keys';
import { toStaffMember } from './auth.mappers';
import { meQueryOptions } from './auth.queries';

/** A sign-in that failed for a reason the backend did not report as an HTTP error. */
class SignInError extends Error {
  readonly failure: LoginFailure;

  constructor(failure: LoginFailure) {
    super(failure);
    this.name = 'SignInError';
    this.failure = failure;
  }
}

/** Signs out: clears the tokens and every cached query of the session. */
export function signOut(queryClient: QueryClient) {
  session.clear();
  queryClient.clear();
}

/**
 * Restores the session from the stored tokens (Flutter `AuthGateScreen` and
 * `AdminRouter.bootstrapFromStoredSession`): `GET /auth/me`, refreshing once if needed.
 * Returns null when there is no usable session:
 * - no token, or the backend rejected it: the tokens are cleared (the client already expired the
 *   session when the refresh was rejected or the user is blocked);
 * - a role without panel access: signed out, with no notice;
 * - network or server failure: the tokens are kept, so a later visit can restore them.
 */
export async function restoreSession(queryClient: QueryClient): Promise<StaffMember | null> {
  if (!session.hasAccessToken()) {
    queryClient.removeQueries({ queryKey: authKeys.me() });
    return null;
  }
  try {
    const staffMember = await queryClient.query(meQueryOptions());
    if (!canAccessAdmin(staffMember.role)) {
      signOut(queryClient);
      return null;
    }
    return staffMember;
  } catch (error) {
    if (isApiException(error) && error.error.kind === 'unauthorized' && session.hasAccessToken()) {
      signOut(queryClient);
    }
    return null;
  }
}

/** Signs in (Flutter `LoginScreen._submit`): any previous session is cleared first. */
export async function signIn(
  queryClient: QueryClient,
  { email, password }: LoginFormValues,
): Promise<StaffMember> {
  signOut(queryClient);

  const result = unwrap(await apiClient.POST('/auth/login', { body: { email, password } }));
  if (!result.accessToken || !result.refreshToken || !result.user) throw new SignInError('unknown');

  const staffMember = toStaffMember(result.user);
  if (!canAccessAdmin(staffMember.role)) throw new SignInError('noAdminAccess');

  session.setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
  queryClient.setQueryData(authKeys.me(), staffMember);
  return staffMember;
}

/** Why `signIn` failed. A wrong password is a 401; a blocked or inactive account is a 403. */
export function loginFailureOf(error: unknown): LoginFailure {
  if (error instanceof SignInError) return error.failure;
  if (!isApiException(error)) return 'unknown';
  switch (error.error.kind) {
    case 'unauthorized':
      return 'invalidCredentials';
    case 'network':
      return 'network';
    case 'server':
      return 'server';
    default:
      return 'failed';
  }
}

/** Whether the session expired since the last call; the login screen asks once when it opens. */
export function consumeSessionExpired(): boolean {
  return session.consumeExpired();
}
