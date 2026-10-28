// The staging Worker serves dist/ (AA-01). Without the single-page-application fallback, reloading
// a route such as /appointments answers 404 instead of index.html.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const config = JSON.parse(readFileSync(resolve(import.meta.dirname, '../wrangler.json'), 'utf8'));

describe('wrangler.json', () => {
  it.each([
    ['keeps the staging Worker name, so the workers.dev URL does not change', config.name, 'shy-rain-a1f2'],
    ['serves the Vite build', config.assets?.directory, './dist'],
    ['falls back to index.html for app routes', config.assets?.not_found_handling, 'single-page-application'],
    ['keeps the workers.dev URL enabled', config.workers_dev, true],
    ['publishes no per-version preview URLs', config.preview_urls, false],
  ])('%s', (_case, actual, expected) => {
    expect(actual).toBe(expected);
  });
});
