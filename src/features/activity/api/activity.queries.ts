import { queryOptions, type QueryClient } from '@tanstack/react-query';

import { apiClient, unwrap } from '@/shared/api';

import { activityKeys, type ActivityItem } from './activity.keys';
import { toActivityList } from './activity.mappers';

/** Unread announced rows for this administrator, newest first. Opening the list does not mark them. */
export function unreadActivityQueryOptions() {
  return queryOptions({
    queryKey: activityKeys.unread(),
    queryFn: async ({ signal }) => {
      const result = unwrap(
        await apiClient.GET('/admin/activity', { params: { query: { announce: true } }, signal }),
      );
      // The API returns the oldest row first.
      return toActivityList(result.items).reverse();
    },
  });
}

/** Adds a live announced row at the top. A row already in the list stays where it is. */
export function appendUnreadActivity(queryClient: QueryClient, item: ActivityItem) {
  queryClient.setQueryData<ActivityItem[]>(activityKeys.unread(), (current) => {
    if (!current || current.some((row) => row.id === item.id)) return current;
    return [item, ...current];
  });
}
