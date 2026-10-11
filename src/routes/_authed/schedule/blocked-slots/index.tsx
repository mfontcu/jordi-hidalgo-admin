import { createFileRoute } from '@tanstack/react-router';

import { blockedSlotsSearchSchema, RoutePlaceholderScreen } from '@/features/shell';

export const Route = createFileRoute('/_authed/schedule/blocked-slots/')({
  validateSearch: blockedSlotsSearchSchema,
  staticData: { screen: 'blockedSlots' },
  component: RoutePlaceholderScreen,
});
