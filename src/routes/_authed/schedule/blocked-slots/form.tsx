import { createFileRoute } from '@tanstack/react-router';

import { RoutePlaceholderScreen } from '@/features/shell';

export const Route = createFileRoute('/_authed/schedule/blocked-slots/form')({
  staticData: { screen: 'blockedSlotForm' },
  component: RoutePlaceholderScreen,
});
