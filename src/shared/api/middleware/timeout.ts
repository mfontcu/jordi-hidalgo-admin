import type { Middleware } from 'openapi-fetch';

export const REQUEST_TIMEOUT_MS = 30_000;

/** Aborts a request after `timeoutMs`, keeping any signal the caller passed. */
export function timeoutMiddleware(timeoutMs = REQUEST_TIMEOUT_MS): Middleware {
  return {
    onRequest({ request }) {
      return new Request(request, {
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(timeoutMs)]),
      });
    },
  };
}
