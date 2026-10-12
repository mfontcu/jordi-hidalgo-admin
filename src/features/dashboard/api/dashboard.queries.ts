import { queryOptions } from '@tanstack/react-query';

import { apiClient, unwrap } from '@/shared/api';

import { dashboardKeys } from './dashboard.keys';
import { toDashboardSummary } from './dashboard.mappers';

// The summary's service name is stored in Spanish by the backend, so a language change does not
// refetch it.

const STALE_TIME = 10_000;

/** `GET /admin/dashboard/summary`. */
export function dashboardSummaryQueryOptions() {
  return queryOptions({
    queryKey: dashboardKeys.summary(),
    queryFn: async ({ signal }) =>
      toDashboardSummary(unwrap(await apiClient.GET('/admin/dashboard/summary', { signal }))),
    staleTime: STALE_TIME,
  });
}
