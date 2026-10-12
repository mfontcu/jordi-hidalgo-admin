import { createFileRoute } from '@tanstack/react-router';

import { RecurringRuleFormScreen } from '@/features/schedule';

export const Route = createFileRoute('/_authed/schedule/recurring-blocked-slots/form')({
  staticData: { screen: 'recurringBlockedSlotForm' },
  component: RecurringRuleFormScreen,
});
