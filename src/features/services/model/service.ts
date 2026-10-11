/** Locales a service is written in; the forms and the detail show them in this order. */
export const SERVICE_LOCALES = ['es', 'ca', 'en'] as const;
export type ServiceLocale = (typeof SERVICE_LOCALES)[number];

export type ServiceTranslation = { locale: string; name: string; description: string };

/**
 * A service of the catalog (app_models `Service`). `name`, `description`, and
 * `categoryDisplayName` come localized by the backend in the panel's language.
 */
export type Service = {
  id: string;
  serviceCategoryId: string;
  categoryCode: string;
  categoryDisplayName: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  isActive: boolean;
  displayOrder: number;
  showOnPublicSite: boolean;
  translations: ServiceTranslation[];
};

export type ServiceCategory = { id: string; code: string; name: string; displayOrder: number };

export type ServiceSummary = {
  totalServices: number;
  activeServices: number;
  inactiveServices: number;
  totalCategories: number;
};

/** One page of the services list, with the catalog summary. */
export type ServicePage = {
  items: Service[];
  page: number;
  pageSize: number;
  totalItems: number;
  summary: ServiceSummary;
};

/** `Service.formattedPrice`: two decimals and the euro sign, the same in every language. */
export function formatPrice(priceCents: number): string {
  return `${(priceCents / 100).toFixed(2)} €`;
}

/** `Service.formattedDuration`. */
export function formatDuration(durationMinutes: number): string {
  return `${durationMinutes} min`;
}

/** `resolvedCategoryLabel`: the backend's category name, else its code, else a dash. */
export function categoryLabel(service: Pick<Service, 'categoryDisplayName' | 'categoryCode'>): string {
  return service.categoryDisplayName.trim() || service.categoryCode.trim() || '—';
}

/** Category, duration, and price on one line, under the service's name in summaries. */
export function serviceLine(service: Service): string {
  return [
    categoryLabel(service),
    formatDuration(service.durationMinutes),
    formatPrice(service.priceCents),
  ].join(' · ');
}

/** A category as the selectors show it: its name, else its code, else a dash. */
export function categoryTitle(category: Pick<ServiceCategory, 'name' | 'code'>): string {
  return category.name.trim() || category.code.trim() || '—';
}

/** Categories in catalog order. */
export function sortCategories(categories: readonly ServiceCategory[]): ServiceCategory[] {
  return [...categories].sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Subtitle of the categories summary card: the first three names, then an ellipsis; null when
 * there is none, so the screen shows its default text.
 */
export function categoriesSummary(categories: readonly ServiceCategory[]): string | null {
  const names = categories.map((category) => category.name.trim() || category.code).filter(Boolean);
  if (names.length === 0) return null;
  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 3).join(', ')}…`;
}

/**
 * The service's name and description in a locale. A missing translation falls back to the
 * localized name and description, as the Flutter detail and form do.
 */
export function translationFor(
  service: Pick<Service, 'name' | 'description' | 'translations'>,
  locale: ServiceLocale,
): { name: string; description: string } {
  const translation = service.translations.find((item) => item.locale.toLowerCase() === locale);
  return translation
    ? { name: translation.name, description: translation.description }
    : { name: service.name, description: service.description };
}

/** The status pill of a service: label and tone. */
export function serviceStatus(isActive: boolean) {
  return isActive
    ? ({ label: 'serviceStatusActive', tone: 'success' } as const)
    : ({ label: 'serviceStatusInactive', tone: 'neutral' } as const);
}
