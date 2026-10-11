import { createFileRoute } from '@tanstack/react-router';

import { RoutePlaceholderScreen } from '@/features/shell';

export const Route = createFileRoute('/_authed/schedule/slot-watches')({
  staticData: { screen: 'slotWatches' },
  component: RoutePlaceholderScreen,
});
