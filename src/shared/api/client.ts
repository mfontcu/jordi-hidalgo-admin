import createClient, { type Client } from 'openapi-fetch';

import { env } from '@/shared/config/env';
import { useLocaleStore } from '@/shared/i18n';

import { acceptLanguageMiddleware } from './middleware/accept-language';
import { timeoutMiddleware } from './middleware/timeout';
import type { paths } from './schema.gen';

export type ApiClient = Client<paths>;

type ApiClientOptions = {
  baseUrl: string;
  getLocale: () => string;
  fetch?: typeof globalThis.fetch;
};

/**
 * Builds the typed client for the backend contract. Middleware order follows ADR-003:
 * base URL, `Accept-Language`, (auth and refresh, phase 2), (error normalization, phase 4), timeout.
 */
export function createApiClient({ baseUrl, getLocale, fetch }: ApiClientOptions): ApiClient {
  const client = createClient<paths>({ baseUrl, ...(fetch ? { fetch } : {}) });
  client.use(acceptLanguageMiddleware(getLocale), timeoutMiddleware());
  return client;
}

export const apiClient: ApiClient = createApiClient({
  baseUrl: env.VITE_API_BASE_URL,
  getLocale: () => useLocaleStore.getState().locale,
});
