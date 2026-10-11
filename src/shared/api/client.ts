import createClient, { type Client } from 'openapi-fetch';

import { env } from '@/shared/config/env';
import { useLocaleStore } from '@/shared/i18n';

import { acceptLanguageMiddleware } from './middleware/accept-language';
import { errorMiddleware } from './middleware/errors';
import { sessionMiddleware } from './middleware/session';
import { timeoutMiddleware } from './middleware/timeout';
import type { paths } from './schema.gen';

export type ApiClient = Client<paths>;

type ApiClientOptions = {
  baseUrl: string;
  getLocale: () => string;
  fetch?: typeof globalThis.fetch;
};

/**
 * Builds the typed client for the backend contract. Middleware order follows ADR-003: base URL,
 * `Accept-Language`, `Authorization` with refresh on 401, error normalization, then the timeout.
 */
export function createApiClient({ baseUrl, getLocale, fetch }: ApiClientOptions): ApiClient {
  // Resolved per request, not when the client is built, so a patched `fetch` (tests) is used.
  const client = createClient<paths>({
    baseUrl,
    fetch: fetch ?? ((request: Request) => globalThis.fetch(request)),
  });
  client.use(
    acceptLanguageMiddleware(getLocale),
    sessionMiddleware(baseUrl),
    errorMiddleware(),
    timeoutMiddleware(),
  );
  return client;
}

export const apiClient: ApiClient = createApiClient({
  baseUrl: env.VITE_API_BASE_URL,
  getLocale: () => useLocaleStore.getState().locale,
});
