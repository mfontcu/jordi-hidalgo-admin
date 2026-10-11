import {
  apiErrorFromResponse,
  ApiException,
  errorMessageFromBody,
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
