// Cloudflare (Pages and Workers static assets) reads dist/_headers (AA-03). The file must carry the
// nginx image's security headers, with the build's API origin in the Content-Security-Policy.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { buildHeadersFile, securityHeaders } from './security-headers.mjs';

const template = readFileSync(
  resolve(import.meta.dirname, '../deploy/security-headers.conf.template'),
  'utf8',
);
const STAGING = 'https://hidalgo-junior-backend-staging.up.railway.app';
const PRODUCTION = 'https://api.hidalgojunior.com';

const headerValue = (file, name) =>
  file
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith(`${name}: `))
    ?.slice(name.length + 2);
const connectSrc = (file) =>
  headerValue(file, 'Content-Security-Policy')
    ?.split(';')
    .map((directive) => directive.trim())
    .find((directive) => directive.startsWith('connect-src '));

describe('buildHeadersFile', () => {
  it.each([
    ['allows the staging API', STAGING, STAGING],
    ['allows the production API', PRODUCTION, PRODUCTION],
    ['keeps only the origin of a URL with a trailing slash', `${PRODUCTION}/`, PRODUCTION],
    ['keeps only the origin of a URL with a path', `${PRODUCTION}/v1`, PRODUCTION],
    ['allows the R2 presigned uploads', PRODUCTION, 'https://*.r2.cloudflarestorage.com'],
  ])('%s', (_case, apiBaseUrl, source) => {
    expect(connectSrc(buildHeadersFile(template, apiBaseUrl))?.split(' ')).toContain(source);
  });

  it.each([
    ['applies to every path', (file) => file.split('\n')[0], '/*'],
    ['leaves no placeholder', (file) => file.includes('${'), false],
    ['does not allow a path in connect-src', (file) => connectSrc(file)?.includes(`${PRODUCTION}/`), false],
  ])('%s', (_case, read, expected) => {
    expect(read(buildHeadersFile(template, `${PRODUCTION}/v1`))).toBe(expected);
  });

  // Every header of the nginx image, with the same value, so the two hosts cannot drift apart.
  const nginxHeaders = [...template.matchAll(/^add_header (\S+) "([^"]*)" always;$/gm)].map(
    ([, name, value]) => [name, value.replace('${API_ORIGIN}', PRODUCTION)],
  );

  it('reads the four nginx headers', () => {
    expect(nginxHeaders.map(([name]) => name)).toEqual([
      'Content-Security-Policy',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
    ]);
  });

  it.each(nginxHeaders)('sends %s as nginx does', (name, value) => {
    expect(headerValue(buildHeadersFile(template, PRODUCTION), name)).toBe(value);
  });

  it.each([
    ['an empty API URL', template, ''],
    ['a missing API URL', template, undefined],
    ['an API URL that is not http(s)', template, 'ftp://api.hidalgojunior.com'],
    ['a template line it does not understand', `${template}add_header X-Frame-Options DENY;\n`, PRODUCTION],
    ['a template with no headers', '# nothing\n', PRODUCTION],
  ])('refuses %s', (_case, input, apiBaseUrl) => {
    expect(() => buildHeadersFile(input, apiBaseUrl)).toThrow();
  });
});

describe('securityHeaders Vite plugin', () => {
  const emitted = (apiBaseUrl) => {
    const plugin = securityHeaders();
    plugin.configResolved({ env: { VITE_API_BASE_URL: apiBaseUrl } });
    const emitFile = vi.fn();
    plugin.generateBundle.call({ emitFile });
    return emitFile.mock.calls[0]?.[0];
  };

  it.each([
    ['runs only on build', securityHeaders().apply, 'build'],
    ['emits dist/_headers', emitted(STAGING)?.fileName, '_headers'],
    ['emits it as an asset', emitted(STAGING)?.type, 'asset'],
    ['uses the build API origin', connectSrc(emitted(STAGING)?.source ?? '')?.includes(STAGING), true],
  ])('%s', (_case, actual, expected) => {
    expect(actual).toBe(expected);
  });
});
