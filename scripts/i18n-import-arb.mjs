// One-off import of the Flutter admin panel's ARB files into src/shared/i18n/messages (ADR-003,
// "Localization"). Keys and ICU text are kept; the Flutter-only `@key` metadata is dropped, and
// every locale follows the key order of the Spanish template.
//
//   npm run i18n:import-arb -- [arb-dir]
//
// arb-dir defaults to ../jordi_hidalgo_app/apps/admin_app/lib/l10n.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { LOCALES, messagesPath, SOURCE_LOCALE } from './i18n-shared.mjs';

const arbDir = resolve(process.argv[2] ?? '../jordi_hidalgo_app/apps/admin_app/lib/l10n');

function readArb(locale) {
  const arb = JSON.parse(readFileSync(`${arbDir}/app_${locale}.arb`, 'utf8'));
  return Object.fromEntries(Object.entries(arb).filter(([key]) => !key.startsWith('@')));
}

const arbs = Object.fromEntries(LOCALES.map((locale) => [locale, readArb(locale)]));
const order = Object.keys(arbs[SOURCE_LOCALE]);

for (const locale of LOCALES) {
  const out = {};
  for (const key of order) {
    const message = arbs[locale][key];
    if (message === undefined) continue;
    // Flutter's gen-l10n treats `'` as a literal; ICU (FormatJS) treats `'` before `{`, `}`, `#`,
    // or `'` as an escape. Stop instead of guessing.
    if (/'[{}#']/.test(message)) {
      throw new Error(`${locale}: "${key}" has an apostrophe ICU would read as an escape: ${message}`);
    }
    out[key] = message;
  }
  writeFileSync(messagesPath(locale), `${JSON.stringify(out, null, 2)}\n`);
  console.log(`${locale}: ${Object.keys(out).length} messages`);
}
