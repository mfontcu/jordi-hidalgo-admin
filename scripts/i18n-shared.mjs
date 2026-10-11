// Shared helpers for the i18n scripts.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { parse, TYPE } from '@formatjs/icu-messageformat-parser';

export const LOCALES = ['es', 'ca', 'en'];
export const SOURCE_LOCALE = 'es';

export const messagesDir = fileURLToPath(new URL('../src/shared/i18n/messages/', import.meta.url));

export function messagesPath(locale) {
  return `${messagesDir}${locale}.json`;
}

export function readMessages(locale) {
  return JSON.parse(readFileSync(messagesPath(locale), 'utf8'));
}

/** Names of the ICU arguments a message uses (placeholders, plural and select variables). */
export function argumentNames(message) {
  const names = new Set();
  const walk = (elements) => {
    for (const el of elements) {
      if (
        el.type === TYPE.argument ||
        el.type === TYPE.number ||
        el.type === TYPE.date ||
        el.type === TYPE.time
      ) {
        names.add(el.value);
      } else if (el.type === TYPE.plural || el.type === TYPE.select) {
        names.add(el.value);
        for (const option of Object.values(el.options)) walk(option.value);
      } else if (el.type === TYPE.tag) {
        walk(el.children);
      }
    }
  };
  walk(parse(message));
  return [...names].sort();
}
