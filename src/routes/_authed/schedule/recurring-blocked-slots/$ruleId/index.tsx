import { createFileRoute } from '@tanstack/react-router';

import {
  recurringRuleDetailQueryOptions,
  RecurringRuleDetailScreen,
  ruleExceptionsQueryOptions,
} from '@/features/schedule';

// A failed prefetch is the screen's to show.
const ignore = () => undefined;

export const Route = createFileRoute('/_authed/schedule/recurring-blocked-slots/$ruleId/')({
  staticData: { screen: 'recurringBlockedSlotDetail' },
  loader: ({ context, params }) => {
    void context.queryClient.query(recurringRuleDetailQueryOptions(params.ruleId)).catch(ignore);
    void context.queryClient.query(ruleExceptionsQueryOptions(params.ruleId)).catch(ignore);
  },
  component: RecurringRuleDetailScreen,
});
