import { queryOptions } from '@tanstack/react-query';

import { apiClient, unwrap } from '@/shared/api';
import type { BusinessDay } from '@/shared/lib/business-time';

import { slotWatchKeys } from './slot-watches.keys';
import { toSlotWatches } from './slot-watches.mappers';

// Service names come localized from `Accept-Language` (`meta.localized`). The date, when set, is
// the only filter the backend applies; the screen filters the rest.

const STALE_TIME = 10_000;

/** `GET /admin/slot-watches`, for one salon day or for every open watch. */
export function slotWatchesQueryOptions(date: BusinessDay | null) {
  return queryOptions({
    queryKey: slotWatchKeys.list(date),
    queryFn: async ({ signal }) =>
      toSlotWatches(
        unwrap(
          await apiClient.GET('/admin/slot-watches', {
            params: { query: date ? { date } : {} },
            signal,
          }),
        ),
      ),
    meta: { localized: true },
    staleTime: STALE_TIME,
  });
}
