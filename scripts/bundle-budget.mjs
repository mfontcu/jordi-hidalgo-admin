// Bundle budget (ADR-003, "Quality gates"): gzip size of the JavaScript the first page load needs
// (the entry chunk and its static imports) and of the largest lazy chunk. Run after a build.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = { initial: 180, lazyChunk: 60 };

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const manifest = JSON.parse(readFileSync(resolve(dist, '.vite/manifest.json'), 'utf8'));
const gzipKb = (file) => gzipSync(readFileSync(resolve(dist, file))).length / 1024;

const entry = Object.keys(manifest).find((key) => manifest[key].isEntry);
const initial = new Set();
const visit = (key) => {
  const chunk = manifest[key];
  if (!chunk || initial.has(chunk.file)) return;
  initial.add(chunk.file);
  for (const imported of chunk.imports ?? []) visit(imported);
};
visit(entry);

const initialKb = [...initial].reduce((sum, file) => sum + gzipKb(file), 0);
const lazy = Object.values(manifest)
  .map((chunk) => chunk.file)
  .filter((file) => file.endsWith('.js') && !initial.has(file))
  .map((file) => ({ file, kb: gzipKb(file) }))
  .sort((a, b) => b.kb - a.kb);

const lines = [`initial JS: ${initialKb.toFixed(1)} kB gzip (budget ${BUDGET_KB.initial} kB)`];
if (lazy[0]) {
  lines.push(
    `largest lazy chunk: ${lazy[0].file} ${lazy[0].kb.toFixed(1)} kB gzip (budget ${BUDGET_KB.lazyChunk} kB)`,
  );
}
console.log(lines.join('\n'));

if (initialKb > BUDGET_KB.initial || (lazy[0] && lazy[0].kb > BUDGET_KB.lazyChunk)) {
  console.error('Bundle budget exceeded.');
  process.exit(1);
}
