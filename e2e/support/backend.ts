import { test as base, type Page, type Request, type Route } from '@playwright/test';

// The e2e build talks to this URL (.env.e2e). Every request to it is answered here; CI has no backend.
export const API_ORIGIN = 'http://localhost:8080';

export const STAFF_USER = {
  id: 'u-staff',
  email: 'staff@example.com',
  firstName: 'Jordi',
  lastName: 'Hidalgo',
  role: 'admin',
};
export const CUSTOMER_USER = { ...STAFF_USER, id: 'u-customer', role: 'customer' };

export const OLD_TOKENS = { accessToken: 'access-old', refreshToken: 'refresh-old' };
export const NEW_TOKENS = { accessToken: 'access-new', refreshToken: 'refresh-new' };

export const ACCESS_TOKEN_KEY = 'hj_admin.access_token';
export const REFRESH_TOKEN_KEY = 'hj_admin.refresh_token';

/** A mocked answer: JSON, a plain-text `http.Error`, or a transport failure. */
type Reply = { status?: number; json?: unknown; text?: string } | 'network-error';
type Handler = (request: Request) => Reply | Promise<Reply>;

export type Call = { method: string; path: string; authorization: string | null; body: unknown };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept-Language',
};

/** The backend, mocked per test. Unmocked requests answer 599 and are listed in `unhandled`. */
export class MockBackend {
  readonly calls: Call[] = [];
  readonly unhandled: string[] = [];
  private readonly handlers = new Map<string, Handler>();

  /** Answers `METHOD /path` (query string ignored) with `handler` from now on. */
  on(method: string, path: string, handler: Handler | Reply) {
    this.handlers.set(`${method} ${path}`, typeof handler === 'function' ? handler : () => handler);
    return this;
  }

  callsTo(method: string, path: string) {
    return this.calls.filter((call) => call.method === method && call.path === path);
  }

  async attach(page: Page) {
    await page.route(`${API_ORIGIN}/**`, (route) => this.handle(route));
  }

  private async handle(route: Route) {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }
    const { pathname } = new URL(request.url());
    this.calls.push({
      method: request.method(),
      path: pathname,
      authorization: (await request.headerValue('authorization')) ?? null,
      body: request.postDataJSON() as unknown,
    });

    const handler = this.handlers.get(`${request.method()} ${pathname}`);
    if (!handler) {
      this.unhandled.push(`${request.method()} ${pathname}`);
      await route.fulfill({ status: 599, headers: CORS_HEADERS, body: 'unmocked request' });
      return;
    }
    const reply = await handler(request);
    if (reply === 'network-error') {
      await route.abort('connectionrefused');
      return;
    }
    await route.fulfill({
      status: reply.status ?? 200,
      headers: CORS_HEADERS,
      ...(reply.json === undefined
        ? { contentType: 'text/plain; charset=utf-8', body: `${reply.text ?? ''}\n` }
        : { json: reply.json }),
    });
  }
}

/** The bearer token a request carried. */
export const bearerOf = (request: Request) =>
  request.headers().authorization?.replace(/^Bearer /, '') ?? null;

/**
 * Stores tokens before the first page load, once per tab: a reload does not bring them back after
 * the app clears them.
 */
export async function seedSession(page: Page, tokens: { accessToken: string; refreshToken: string }) {
  await page.addInitScript(
    ({ keys, tokens: seeded }) => {
      if (sessionStorage.getItem('e2e.seeded')) return;
      sessionStorage.setItem('e2e.seeded', '1');
      localStorage.setItem(keys.access, seeded.accessToken);
      localStorage.setItem(keys.refresh, seeded.refreshToken);
    },
    { keys: { access: ACCESS_TOKEN_KEY, refresh: REFRESH_TOKEN_KEY }, tokens },
  );
}

export async function storedTokens(page: Page) {
  return page.evaluate(
    (keys) => ({ access: localStorage.getItem(keys.access), refresh: localStorage.getItem(keys.refresh) }),
    { access: ACCESS_TOKEN_KEY, refresh: REFRESH_TOKEN_KEY },
  );
}

export const test = base.extend<{ backend: MockBackend }>({
  backend: async ({ page }, use) => {
    const backend = new MockBackend();
    await backend.attach(page);
    await use(backend);
    if (backend.unhandled.length > 0) {
      throw new Error(`Unmocked backend requests: ${backend.unhandled.join(', ')}`);
    }
  },
});

export { expect } from '@playwright/test';
