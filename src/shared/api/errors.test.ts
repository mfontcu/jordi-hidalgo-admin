import { API_ERROR_KINDS, failureOf } from '@/shared/lib/failure';

import {
  apiErrorFromResponse,
  ApiException,
  errorMessageFromBody,
  isAdminAccessLostMessage,
  isBlockedUserMessage,
  unwrap,
} from './errors';

describe('apiErrorFromResponse', () => {
  it.each([
    [400, 'validation'],
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'notFound'],
    [409, 'conflict'],
    [422, 'validation'],
    [429, 'rateLimited'],
    [500, 'server'],
    [503, 'server'],
  ] as const)('maps %i to %s, keeping the status', (status, kind) => {
    expect(apiErrorFromResponse(status, 'message')).toEqual({ kind, status, message: 'message' });
  });
});

describe('errorMessageFromBody', () => {
  it('reads the plain-text body of http.Error, trimmed', () => {
    expect(errorMessageFromBody('invalid credentials\n')).toBe('invalid credentials');
  });

  it('reads a JSON message', () => {
    expect(errorMessageFromBody({ message: ' slot taken ' })).toBe('slot taken');
  });

  it('falls back to an empty message', () => {
    expect(errorMessageFromBody(undefined)).toBe('');
    expect(errorMessageFromBody({ code: 1 })).toBe('');
  });
});

describe('isBlockedUserMessage', () => {
  it('matches the backend message in any case', () => {
    expect(isBlockedUserMessage('User is blocked')).toBe(true);
    expect(isBlockedUserMessage('forbidden')).toBe(false);
  });
});

describe('isAdminAccessLostMessage', () => {
  it.each([
    ['user is blocked', true],
    ['User is blocked\n', true],
    ['forbidden', true],
    ['Forbidden\n', true],
    ['admin users cannot delete their account from this app', false],
    ['customer is blocked', false],
    ['appointment forbidden', false],
  ])('%j → %s', (message, expected) => {
    expect(isAdminAccessLostMessage(message)).toBe(expected);
  });
});

describe('unwrap', () => {
  it('returns the data of a successful response', () => {
    expect(unwrap({ data: { id: 1 }, response: new Response(null, { status: 200 }) })).toEqual({ id: 1 });
  });

  it('throws an ApiException with the status and the backend message', () => {
    const failure = () => unwrap({ error: 'slot taken', response: new Response(null, { status: 409 }) });

    expect(failure).toThrow(ApiException);
    expect(failure).toThrow(
      expect.objectContaining({ error: { kind: 'conflict', status: 409, message: 'slot taken' } }),
    );
  });
});

describe('failureOf (shared/lib)', () => {
  it('reads every ApiException class, so screens can present it without importing shared/api', () => {
    expect(failureOf(new ApiException({ kind: 'network' }))).toEqual({ kind: 'network', message: '' });
    for (const status of [400, 401, 403, 404, 409, 429, 500, 503]) {
      const error = apiErrorFromResponse(status, 'backend text');
      expect(API_ERROR_KINDS).toContain(error.kind);
      expect(failureOf(new ApiException(error))).toEqual(error);
    }
  });
});
