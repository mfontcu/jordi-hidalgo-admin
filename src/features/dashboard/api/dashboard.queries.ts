import { queryOptions } from '@tanstack/react-query';

import { apiClient, unwrap } from '@/shared/api';

import { dashboardKeys } from './dashboard.keys';
import { toDashboardSummary } from './dashboard.mappers';

// The next appointment's service name follows `Accept-Language`, so a language change refetches it.

const STALE_TIME = 10_000;

/** `GET /admin/dashboard/summary`. */
export function dashboardSummaryQueryOptions() {
  return queryOptions({
    queryKey: dashboardKeys.summary(),
    queryFn: async ({ signal }) =>
      toDashboardSummary(unwrap(await apiClient.GET('/admin/dashboard/summary', { signal }))),
    meta: { localized: true },
    staleTime: STALE_TIME,
  });
}
