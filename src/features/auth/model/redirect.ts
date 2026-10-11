/** Paths that never serve as the destination after sign-in (Flutter `AdminRouter.isPublicRoute`). */
const PUBLIC_PATHS: readonly string[] = ['/login', '/auth-gate'];

const ORIGIN = 'http://panel.invalid';

/**
 * The path to open after sign-in, from the `redirect` search param. Only a path of this panel is
 * accepted, so the parameter cannot send a staff member to another site.
 */
export function sanitizeRedirect(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return undefined;
  if (value.includes('\\')) return undefined;

  let url: URL;
  try {
    url = new URL(value, ORIGIN);
  } catch {
    return undefined;
  }
  if (url.origin !== ORIGIN) return undefined;

  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (PUBLIC_PATHS.includes(path)) return undefined;
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Destination after sign-in: the requested path, or the dashboard. */
export function postSignInPath(redirect: unknown): string {
  return sanitizeRedirect(redirect) ?? '/';
}
