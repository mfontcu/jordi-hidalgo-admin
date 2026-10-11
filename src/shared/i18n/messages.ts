import type { Locale } from './locales';
import type sourceMessages from './messages/es.json';

export type MessageId = keyof typeof sourceMessages;
export type Messages = Record<MessageId, string>;

const loaders: Record<Locale, () => Promise<{ default: Messages }>> = {
  es: () => import('./messages/es.json'),
  ca: () => import('./messages/ca.json'),
  en: () => import('./messages/en.json'),
};

const cache = new Map<Locale, Promise<Messages>>();

/** Loads a locale's messages once; each locale is its own chunk. */
export function loadMessages(locale: Locale): Promise<Messages> {
  let messages = cache.get(locale);
  if (!messages) {
    messages = loaders[locale]().then((module) => module.default);
    cache.set(locale, messages);
  }
  return messages;
}
