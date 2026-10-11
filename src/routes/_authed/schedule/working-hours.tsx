import { createFileRoute } from '@tanstack/react-router';

import { RoutePlaceholderScreen } from '@/features/shell';

export const Route = createFileRoute('/_authed/schedule/working-hours')({
  staticData: { screen: 'workingHours' },
  component: RoutePlaceholderScreen,
});
