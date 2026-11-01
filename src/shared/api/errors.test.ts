import { API_ERROR_KINDS, failureOf } from '@/shared/lib/failure';

import {
  apiErrorFromResponse,
  ApiException,
  errorCodeFromResponse,
  errorMessageFromBody,
  isAdminAccessLost,
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

// The backend sends the stable code of an error in the Error-Code header (CA-04), and will later
// answer an application/problem+json body (RFC 9457) with the same code (BE-32).
const problem = (code: string, detail: string) => ({
  type: `tag:hidalgojunior.com,2026:problem:${code}`,
  title: 'Forbidden',
  status: 403,
  detail,
  code,
});
const problemHeaders = { 'Content-Type': 'application/problem+json' };

describe('errorCodeFromResponse', () => {
  it.each([
    [
      'the Error-Code header',
      new Headers({ 'Error-Code': 'slot_watch_duplicate' }),
      'slot watch already exists',
      'slot_watch_duplicate',
    ],
    [
      'the code of a problem',
      new Headers(problemHeaders),
      problem('user_blocked', 'user is blocked'),
      'user_blocked',
    ],
    [
      'the header before the body',
      new Headers({ ...problemHeaders, 'Error-Code': 'forbidden' }),
      problem('user_blocked', 'x'),
      'forbidden',
    ],
    ['no code from an older backend', new Headers(), 'user is blocked', undefined],
    [
      'no code in a JSON body that is not a problem',
      new Headers({ 'Content-Type': 'application/json' }),
      { code: 'x' },
      undefined,
    ],
  ])('reads %s', (_, headers, body, expected) => {
    expect(errorCodeFromResponse(headers, body)).toBe(expected);
  });
});

describe('errorMessageFromBody with problem details', () => {
  it('reads the detail', () => {
    expect(errorMessageFromBody(problem('user_blocked', ' user is blocked '))).toBe('user is blocked');
  });
});

describe('apiErrorFromResponse with a code', () => {
  it('keeps the code next to the message', () => {
    expect(
      apiErrorFromResponse(
        409,
        'slot watch already exists',
        new Headers({ 'Error-Code': 'slot_watch_duplicate' }),
      ),
    ).toEqual({
      kind: 'conflict',
      status: 409,
      message: 'slot watch already exists',
      code: 'slot_watch_duplicate',
    });
  });

  it('reads a problem', () => {
    expect(
      apiErrorFromResponse(403, problem('user_blocked', 'user is blocked'), new Headers(problemHeaders)),
    ).toEqual({
      kind: 'forbidden',
      status: 403,
      message: 'user is blocked',
      code: 'user_blocked',
    });
  });
});

describe('isAdminAccessLost', () => {
  it.each([
    ['user_blocked', 'anything', true],
    ['forbidden', 'anything', true],
    ['appointment_forbidden', 'forbidden', false],
    ['customer_blocked', 'customer is blocked', false],
    [undefined, 'user is blocked', true],
    [undefined, 'forbidden', true],
    [undefined, 'appointment forbidden', false],
  ])('code %j, text %j → %s', (code, message, expected) => {
    expect(isAdminAccessLost(code, message)).toBe(expected);
  });
});

describe('unwrap with a code', () => {
  it('throws the code of the response', () => {
    const failure = () =>
      unwrap({
        error: 'slot taken',
        response: new Response(null, {
          status: 409,
          headers: { 'Error-Code': 'appointment_slot_unavailable' },
        }),
      });

    expect(failure).toThrow(
      expect.objectContaining({
        error: { kind: 'conflict', status: 409, message: 'slot taken', code: 'appointment_slot_unavailable' },
      }),
    );
  });
});
