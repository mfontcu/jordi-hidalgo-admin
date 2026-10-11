// Checks the message files: same keys in every locale, valid ICU syntax, and the same ICU
// arguments for a key in every locale. Run by CI (`npm run i18n:check`).
import { argumentNames, LOCALES, readMessages, SOURCE_LOCALE } from './i18n-shared.mjs';

const messages = Object.fromEntries(LOCALES.map((locale) => [locale, readMessages(locale)]));
const sourceKeys = Object.keys(messages[SOURCE_LOCALE]);
const errors = [];

for (const locale of LOCALES) {
  const keys = new Set(Object.keys(messages[locale]));
  for (const key of sourceKeys) {
    if (!keys.has(key)) errors.push(`${locale}: missing key "${key}"`);
  }
  for (const key of keys) {
    if (!(key in messages[SOURCE_LOCALE])) errors.push(`${locale}: key "${key}" is not in ${SOURCE_LOCALE}`);
  }
}

for (const key of sourceKeys) {
  let expected;
  for (const locale of LOCALES) {
    const message = messages[locale][key];
    if (typeof message !== 'string') continue;
    let args;
    try {
      args = argumentNames(message).join(',');
    } catch (error) {
      errors.push(`${locale}: "${key}" is not valid ICU: ${error.message}`);
      continue;
    }
    if (expected === undefined) {
      expected = args;
    } else if (args !== expected) {
      errors.push(`${locale}: "${key}" uses arguments [${args}], ${SOURCE_LOCALE} uses [${expected}]`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  console.error(`\ni18n check failed: ${errors.length} problem(s).`);
  process.exit(1);
}

console.log(`i18n check passed: ${sourceKeys.length} keys in ${LOCALES.join(', ')}.`);
