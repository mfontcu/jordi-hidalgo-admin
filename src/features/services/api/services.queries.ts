import { queryOptions } from '@tanstack/react-query';

import { apiClient, unwrap } from '@/shared/api';

import { sortCategories } from '../model/service';
import type { ServiceListParams } from '../model/services-search';
import { servicesKeys } from './services.keys';
import { toService, toServiceCategory, toServicePage } from './services.mappers';

// The backend localizes service names, descriptions, and category names from `Accept-Language`,
// so every query here is refetched on a language change (`meta.localized`).

/**
 * Long enough for the screen to take over what its route loader fetched without asking again;
 * a later visit refetches, as the Flutter screens reload on entry. Writes invalidate at once.
 */
const STALE_TIME = 10_000;

/** One page of `GET /admin/services`, with the catalog summary. */
export function servicesListQueryOptions(params: ServiceListParams) {
  return queryOptions({
    queryKey: servicesKeys.list(params),
    queryFn: async ({ signal }) => {
      const query = {
        page: params.page,
        pageSize: params.pageSize,
        status: params.status,
        ...(params.search ? { search: params.search } : {}),
        ...(params.categoryCode ? { categoryCode: params.categoryCode } : {}),
      };
      return toServicePage(unwrap(await apiClient.GET('/admin/services', { params: { query }, signal })));
    },
    meta: { localized: true },
    staleTime: STALE_TIME,
  });
}

export function serviceDetailQueryOptions(serviceId: string) {
  return queryOptions({
    queryKey: servicesKeys.detail(serviceId),
    queryFn: async ({ signal }) =>
      toService(
        unwrap(
          await apiClient.GET('/admin/services/{serviceID}', {
            params: { path: { serviceID: serviceId } },
            signal,
          }),
        ),
      ),
    meta: { localized: true },
    staleTime: STALE_TIME,
  });
}

/** The catalog categories, in catalog order. */
export function serviceCategoriesQueryOptions() {
  return queryOptions({
    queryKey: servicesKeys.categories(),
    queryFn: async ({ signal }) => {
      const result = unwrap(await apiClient.GET('/admin/services/categories', { signal }));
      return sortCategories((result.items ?? []).map(toServiceCategory));
    },
    meta: { localized: true },
    staleTime: STALE_TIME,
  });
}
