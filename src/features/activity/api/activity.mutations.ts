import type { QueryClient } from '@tanstack/react-query';

import { apiClient, unwrap } from '@/shared/api';

import { activityKeys, type ActivityItem } from './activity.keys';

export type MarkActivityReadBody = { ids?: number[]; all?: boolean };

/** `POST /admin/activity/read`. The row stays in the list. `all` marks every unread announced row of this administrator. */
export async function markActivityRead(queryClient: QueryClient, body: MarkActivityReadBody) {
  const previous = queryClient.getQueryData<ActivityItem[]>(activityKeys.recent());
  queryClient.setQueryData<ActivityItem[]>(activityKeys.recent(), (current) => {
    if (!current) return current;
    if (body.all) return current.map((item) => ({ ...item, read: true }));
    const ids = new Set(body.ids ?? []);
    return current.map((item) => (ids.has(item.id) ? { ...item, read: true } : item));
  });
  try {
    unwrap(await apiClient.POST('/admin/activity/read', { body }));
  } catch (error) {
    queryClient.setQueryData(activityKeys.recent(), previous);
    throw error;
  }
}
