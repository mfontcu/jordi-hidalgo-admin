// Contract drift check (ADR-003, "Quality gates"): regenerates the schema from
// contract/openapi.json and fails if it differs from the committed src/shared/api/schema.gen.ts.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const committedPath = resolve(root, 'src/shared/api/schema.gen.ts');
const tmp = mkdtempSync(join(tmpdir(), 'api-check-'));

try {
  const generatedPath = join(tmp, 'schema.gen.ts');
  execFileSync(
    resolve(root, 'node_modules/.bin/openapi-typescript'),
    [resolve(root, 'contract/openapi.json'), '-o', generatedPath],
    { stdio: 'pipe' },
  );

  if (readFileSync(generatedPath, 'utf8') !== readFileSync(committedPath, 'utf8')) {
    console.error(
      'src/shared/api/schema.gen.ts is out of date with contract/openapi.json: run `npm run api:generate`.',
    );
    process.exit(1);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

const source = JSON.parse(readFileSync(resolve(root, 'contract/SOURCE.json'), 'utf8'));
console.log(
  `API check passed: schema matches the contract of jordi_hidalgo_backend@${source.commit.slice(0, 7)}.`,
);
