/** Locales the business CMS edits, in the Flutter panel's preferred order. */
export const BUSINESS_LOCALES = ['es', 'ca', 'en'] as const;
export type BusinessLocale = (typeof BUSINESS_LOCALES)[number];

export const BUSINESS_LOCALE_LABEL: Record<
  BusinessLocale,
  'businessLocaleSpanish' | 'businessLocaleCatalan' | 'businessLocaleEnglish'
> = {
  es: 'businessLocaleSpanish',
  ca: 'businessLocaleCatalan',
  en: 'businessLocaleEnglish',
};

/** Public surfaces shared by legal documents and gallery slides (`app` / `web`). */
export const PUBLIC_SURFACES = ['app', 'web'] as const;
export type PublicSurface = (typeof PUBLIC_SURFACES)[number];

export function isPublicSurface(value: string): value is PublicSurface {
  return (PUBLIC_SURFACES as readonly string[]).includes(value);
}

/** Prefer es → ca → en, then any remaining locales the backend sent. */
export function orderedLocales(locales: Iterable<string>): string[] {
  const set = new Set(locales);
  const preferred = BUSINESS_LOCALES.filter((locale) => set.has(locale));
  const rest = [...set].filter((locale) => !(BUSINESS_LOCALES as readonly string[]).includes(locale)).sort();
  return preferred.length > 0 || rest.length > 0 ? [...preferred, ...rest] : [...BUSINESS_LOCALES];
}
