import { z } from 'zod';

import { orderedLocales } from './locales';

export type WebPageTranslation = {
  locale: string;
  title: string;
  content: string;
};

export type WebPage = {
  id: string;
  code: string;
  isActive: boolean;
  translations: WebPageTranslation[];
};

export type WebPageTranslationInput = {
  locale: string;
  title: string;
  content: string;
};

export const webPageTranslationSchema = z.object({
  locale: z.string().min(1),
  title: z.string(),
  content: z.string(),
});

const WEB_PAGE_LABEL: Record<string, string> = {
  support: 'businessWebPageSupport',
};

export function webPageLabelId(code: string): string {
  return WEB_PAGE_LABEL[code] ?? code;
}

export function translationFor(page: WebPage, locale: string): WebPageTranslation {
  return (
    page.translations.find((item) => item.locale === locale) ?? {
      locale,
      title: '',
      content: '',
    }
  );
}

export function localesOf(page: WebPage): string[] {
  return orderedLocales(page.translations.map((item) => item.locale));
}

export function toWebPageTranslationUpdate(input: WebPageTranslationInput): WebPageTranslationInput {
  return {
    locale: input.locale,
    title: input.title.trim(),
    content: input.content.trim(),
  };
}
