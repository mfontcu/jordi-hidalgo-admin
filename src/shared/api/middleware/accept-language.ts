import type { Middleware } from 'openapi-fetch';

/** Sends the staff member's chosen language, so the backend localizes its content. */
export function acceptLanguageMiddleware(getLocale: () => string): Middleware {
  return {
    onRequest({ request }) {
      request.headers.set('Accept-Language', getLocale());
      return request;
    },
  };
}
