// Security headers for the Cloudflare hosts (AA-03). Pages and Workers static assets read
// dist/_headers; the nginx image sets the same headers from deploy/security-headers.conf.template,
// so that template is the single source and its ${API_ORIGIN} becomes the build's API origin.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TEMPLATE = resolve(import.meta.dirname, '../deploy/security-headers.conf.template');
const ADD_HEADER = /^add_header (\S+) "([^"]*)" always;$/;

/**
 * The `_headers` file for every path, from the nginx template and the API base URL of the build.
 * Throws on an invalid URL or a template line it does not understand, so the build fails.
 * @param {string} template
 * @param {string | undefined} apiBaseUrl
 * @returns {string}
 */
export function buildHeadersFile(template, apiBaseUrl) {
  const url = new URL(apiBaseUrl ?? '');
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`VITE_API_BASE_URL must be http(s): ${apiBaseUrl}`);
  }

  const headers = template
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'))
    .map((line) => {
      const match = ADD_HEADER.exec(line);
      if (!match) throw new Error(`Unexpected line in the security headers template: ${line}`);
      return `  ${match[1]}: ${match[2].replaceAll('${API_ORIGIN}', url.origin)}`;
    });
  if (headers.length === 0) throw new Error('The security headers template has no add_header line');

  return ['/*', ...headers, ''].join('\n');
}

/** Vite plugin that emits dist/_headers with the API origin the bundle is built with. */
export function securityHeaders() {
  /** @type {string | undefined} */
  let apiBaseUrl;
  return {
    name: 'security-headers',
    apply: /** @type {const} */ ('build'),
    /** @param {{ env: Record<string, string | undefined> }} config */
    configResolved(config) {
      apiBaseUrl = config.env.VITE_API_BASE_URL;
    },
    /** @this {{ emitFile: (file: { type: 'asset'; fileName: string; source: string }) => unknown }} */
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: '_headers',
        source: buildHeadersFile(readFileSync(TEMPLATE, 'utf8'), apiBaseUrl),
      });
    },
  };
}
