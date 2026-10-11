import { createFileRoute } from '@tanstack/react-router';

import { RoutePlaceholderScreen } from '@/features/shell';

export const Route = createFileRoute('/_authed/schedule/recurring-blocked-slots/$ruleId/form')({
  staticData: { screen: 'recurringBlockedSlotForm' },
  component: RoutePlaceholderScreen,
});
