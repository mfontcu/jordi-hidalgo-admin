import { delay, http, HttpResponse } from 'msw';

import { server } from '@/test/msw/server';

import { createApiClient } from '../client';
import { ApiException, unwrap } from '../errors';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, session, useSessionStore } from '../session-store';

const baseUrl = 'http://api.test';
const client = () => createApiClient({ baseUrl, getLocale: () => 'es' });

const OLD = { accessToken: 'access-old', refreshToken: 'refresh-old' };
const NEW = { accessToken: 'access-new', refreshToken: 'refresh-new' };

/** /admin/business-hours answers 401 to the old token and 200 to the new one. */
function protectedEndpoint() {
  const seen: (string | null)[] = [];
  server.use(
    http.get(`${baseUrl}/admin/business-hours`, ({ request }) => {
      const authorization = request.headers.get('Authorization');
      seen.push(authorization);
      return authorization === `Bearer ${NEW.accessToken}`
        ? HttpResponse.json([])
        : new HttpResponse('unauthorized', { status: 401 });
    }),
  );
  return seen;
}

function refreshEndpoint(respond: () => Response | Promise<Response>) {
  const bodies: unknown[] = [];
  server.use(
    http.post(`${baseUrl}/auth/refresh`, async ({ request }) => {
      bodies.push(await request.json());
      // Keeps the refresh in flight long enough for every concurrent 401 to arrive.
      await delay(20);
      return respond();
    }),
  );
  return bodies;
}

const refreshOk = () => HttpResponse.json({ ...NEW, user: { id: 'u1', role: 'admin' } });

let expiredCount = 0;
let unsubscribe: () => void;

beforeEach(() => {
  session.setTokens(OLD);
  expiredCount = 0;
  unsubscribe = session.onExpired(() => {
    expiredCount += 1;
  });
});

afterEach(() => {
  unsubscribe();
  session.clear();
});

