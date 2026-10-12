import { z } from 'zod';

import { BUSINESS_LOCALES, orderedLocales, type BusinessLocale } from './locales';

export type BusinessInfoTranslation = {
  locale: string;
  name: string;
  address: string;
  schedule: string;
  about: string;
  cancellationPolicy: string;
};

export type BusinessInfo = {
  id: string;
  email: string;
  phone: string;
  whatsappPhone: string;
  mapsUrl: string;
  instagramUrl: string;
  websiteUrl: string;
  isActive: boolean;
  translations: BusinessInfoTranslation[];
};

export type BusinessInfoFormInput = {
  email: string;
  phone: string;
  whatsappPhone: string;
  mapsUrl: string;
  instagramUrl: string;
  websiteUrl: string;
  isActive: boolean;
  /** Per-locale fields keyed by locale code. */
  translations: Record<
    string,
    {
      name: string;
      address: string;
      schedule: string;
      about: string;
      cancellationPolicy: string;
    }
  >;
};

export type BusinessInfoUpdate = {
  email: string;
  phone: string;
  whatsappPhone?: string;
  mapsUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  isActive: boolean;
  translations: {
    locale: string;
    name: string;
    address: string;
    schedule: string;
    about: string;
    cancellationPolicy: string;
  }[];
};

export type BusinessInfoFormErrorKey = 'businessFieldRequired';

const required = z
  .string()
  .trim()
  .min(1, 'businessFieldRequired' satisfies BusinessInfoFormErrorKey);

export const businessInfoFormSchema = z.object({
  email: required,
  phone: required,
  whatsappPhone: z.string(),
  mapsUrl: z.string(),
  instagramUrl: z.string(),
  websiteUrl: z.string(),
  isActive: z.boolean(),
  translations: z.record(
    z.string(),
    z.object({
      name: z.string(),
      address: z.string(),
      schedule: z.string(),
      about: z.string(),
      cancellationPolicy: z.string(),
    }),
  ),
});

function optionalOf(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function translationFor(info: BusinessInfo, locale: string): BusinessInfoTranslation {
  return (
    info.translations.find((item) => item.locale === locale) ?? {
      locale,
      name: '',
      address: '',
      schedule: '',
      about: '',
      cancellationPolicy: '',
    }
  );
}

export function localesOf(info: BusinessInfo): string[] {
  return orderedLocales(info.translations.map((item) => item.locale));
}

export function businessInfoFormValues(info: BusinessInfo): BusinessInfoFormInput {
  const locales = localesOf(info);
  const translations: BusinessInfoFormInput['translations'] = {};
  for (const locale of locales) {
    const row = translationFor(info, locale);
    translations[locale] = {
      name: row.name,
      address: row.address,
      schedule: row.schedule,
      about: row.about,
      cancellationPolicy: row.cancellationPolicy,
    };
  }
  return {
    email: info.email,
    phone: info.phone,
    whatsappPhone: info.whatsappPhone,
    mapsUrl: info.mapsUrl,
    instagramUrl: info.instagramUrl,
    websiteUrl: info.websiteUrl,
    isActive: info.isActive,
    translations,
  };
}

/** Empty optional contact fields become omitted on the wire, as Flutter does. */
export function toBusinessInfoUpdate(input: BusinessInfoFormInput): BusinessInfoUpdate {
  const locales = Object.keys(input.translations);
  const ordered = orderedLocales(locales);
  return {
    email: input.email.trim(),
    phone: input.phone.trim(),
    whatsappPhone: optionalOf(input.whatsappPhone),
    mapsUrl: optionalOf(input.mapsUrl),
    instagramUrl: optionalOf(input.instagramUrl),
    websiteUrl: optionalOf(input.websiteUrl),
    isActive: input.isActive,
    translations: ordered.map((locale) => {
      const row = input.translations[locale] ?? {
        name: '',
        address: '',
        schedule: '',
        about: '',
        cancellationPolicy: '',
      };
      return {
        locale,
        name: row.name.trim(),
        address: row.address.trim(),
        schedule: row.schedule.trim(),
        about: row.about.trim(),
        cancellationPolicy: row.cancellationPolicy.trim(),
      };
    }),
  };
}

export function isBusinessLocale(value: string): value is BusinessLocale {
  return (BUSINESS_LOCALES as readonly string[]).includes(value);
}
