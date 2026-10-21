import type { QueryClient } from '@tanstack/react-query';

import { apiClient, unwrap } from '@/shared/api';

import { activityKeys, type ActivityItem } from './activity.keys';

export type MarkActivityReadBody = { ids?: number[]; all?: boolean };

/** `POST /admin/activity/read`. `all` marks every unread announced row of this administrator. */
export async function markActivityRead(queryClient: QueryClient, body: MarkActivityReadBody) {
  const previous = queryClient.getQueryData<ActivityItem[]>(activityKeys.unread());
  queryClient.setQueryData<ActivityItem[]>(activityKeys.unread(), (current) => {
    if (!current) return current;
    if (body.all) return [];
    const ids = new Set(body.ids ?? []);
    return current.filter((item) => !ids.has(item.id));
  });
  try {
    unwrap(await apiClient.POST('/admin/activity/read', { body }));
  } catch (error) {
    queryClient.setQueryData(activityKeys.unread(), previous);
    throw error;
  }
}