describe('sessionMiddleware', () => {
  it('sends the access token as a Bearer header', async () => {
    let authorization: string | null = null;
    server.use(
      http.get(`${baseUrl}/admin/business-hours`, ({ request }) => {
        authorization = request.headers.get('Authorization');
        return HttpResponse.json([]);
      }),
    );

    await client().GET('/admin/business-hours');

    expect(authorization).toBe('Bearer access-old');
  });

  it('shares one refresh between concurrent 401s and retries each request once', async () => {
    const seen = protectedEndpoint();
    const refreshes = refreshEndpoint(refreshOk);
    const api = client();

    const results = await Promise.all(Array.from({ length: 5 }, () => api.GET('/admin/business-hours')));

    expect(results.map(({ response }) => response.status)).toEqual([200, 200, 200, 200, 200]);
    expect(refreshes).toEqual([{ refreshToken: 'refresh-old' }]);
    expect(seen.filter((header) => header === 'Bearer access-old')).toHaveLength(5);
    expect(seen.filter((header) => header === 'Bearer access-new')).toHaveLength(5);
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('access-new');
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('refresh-new');
    expect(expiredCount).toBe(0);
  });

  it('retries a 401 that arrives after the refresh with the new token, without refreshing again', async () => {
    const refreshes = refreshEndpoint(refreshOk);
    let calls = 0;
    server.use(
      http.get(`${baseUrl}/admin/business-hours`, async ({ request }) => {
        if (request.headers.get('Authorization') === `Bearer ${NEW.accessToken}`)
          return HttpResponse.json([]);
        // The first request's 401 arrives late, once the second request already refreshed.
        calls += 1;
        if (calls === 1) await delay(100);
        return new HttpResponse('unauthorized', { status: 401 });
      }),
    );
    const api = client();

    const results = await Promise.all([api.GET('/admin/business-hours'), api.GET('/admin/business-hours')]);

    expect(results.map(({ response }) => response.status)).toEqual([200, 200]);
    expect(refreshes).toHaveLength(1);
  });

  it('keeps the request body for the retry', async () => {
    refreshEndpoint(refreshOk);
    const bodies: unknown[] = [];
    server.use(
      http.post(`${baseUrl}/admin/blocked-slots`, async ({ request }) => {
        bodies.push(await request.json());
        return request.headers.get('Authorization') === `Bearer ${NEW.accessToken}`
          ? HttpResponse.json({ id: 'b1' })
          : new HttpResponse('unauthorized', { status: 401 });
      }),
    );

    const { response } = await client().POST('/admin/blocked-slots', { body: { reason: 'Formación' } });

    expect(response.status).toBe(200);
    expect(bodies).toEqual([{ reason: 'Formación' }, { reason: 'Formación' }]);
  });

  it('retries only once: a second 401 is returned as is', async () => {
    const refreshes = refreshEndpoint(refreshOk);
    let calls = 0;
    server.use(
      http.get(`${baseUrl}/admin/business-hours`, () => {
        calls += 1;
        return new HttpResponse('unauthorized', { status: 401 });
      }),
    );

    const result = await client().GET('/admin/business-hours');

    expect(result.response.status).toBe(401);
    expect(calls).toBe(2);
    expect(refreshes).toHaveLength(1);
    expect(() => unwrap(result)).toThrow(ApiException);
  });

  it.each([401, 403])('expires the session once when the refresh answers %i', async (status) => {
    protectedEndpoint();
    refreshEndpoint(() => new HttpResponse('invalid refresh token', { status }));
    const api = client();

    const results = await Promise.all([api.GET('/admin/business-hours'), api.GET('/admin/business-hours')]);

    expect(results.map(({ response }) => response.status)).toEqual([401, 401]);
    expect(expiredCount).toBe(1);
    expect(useSessionStore.getState()).toMatchObject({
      accessToken: null,
      refreshToken: null,
      expired: true,
    });
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });

  it('expires the session when there is no refresh token', async () => {
    useSessionStore.setState({ refreshToken: null });
    protectedEndpoint();

    const { response } = await client().GET('/admin/business-hours');

    expect(response.status).toBe(401);
    expect(expiredCount).toBe(1);
  });

  it('keeps the tokens and fails as a network error when the refresh fails with a 5xx', async () => {
    protectedEndpoint();
    refreshEndpoint(() => new HttpResponse('internal error', { status: 503 }));

    await expect(client().GET('/admin/business-hours')).rejects.toMatchObject({ error: { kind: 'network' } });
    expect(expiredCount).toBe(0);
    expect(useSessionStore.getState()).toMatchObject(OLD);
  });

  it('keeps the tokens when the refresh cannot reach the server', async () => {
    protectedEndpoint();
    refreshEndpoint(() => HttpResponse.error());

    await expect(client().GET('/admin/business-hours')).rejects.toMatchObject({ error: { kind: 'network' } });
    expect(useSessionStore.getState()).toMatchObject(OLD);
  });

  it('expires the session on a 403 "user is blocked"', async () => {
    server.use(
      http.get(
        `${baseUrl}/admin/business-hours`,
        () => new HttpResponse('user is blocked\n', { status: 403 }),
      ),
    );

    const result = await client().GET('/admin/business-hours');

    expect(() => unwrap(result)).toThrow(ApiException);
    expect(result.response.status).toBe(403);
    expect(expiredCount).toBe(1);
    expect(useSessionStore.getState().accessToken).toBeNull();
  });

  it('keeps the session on any other 403', async () => {
    server.use(
      http.get(`${baseUrl}/admin/business-hours`, () => new HttpResponse('forbidden', { status: 403 })),
    );

    await client().GET('/admin/business-hours');

    expect(expiredCount).toBe(0);
    expect(useSessionStore.getState()).toMatchObject(OLD);
  });

  it('neither authorizes nor refreshes the sign-in request', async () => {
    const refreshes = refreshEndpoint(refreshOk);
    let authorization: string | null = 'unset';
    server.use(
      http.post(`${baseUrl}/auth/login`, ({ request }) => {
        authorization = request.headers.get('Authorization');
        return new HttpResponse('invalid credentials', { status: 401 });
      }),
    );

    const { response } = await client().POST('/auth/login', { body: { email: 'a@b.c', password: 'x' } });

    expect(response.status).toBe(401);
    expect(authorization).toBeNull();
    expect(refreshes).toHaveLength(0);
    expect(expiredCount).toBe(0);
  });

  it('turns a transport failure into a network ApiException', async () => {
    server.use(http.get(`${baseUrl}/admin/business-hours`, () => HttpResponse.error()));

    await expect(client().GET('/admin/business-hours')).rejects.toMatchObject({
      name: 'ApiException',
      error: { kind: 'network' },
    });
  });
});
