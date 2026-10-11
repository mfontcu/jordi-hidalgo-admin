import { http, HttpResponse } from 'msw';

export const API = 'http://api.test';

export const STAFF_USER = {
  id: 'u-staff',
  email: 'staff@example.com',
  firstName: 'Jordi',
  lastName: 'Hidalgo',
  role: 'admin',
};

export const CUSTOMER_USER = { ...STAFF_USER, id: 'u-customer', role: 'customer' };

export const TOKENS = { accessToken: 'access-1', refreshToken: 'refresh-1' };

/** `POST /auth/login` answering with the given user, as the backend does. */
export function loginAs(user: typeof STAFF_USER) {
  return http.post(`${API}/auth/login`, () => HttpResponse.json({ ...TOKENS, user }));
}

/** `GET /auth/me` answering with the given user. */
export function meAs(user: typeof STAFF_USER) {
  return http.get(`${API}/auth/me`, () => HttpResponse.json(user));
}

/** An endpoint that answers a plain-text `http.Error`. */
export function plainError(method: 'get' | 'post', path: string, status: number, message: string) {
  return http[method](`${API}${path}`, () => new HttpResponse(`${message}\n`, { status }));
}
