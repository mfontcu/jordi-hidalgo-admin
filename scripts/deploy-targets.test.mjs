// The Vite manifest (dist/.vite) is only for the bundle budget. The nginx image drops it; the
// Cloudflare deploys must drop it too, after the build and before publishing (AA-03).
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const dryRun = (target) =>
  execFileSync('make', ['--dry-run', '--always-make', target], {
    cwd: resolve(import.meta.dirname, '..'),
    encoding: 'utf8',
  }).split('\n');

describe('Cloudflare deploy targets', () => {
  it.each([
    ['deploy-staging', 'wrangler deploy'],
    ['deploy-prod', 'wrangler pages deploy dist'],
  ])('%s removes the Vite manifest between the build and %s', (target, publish) => {
    const lines = dryRun(target);
    const build = lines.findIndex((line) => line.includes('npm run build'));
    const removal = lines.findIndex((line) => line.trim() === 'rm -rf dist/.vite');
    const deploy = lines.findIndex((line) => line.startsWith(publish));

    expect(build).toBeGreaterThanOrEqual(0);
    expect(removal).toBeGreaterThan(build);
    expect(deploy).toBeGreaterThan(removal);
  });
});
