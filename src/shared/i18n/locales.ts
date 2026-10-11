export const LOCALES = ['es', 'ca', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'es';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * The locale to use when the staff member has not chosen one (app_core LocaleStore
 * `effectiveLanguageCode`): the browser's first language if the panel has it, else Spanish.
 * Flutter web reads the device locale from the first entry of `navigator.languages`.
 */
export function detectLocale(languages: readonly string[]): Locale {
  const primary = languages[0]?.split('-')[0]?.toLowerCase();
  return isLocale(primary) ? primary : DEFAULT_LOCALE;
}
