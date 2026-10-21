import type { ActivityItem, ActivityPayload } from '../model/refresh';

export const activityKeys = {
  all: ['activity'] as const,
  recent: () => [...activityKeys.all, 'recent'] as const,
};

export type { ActivityItem, ActivityPayload };
