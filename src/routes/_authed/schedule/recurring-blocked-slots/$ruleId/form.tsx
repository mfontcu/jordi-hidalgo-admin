import { createFileRoute } from '@tanstack/react-router';

import {
  recurringRuleDetailQueryOptions,
  RecurringRuleFormScreen,
  ruleExceptionsQueryOptions,
} from '@/features/schedule';

// A failed prefetch is the screen's to show.
const ignore = () => undefined;

export const Route = createFileRoute('/_authed/schedule/recurring-blocked-slots/$ruleId/form')({
  staticData: { screen: 'recurringBlockedSlotForm' },
  loader: ({ context, params }) => {
    void context.queryClient.query(recurringRuleDetailQueryOptions(params.ruleId)).catch(ignore);
    void context.queryClient.query(ruleExceptionsQueryOptions(params.ruleId)).catch(ignore);
  },
  component: RecurringRuleFormScreen,
});
