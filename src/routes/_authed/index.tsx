import { createFileRoute } from '@tanstack/react-router';

import { RoutePlaceholderScreen } from '@/features/shell';

export const Route = createFileRoute('/_authed/')({
  staticData: { screen: 'dashboard' },
  component: RoutePlaceholderScreen,
});
