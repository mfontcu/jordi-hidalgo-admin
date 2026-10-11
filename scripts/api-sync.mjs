// Copies the backend's OpenAPI 3 contract at a given git ref into contract/ and regenerates the
// typed schema. Moving to a newer contract is always an explicit run of this script (ADR-003,
// "Contract drift check").
//
//   npm run api:sync -- <git-ref>
//
// BACKEND_REPO points at the jordi_hidalgo_backend checkout (default ../jordi_hidalgo_backend).
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ref = process.argv[2];
if (!ref) {
  console.error('usage: npm run api:sync -- <git-ref of jordi_hidalgo_backend>');
  process.exit(1);
}

const root = fileURLToPath(new URL('..', import.meta.url));
const backend = resolve(root, process.env.BACKEND_REPO ?? '../jordi_hidalgo_backend');
const git = (...args) => execFileSync('git', ['-C', backend, ...args], { encoding: 'utf8' });

const commit = git('rev-parse', '--verify', `${ref}^{commit}`).trim();
const contract = git('show', `${commit}:docs/openapi.json`);

writeFileSync(resolve(root, 'contract/openapi.json'), contract);
writeFileSync(
  resolve(root, 'contract/SOURCE.json'),
  `${JSON.stringify({ repository: 'jordi_hidalgo_backend', path: 'docs/openapi.json', commit }, null, 2)}\n`,
);
execFileSync('npm', ['run', '-s', 'api:generate'], { cwd: root, stdio: 'inherit' });

console.log(`Contract synced from jordi_hidalgo_backend@${commit.slice(0, 7)}.`);
