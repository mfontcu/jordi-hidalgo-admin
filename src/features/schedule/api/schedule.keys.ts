import type { BlockedSlotListParams, RecurringRuleListParams } from '../model/blocked-slots-search';

/**
 * Query keys of the schedule feature, by backend resource. Writes invalidate the lists of their
 * resource (every page and filter, which hold the summary counts) and the details they change.
 */
export const scheduleKeys = {
  all: ['schedule'] as const,
  workingHours: () => [...scheduleKeys.all, 'workingHours'] as const,

  blockedSlots: () => [...scheduleKeys.all, 'blockedSlots'] as const,
  blockedSlotLists: () => [...scheduleKeys.blockedSlots(), 'list'] as const,
  blockedSlotList: (params: BlockedSlotListParams) => [...scheduleKeys.blockedSlotLists(), params] as const,
  blockedSlot: (id: string) => [...scheduleKeys.blockedSlots(), 'detail', id] as const,

  rules: () => [...scheduleKeys.all, 'rules'] as const,
  ruleLists: () => [...scheduleKeys.rules(), 'list'] as const,
  ruleList: (params: RecurringRuleListParams) => [...scheduleKeys.ruleLists(), params] as const,
  rule: (id: string) => [...scheduleKeys.rules(), 'detail', id] as const,
  ruleExceptions: (id: string) => [...scheduleKeys.rules(), 'exceptions', id] as const,
};
