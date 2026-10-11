import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import { session, useSessionStore } from '@/shared/api';
import { API, CUSTOMER_USER, loginAs, meAs, plainError, STAFF_USER, TOKENS } from '@/test/msw/auth';
import { server } from '@/test/msw/server';

import { authKeys } from './auth.keys';
import { loginFailureOf, restoreSession, signIn, signOut } from './session';

let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient();
  session.clear();
});

describe('restoreSession', () => {
  it('returns null without a stored token, without calling the backend', async () => {
    let called = false;
    server.use(
      http.get(`${API}/auth/me`, () => {
        called = true;
        return HttpResponse.json(STAFF_USER);
      }),
    );

    await expect(restoreSession(queryClient)).resolves.toBeNull();
    expect(called).toBe(false);
  });

  it('restores a staff member from the stored token', async () => {
    session.setTokens(TOKENS);
    server.use(meAs(STAFF_USER));

    await expect(restoreSession(queryClient)).resolves.toMatchObject({
      email: 'staff@example.com',
      role: 'admin',
    });
    expect(queryClient.getQueryData(authKeys.me())).toMatchObject({ id: 'u-staff' });
  });

  it('asks the backend once per session', async () => {
    session.setTokens(TOKENS);
    let calls = 0;
    server.use(
      http.get(`${API}/auth/me`, () => {
        calls += 1;
        return HttpResponse.json(STAFF_USER);
      }),
    );

    await Promise.all([restoreSession(queryClient), restoreSession(queryClient)]);
    await restoreSession(queryClient);

    expect(calls).toBe(1);
  });

  it('signs a customer account out, with no expiry notice', async () => {
    session.setTokens(TOKENS);
    server.use(meAs(CUSTOMER_USER));

    await expect(restoreSession(queryClient)).resolves.toBeNull();
    expect(useSessionStore.getState()).toMatchObject({
      accessToken: null,
      refreshToken: null,
      expired: false,
    });
  });

  it('expires the session when the refresh is rejected', async () => {
    session.setTokens(TOKENS);
    server.use(
      plainError('get', '/auth/me', 401, 'unauthorized'),
      plainError('post', '/auth/refresh', 401, 'unauthorized'),
    );

    await expect(restoreSession(queryClient)).resolves.toBeNull();
    expect(useSessionStore.getState()).toMatchObject({ accessToken: null, expired: true });
  });

  it('expires the session of a blocked user', async () => {
    session.setTokens(TOKENS);
    server.use(plainError('get', '/auth/me', 403, 'user is blocked'));

    await expect(restoreSession(queryClient)).resolves.toBeNull();
    expect(useSessionStore.getState()).toMatchObject({ accessToken: null, expired: true });
  });

  it.each([
    ['the backend is unreachable', http.get(`${API}/auth/me`, () => HttpResponse.error())],
    ['the backend fails', plainError('get', '/auth/me', 500, 'internal error')],
  ])('keeps the tokens when %s', async (_, handler) => {
    session.setTokens(TOKENS);
    server.use(handler);

    await expect(restoreSession(queryClient)).resolves.toBeNull();
    expect(useSessionStore.getState()).toMatchObject({ ...TOKENS, expired: false });
  });
});

describe('signIn', () => {
  const credentials = { email: 'staff@example.com', password: 'secret' };

  it('stores the tokens and the staff member', async () => {
    let body: unknown;
    server.use(
      http.post(`${API}/auth/login`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...TOKENS, user: STAFF_USER });
      }),
    );

    await expect(signIn(queryClient, credentials)).resolves.toMatchObject({ id: 'u-staff' });
    expect(body).toEqual(credentials);
    expect(useSessionStore.getState()).toMatchObject(TOKENS);
    expect(queryClient.getQueryData(authKeys.me())).toMatchObject({ id: 'u-staff' });
  });

  it('clears the previous session first', async () => {
    session.setTokens({ accessToken: 'stale', refreshToken: 'stale' });
    queryClient.setQueryData(['clients'], ['stale']);
    server.use(plainError('post', '/auth/login', 401, 'invalid credentials'));

    await expect(signIn(queryClient, credentials)).rejects.toThrow();
    expect(useSessionStore.getState().accessToken).toBeNull();
    expect(queryClient.getQueryData(['clients'])).toBeUndefined();
  });

  it('refuses a customer account and stores no token', async () => {
    server.use(loginAs(CUSTOMER_USER));

    const failure = await signIn(queryClient, credentials).catch(loginFailureOf);

    expect(failure).toBe('noAdminAccess');
    expect(useSessionStore.getState().accessToken).toBeNull();
  });

  it.each([
    ['invalidCredentials', plainError('post', '/auth/login', 401, 'invalid credentials')],
    ['failed', plainError('post', '/auth/login', 403, 'user is blocked')],
    ['failed', plainError('post', '/auth/login', 403, 'user is inactive')],
    ['failed', plainError('post', '/auth/login', 429, 'too many requests')],
    ['server', plainError('post', '/auth/login', 500, 'internal error')],
    ['network', http.post(`${API}/auth/login`, () => HttpResponse.error())],
    ['unknown', http.post(`${API}/auth/login`, () => HttpResponse.json({ user: STAFF_USER }))],
  ])('reports %s', async (expected, handler) => {
    server.use(handler);

    await expect(signIn(queryClient, credentials).catch(loginFailureOf)).resolves.toBe(expected);
  });

  it('does not expire anything when a blocked user tries to sign in', async () => {
    server.use(plainError('post', '/auth/login', 403, 'user is blocked'));

    await signIn(queryClient, credentials).catch(() => undefined);

    expect(useSessionStore.getState().expired).toBe(false);
  });
});

describe('signOut', () => {
  it('clears the tokens and the cache, with no expiry notice', () => {
    session.setTokens(TOKENS);
    queryClient.setQueryData(authKeys.me(), STAFF_USER);

    signOut(queryClient);

    expect(useSessionStore.getState()).toMatchObject({
      accessToken: null,
      refreshToken: null,
      expired: false,
    });
    expect(queryClient.getQueryData(authKeys.me())).toBeUndefined();
  });
});
