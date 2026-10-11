import type { Middleware } from 'openapi-fetch';

import { ApiException } from '../errors';

/**
 * Turns transport failures (offline, DNS, CORS, timeout) into `ApiException` of kind `network`.
 * HTTP error statuses come back as results; `unwrap` turns those into `ApiException`.
 */
export function errorMiddleware(): Middleware {
  return {
    onError({ error }) {
      return error instanceof ApiException ? error : new ApiException({ kind: 'network' });
    },
  };
}
