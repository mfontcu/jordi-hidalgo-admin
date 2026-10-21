import { queryOptions, type QueryClient } from '@tanstack/react-query';

import { apiClient, unwrap } from '@/shared/api';

import { activityKeys, type ActivityItem } from './activity.keys';
import { toActivityList } from './activity.mappers';

/** The bell keeps the same window the API returns. */
const activityListLimit = 100;

/** The 100 newest announced rows for this administrator, newest first. Opening the list does not mark them. */
export function recentActivityQueryOptions() {
  return queryOptions({
    queryKey: activityKeys.recent(),
    queryFn: async ({ signal }) => {
      const result = unwrap(
        await apiClient.GET('/admin/activity', { params: { query: { announce: true } }, signal }),
      );
      return toActivityList(result.items);
    },
  });
}

/** Adds a live announced row at the top, still unread. A row already in the list stays where it is. */
export function appendRecentActivity(queryClient: QueryClient, item: ActivityItem) {
  queryClient.setQueryData<ActivityItem[]>(activityKeys.recent(), (current) => {
    if (!current || current.some((row) => row.id === item.id)) return current;
    return [{ ...item, read: false }, ...current].slice(0, activityListLimit);
  });
}
