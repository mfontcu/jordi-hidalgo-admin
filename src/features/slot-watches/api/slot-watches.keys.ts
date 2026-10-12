import type { BusinessDay } from '@/shared/lib/business-time';

/** Query keys of the slot-watch list. A cancel refreshes every loaded day. */
export const slotWatchKeys = {
  all: ['slot-watches'] as const,
  lists: () => [...slotWatchKeys.all, 'list'] as const,
  list: (date: BusinessDay | null) => [...slotWatchKeys.lists(), date] as const,
};
