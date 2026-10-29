import type { Middleware } from 'openapi-fetch';
import { z } from 'zod';

import { ApiException, isAdminAccessLostMessage } from '../errors';
import { session, useSessionStore } from '../session-store';
import { REQUEST_TIMEOUT_MS } from './timeout';

/** Operations that carry no access token and never trigger a refresh. */
const PUBLIC_PATHS = new Set(['/auth/login', '/auth/logout', '/auth/refresh']);

const refreshResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

type RefreshResult = 'success' | 'rejected' | 'transient';

let refreshing: Promise<RefreshResult> | null = null;

async function performRefresh(baseUrl: string, fetchImpl: typeof fetch): Promise<RefreshResult> {
  const { refreshToken } = useSessionStore.getState();
  if (!refreshToken) {
    expireSession();
    return 'rejected';
  }
  try {
    const response = await fetchImpl(
      new Request(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refreshToken }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }),
    );
    if (response.status === 401 || response.status === 403) {
      expireSession();
      return 'rejected';
    }
    if (!response.ok) return 'transient';

    const tokens = refreshResponseSchema.safeParse(await response.json().catch(() => null));
    if (!tokens.success) {
      expireSession();
      return 'rejected';
    }
    session.setTokens(tokens.data);
    return 'success';
  } catch {
    return 'transient';
  }
}

/**
 * One shared `POST /auth/refresh`. The HTTP middleware and the activity stream both call it, so a
 * 401 on either side refreshes once and the other side reuses the new token.
 */
export function refreshAccessToken(
  baseUrl: string,
  fetchImpl: typeof fetch = globalThis.fetch,
): Promise<RefreshResult> {
  refreshing ??= performRefresh(baseUrl, fetchImpl).finally(() => {
    refreshing = null;
  });
  return refreshing;
}

function bearer(token: string) {
  return `Bearer ${token}`;
}

function sentToken(request: Request): string | null {
  const header = request.headers.get('Authorization');
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
}

/** Expires the session unless an earlier response already did (the tokens are gone). */
function expireSession() {
  const { accessToken, refreshToken } = useSessionStore.getState();
  if (accessToken !== null || refreshToken !== null) session.expire();
}

async function isAccessLostResponse(response: Response): Promise<boolean> {
  if (response.status !== 403) return false;
  const text = await response.clone().text();
  return isAdminAccessLostMessage(text);
}

/**
 * Auth and refresh (ADR-003, "HTTP client and errors"), as the Flutter panel's `ApiHttpClient`:
 * - sends `Authorization: Bearer <access token>`;
 * - on a 401, one `POST /auth/refresh` shared by every concurrent request, then one retry;
 * - a refresh answered with 401/403, or a 403 "user is blocked" or "forbidden" (no longer an
 *   admin), expires the session;
 * - a refresh that fails for any other reason keeps the tokens and fails as a network error.
 */
export function sessionMiddleware(baseUrl: string): Middleware {
  // Copies of the outgoing requests, to retry them: the originals' bodies are consumed by then.
  const pending = new Map<string, Request>();

  async function retry(original: Request, fetchImpl: typeof fetch): Promise<Response> {
    const accessToken = useSessionStore.getState().accessToken ?? '';
    const headers = new Headers(original.headers);
    headers.set('Authorization', bearer(accessToken));
    const request = new Request(original, {
      headers,
      signal: AbortSignal.any([original.signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]),
    });
    try {
      return await fetchImpl(request);
    } catch {
      throw new ApiException({ kind: 'network' });
    }
  }

  return {
    onRequest({ request, schemaPath, id }) {
      if (PUBLIC_PATHS.has(schemaPath)) return undefined;
      const { accessToken } = useSessionStore.getState();
      if (accessToken) request.headers.set('Authorization', bearer(accessToken));
      pending.set(id, request.clone());
      return request;
    },

    async onResponse({ response, id, options }) {
      const original = pending.get(id);
      pending.delete(id);
      if (!original) return undefined;

      if (response.status === 401) {
        // A request sent before a refresh finished retries with the new token, without refreshing again.
        const current = useSessionStore.getState().accessToken;
        const sent = sentToken(original);
        const result =
          current !== null && sent !== null && current !== sent
            ? 'success'
            : await refreshAccessToken(baseUrl, options.fetch);

        if (result === 'rejected') return undefined;
        if (result === 'transient') throw new ApiException({ kind: 'network' });

        const retried = await retry(original, options.fetch);
        if (await isAccessLostResponse(retried)) expireSession();
        return retried;
      }

      if (await isAccessLostResponse(response)) expireSession();
      return undefined;
    },

    onError({ id }) {
      pending.delete(id);
      return undefined;
    },
  };
}
