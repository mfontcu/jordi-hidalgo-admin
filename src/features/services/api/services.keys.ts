import type { ServiceListParams } from '../model/services-search';

/**
 * Query keys of the services feature. Writes invalidate `lists()` (every page and filter) and the
 * `detail(id)` they change; the categories never change from the panel.
 */
export const servicesKeys = {
  all: ['services'] as const,
  lists: () => [...servicesKeys.all, 'list'] as const,
  list: (params: ServiceListParams) => [...servicesKeys.lists(), params] as const,
  details: () => [...servicesKeys.all, 'detail'] as const,
  detail: (serviceId: string) => [...servicesKeys.details(), serviceId] as const,
  categories: () => [...servicesKeys.all, 'categories'] as const,
};
