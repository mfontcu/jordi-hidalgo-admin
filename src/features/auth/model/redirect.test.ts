import { postSignInPath, sanitizeRedirect } from './redirect';

describe('sanitizeRedirect', () => {
  it.each([
    ['/', '/'],
    ['/services', '/services'],
    ['/appointments?status=pending&page=2', '/appointments?status=pending&page=2'],
    ['/business?tab=legal#terms', '/business?tab=legal#terms'],
  ])('keeps the panel path %s', (value, expected) => {
    expect(sanitizeRedirect(value)).toBe(expected);
  });

  it.each([
    ['another site', 'https://evil.example/'],
    ['a protocol-relative URL', '//evil.example/services'],
    ['a backslash trick', '/\\evil.example'],
    ['a javascript URL', 'javascript:alert(1)'],
    ['a relative path', 'services'],
    ['the login screen', '/login?redirect=/services'],
    ['the old auth gate', '/auth-gate'],
    ['a non-string', 42],
    ['nothing', undefined],
  ])('rejects %s', (_, value) => {
    expect(sanitizeRedirect(value)).toBeUndefined();
  });
});

describe('postSignInPath', () => {
  it('opens the requested path', () => {
    expect(postSignInPath('/clients?search=ana')).toBe('/clients?search=ana');
  });

  it('falls back to the dashboard', () => {
    expect(postSignInPath(undefined)).toBe('/');
    expect(postSignInPath('https://evil.example')).toBe('/');
  });
});
