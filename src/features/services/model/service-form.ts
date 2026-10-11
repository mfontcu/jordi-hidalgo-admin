import { z } from 'zod';

import { translationFor, type Service, type ServiceCategory, type ServiceLocale } from './service';

/**
 * The service form (service_form.dart). Creating a service and creating a new version of one are
 * the same request: a new version is a create prefilled from the base service.
 */
export type ServiceFormInput = {
  nameEs: string;
  nameCa: string;
  nameEn: string;
  serviceCategoryId: string;
  durationMinutes: string;
  price: string;
  displayOrder: string;
  descriptionEs: string;
  descriptionCa: string;
  descriptionEn: string;
  isActive: boolean;
  showOnPublicSite: boolean;
};

/** `POST /admin/services`, in view-model terms. */
export type CreateServiceInput = {
  serviceCategoryId: string;
  durationMinutes: number;
  priceCents: number;
  isActive: boolean;
  displayOrder: number;
  showOnPublicSite: boolean;
  translations: { locale: ServiceLocale; name: string; description: string }[];
};

export type ServiceFormErrorKey =
  | 'serviceFormNameEsRequired'
  | 'serviceFormNameCaRequired'
  | 'serviceFormNameEnRequired'
  | 'serviceFormCategoryHint'
  | 'serviceFormDurationRequired'
  | 'serviceFormPriceRequired'
  | 'serviceFormPriorityRequired';

const required = (message: ServiceFormErrorKey) => z.string().trim().min(1, message);

/** A whole number, ≥ `min`; text the user typed. */
function parseInteger(value: string, min: number): number | null {
  const trimmed = value.trim();
  if (!/^[+-]?\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) && parsed >= min ? parsed : null;
}

/** A price in euros with a comma or a point; null when it is not a number ≥ 0. */
export function parsePrice(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return parsed >= 0 ? parsed : null;
}

/** The catalog order: a whole number ≥ 0, else null (`_DisplayOrderEditor._save`). */
export function parseDisplayOrder(value: string): number | null {
  return parseInteger(value, 0);
}

/**
 * Validation on submit. Flutter checks that the duration and the price are not empty and then
 * drops an unparsable value without a message; here the same message reports it.
 */
export const serviceFormSchema = z
  .object({
    nameEs: required('serviceFormNameEsRequired'),
    nameCa: required('serviceFormNameCaRequired'),
    nameEn: required('serviceFormNameEnRequired'),
    serviceCategoryId: required('serviceFormCategoryHint'),
    durationMinutes: z
      .string()
      .refine((value) => parseInteger(value, 1) !== null, 'serviceFormDurationRequired'),
    price: z.string().refine((value) => parsePrice(value) !== null, 'serviceFormPriceRequired'),
    displayOrder: z
      .string()
      .refine((value) => parseDisplayOrder(value) !== null, 'serviceFormPriorityRequired'),
    descriptionEs: z.string(),
    descriptionCa: z.string(),
    descriptionEn: z.string(),
    isActive: z.boolean(),
    showOnPublicSite: z.boolean(),
  })
  .transform((values): CreateServiceInput => ({
    serviceCategoryId: values.serviceCategoryId,
    durationMinutes: parseInteger(values.durationMinutes, 1) ?? 0,
    priceCents: Math.round((parsePrice(values.price) ?? 0) * 100),
    isActive: values.isActive,
    displayOrder: parseDisplayOrder(values.displayOrder) ?? 0,
    showOnPublicSite: values.showOnPublicSite,
    translations: [
      { locale: 'es', name: values.nameEs.trim(), description: values.descriptionEs.trim() },
      { locale: 'ca', name: values.nameCa.trim(), description: values.descriptionCa.trim() },
      { locale: 'en', name: values.nameEn.trim(), description: values.descriptionEn.trim() },
    ],
  }));

/** A price as the Flutter web form fills it in (`double.toString` compiled to JS): `28`, `12.5`. */
export function priceText(priceCents: number): string {
  return priceCents === 0 ? '' : String(priceCents / 100);
}

/**
 * The category the form starts with: the base service's, by id and then by code; else the first
 * category of the catalog, as the Flutter form does for a new service.
 */
export function initialCategoryId(base: Service | null, categories: readonly ServiceCategory[]): string {
  const byId = base?.serviceCategoryId.trim() ?? '';
  if (byId && categories.some((category) => category.id === byId)) return byId;
  const byCode = categories.find((category) => category.code === (base?.categoryCode.trim() ?? ''));
  if (byCode) return byCode.id;
  return categories[0]?.id ?? '';
}

/** The form's starting values: empty for a new service, the base service's for a new version. */
export function serviceFormDefaults(
  base: Service | null,
  categories: readonly ServiceCategory[],
): ServiceFormInput {
  const text = (locale: ServiceLocale) =>
    base ? translationFor(base, locale) : { name: '', description: '' };
  const es = text('es');
  const ca = text('ca');
  const en = text('en');
  return {
    nameEs: es.name,
    nameCa: ca.name,
    nameEn: en.name,
    serviceCategoryId: initialCategoryId(base, categories),
    durationMinutes: String(base?.durationMinutes ?? 15),
    price: base ? priceText(base.priceCents) : '',
    displayOrder: String(base?.displayOrder ?? 0),
    descriptionEs: es.description,
    descriptionCa: ca.description,
    descriptionEn: en.description,
    isActive: base?.isActive ?? true,
    showOnPublicSite: base?.showOnPublicSite ?? false,
  };
}
