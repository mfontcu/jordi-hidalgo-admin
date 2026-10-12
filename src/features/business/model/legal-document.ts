import { z } from 'zod';

import { orderedLocales, type PublicSurface } from './locales';

export const LEGAL_DOC_CODES = [
  'terms_of_use',
  'privacy_policy',
  'user_rights',
  'commercial_communications',
  'legal_notice',
  'cookie_policy',
] as const;

export type LegalDocCode = (typeof LEGAL_DOC_CODES)[number];

export const LEGAL_DOC_LABEL: Record<LegalDocCode, string> = {
  terms_of_use: 'legalDocTermsOfUse',
  privacy_policy: 'legalDocPrivacyPolicy',
  user_rights: 'legalDocUserRights',
  commercial_communications: 'legalDocCommercialCommunications',
  legal_notice: 'legalDocLegalNotice',
  cookie_policy: 'legalDocCookiePolicy',
};

export type LegalTranslation = {
  locale: string;
  title: string;
  content: string;
};

export type LegalDocument = {
  id: string;
  code: string;
  isActive: boolean;
  publicSurfaces: PublicSurface[];
  translations: LegalTranslation[];
};

export type LegalTranslationInput = {
  locale: string;
  title: string;
  content: string;
};

export const legalTranslationSchema = z.object({
  locale: z.string().min(1),
  title: z.string(),
  content: z.string(),
});

export function legalDocLabelId(code: string): string {
  return (LEGAL_DOC_LABEL as Record<string, string>)[code] ?? code;
}

export function translationFor(doc: LegalDocument, locale: string): LegalTranslation {
  return (
    doc.translations.find((item) => item.locale === locale) ?? {
      locale,
      title: '',
      content: '',
    }
  );
}

export function localesOf(doc: LegalDocument): string[] {
  return orderedLocales(doc.translations.map((item) => item.locale));
}

export function toLegalTranslationUpdate(input: LegalTranslationInput): LegalTranslationInput {
  return {
    locale: input.locale,
    title: input.title.trim(),
    content: input.content.trim(),
  };
}

/** Surfaces must keep at least one; an empty set is ignored (Flutter). */
export function nextSurfaces(
  current: PublicSurface[],
  surface: PublicSurface,
  enabled: boolean,
): PublicSurface[] | null {
  const set = new Set(current);
  if (enabled) set.add(surface);
  else set.delete(surface);
  if (set.size === 0) return null;
  return (['app', 'web'] as const).filter((item) => set.has(item));
}
