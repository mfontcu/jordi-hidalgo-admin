import { createFileRoute } from '@tanstack/react-router';

import {
  blockedSlotListParamsOf,
  blockedSlotsListQueryOptions,
  blockedSlotsSearchSchema,
  BlockedSlotsScreen,
  recurringRuleListParamsOf,
  recurringRulesQueryOptions,
  tabOf,
} from '@/features/schedule';
import { businessToday } from '@/shared/lib/business-time';

// A failed prefetch is the screen's to show.
const ignore = () => undefined;

export const Route = createFileRoute('/_authed/schedule/blocked-slots/')({
  validateSearch: blockedSlotsSearchSchema,
  staticData: { screen: 'blockedSlots' },
  // Starts the open tab's request on hover and on entry; the screen shows its own loading and errors.
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context, deps: { search } }) => {
    if (tabOf(search) === 'recurring') {
      void context.queryClient
        .query(recurringRulesQueryOptions(recurringRuleListParamsOf(search)))
        .catch(ignore);
    } else {
      void context.queryClient
        .query(blockedSlotsListQueryOptions(blockedSlotListParamsOf(search, businessToday())))
        .catch(ignore);
    }
  },
  component: BlockedSlotsScreen,
});
