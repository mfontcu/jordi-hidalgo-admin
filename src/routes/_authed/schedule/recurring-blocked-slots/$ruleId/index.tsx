import { createFileRoute } from '@tanstack/react-router';

import { RoutePlaceholderScreen } from '@/features/shell';

export const Route = createFileRoute('/_authed/schedule/recurring-blocked-slots/$ruleId/')({
  staticData: { screen: 'recurringBlockedSlotDetail' },
  component: RoutePlaceholderScreen,
});
