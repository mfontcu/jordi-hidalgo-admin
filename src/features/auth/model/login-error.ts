/** Why a sign-in failed. */
export type LoginFailure =
  'invalidCredentials' | 'noAdminAccess' | 'network' | 'server' | 'failed' | 'unknown';

export type LoginErrorKey =
  | 'authErrorInvalidCredentials'
  | 'authErrorNoAdminAccess'
  | 'authErrorNetwork'
  | 'authErrorServer'
  | 'authErrorLoginFailed'
  | 'authErrorUnknown';

const LOGIN_ERROR_KEYS: Record<LoginFailure, LoginErrorKey> = {
  invalidCredentials: 'authErrorInvalidCredentials',
  noAdminAccess: 'authErrorNoAdminAccess',
  network: 'authErrorNetwork',
  server: 'authErrorServer',
  // A blocked or inactive account (403), a rate limit, or a rejected request.
  failed: 'authErrorLoginFailed',
  unknown: 'authErrorUnknown',
};

/** Message shown above the login form for a failed sign-in. */
export function loginErrorKey(failure: LoginFailure): LoginErrorKey {
  return LOGIN_ERROR_KEYS[failure];
}
