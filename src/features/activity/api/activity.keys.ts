import type { ActivityItem, ActivityPayload } from '../model/refresh';

export const activityKeys = {
  all: ['activity'] as const,
  unread: () => [...activityKeys.all, 'unread'] as const,
};

export type { ActivityItem, ActivityPayload };
